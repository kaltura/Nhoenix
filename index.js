const glob = require("glob");
const jsdoc = require('jsdoc-api');
const format = require("string-template")
const express = require('express');
const bodyParser = require('body-parser');

const parser = require('./lib/parser.js');

const app = express();

class KalturaObject {
    static implementProperties(clazz) {
        if(clazz.implemented) {
            return;
        }
        clazz.implemented = true;

        var base = Object.getPrototypeOf(clazz);
        if(base.name !== 'KalturaObject') {
            KalturaObject.implementProperties(base);
        }

        var doc = jsdoc.explainSync({source: clazz.toString()});
        var properties = doc.filter(comment => comment.properties);
        properties.forEach(property => {
            var methodName = property.name;
            var propertyName = property.properties[0].name;
            if(!clazz.prototype[methodName] || clazz.prototype[methodName].toString().match('[^{}]}$')) {
                return;
            }
            
            clazz.prototype[methodName] = function() {
                if(arguments.length) {
                    this[propertyName] = arguments[0];
                }
                else {
                    return this[propertyName];
                }
            };
        });
    }

    constructor() {
        this.constructor.implementProperties(this.constructor);
        this.objectType = this.constructor.name;
    }
}

class KalturaAPIException extends KalturaObject {
    constructor(code, message, args) {
        super();
        if(code instanceof KalturaExceptionType) {
            args = message;
            this.message = format(code.template, args);
            this.code = code.code;
            this.args = args;
        }
        else {
            this.message = message;
            this.code = code;
            this.args = args;
        }
    }
}

class KalturaExceptionType {
    constructor(code, template) {
      this.code = code;
      this.template = template;
    }
}

var KalturaExceptionTypes = {
    INTERNAL_SERVER_ERROR: new KalturaExceptionType('INTERNAL_SERVER_ERROR', 'Internal Server Error'),
    INVALID_SERVICE: new KalturaExceptionType('INVALID_SERVICE', 'Service [{service}] not found'),
    INVALID_ACTION: new KalturaExceptionType('INVALID_ACTION', 'Action [{service}.{action}] not found'),
    ACTION_NOT_SPECIFIED: new KalturaExceptionType('ACTION_NOT_SPECIFIED', 'Action not specified'),
    ARGUMENT_CANNOT_BE_EMPTY: new KalturaExceptionType('ARGUMENT_CANNOT_BE_EMPTY', 'Argument [{argument}] cannot be empty'),
    ARGUMENT_MUST_BE_NUMERIC: new KalturaExceptionType('ARGUMENT_MUST_BE_NUMERIC', 'Argument [{argument}] must be numeric'),
    ARGUMENT_MIN_LENGTH_CROSSED: new KalturaExceptionType('ARGUMENT_MIN_LENGTH_CROSSED', 'Argument [{argument}] minimum length is [{value}]'),
    ARGUMENT_MAX_LENGTH_CROSSED: new KalturaExceptionType('ARGUMENT_MAX_LENGTH_CROSSED', 'Argument [{argument}] maximum length is [{value}]'),
    ARGUMENT_MIN_VALUE_CROSSED: new KalturaExceptionType('ARGUMENT_MIN_VALUE_CROSSED', 'Argument [{argument}] minimum value is [{value}]'),
    ARGUMENT_MAX_VALUE_CROSSED: new KalturaExceptionType('ARGUMENT_MAX_VALUE_CROSSED', 'Argument [{argument}] maximum value is [{value}]'),
    INVALID_AGRUMENT_VALUE: new KalturaExceptionType('ARGUMENT_MAX_VALUE_CROSSED', 'Argument [{argument}] value must be of type [{value}]'),
    TYPE_NOT_SUPPORTED: new KalturaExceptionType('TYPE_NOT_SUPPORTED', 'Type [{value}] is not supported for argument [{argument}]'),
    ABSTRACT_PARAMETER: new KalturaExceptionType('ABSTRACT_PARAMETER', 'Abstract parameter type [{type}]'),
};

function parseValue(arg, value) {
    switch(arg.type) {
        case 'time':
        case 'number':
            if(isNaN(value)) {
                throw new KalturaAPIException(KalturaExceptionTypes.ARGUMENT_MUST_BE_NUMERIC, {argument: arg.name});
            }
            value = parseInt(value);
            if(arg.minValue && value < arg.minValue) {
                throw new KalturaAPIException(KalturaExceptionTypes.ARGUMENT_MIN_VALUE_CROSSED, {argument: arg.name, value: arg.minValue});
            }
            if(arg.maxValue && value > arg.maxValue) {
                throw new KalturaAPIException(KalturaExceptionTypes.ARGUMENT_MAX_VALUE_CROSSED, {argument: arg.name, value: arg.maxValue});
            }
            return value;

        case 'string':
            value = value.toString();
            if(arg.minLength && value.length < arg.minLength) {
                throw new KalturaAPIException(KalturaExceptionTypes.ARGUMENT_MIN_LENGTH_CROSSED, {argument: arg.name, value: arg.minLength});
            }
            if(arg.maxLength && value.length > arg.maxLength) {
                throw new KalturaAPIException(KalturaExceptionTypes.ARGUMENT_MAX_LENGTH_CROSSED, {argument: arg.name, value: arg.maxLength});
            }
            return value;
            
        case 'boolean':
            switch(value) {
                case 1:
                case '1':
                case true:
                case 'true':
                    return true;
                    
                case 0:
                case '0':
                case false:
                case 'false':
                    return false;

                default:
                    throw new KalturaAPIException(KalturaExceptionTypes.INVALID_AGRUMENT_VALUE, {argument: arg.name, value: 'boolean'});
            }
        
        default:
            var type = arg.objectType;
            if(value.objectType && value.objectType != type.name) {
                if(!type.children[value.objectType]) {
                    throw new KalturaAPIException(KalturaExceptionTypes.TYPE_NOT_SUPPORTED, {argument: arg.name, value: value.objectType});
                }
                type = type.children[value.objectType];
            }
            if(type.abstract) {
                throw new KalturaAPIException(KalturaExceptionTypes.ABSTRACT_PARAMETER, {type: type.name});                
            }
            
            var obj = new type.class();
            type.properties.forEach(property => {
                if(value[property.name] !== undefined) {
                    obj[property.name] = parseValue(property, value[property.name]);
                }
            });
            
            var baseType = type.baseType;
            while(baseType) {
                baseType.properties.forEach(property => {
                    if(value[property.name] !== undefined) {
                        obj[property.name] = parseValue(property, value[property.name]);
                    }
                });
                baseType = baseType.baseType;
            }
            
            return obj;
    }
}

function handleAction(action, request) {
    var args = [];
    if(action.args) {
        args = action.args.map(arg => {   
            if(request[arg.name] == null || typeof request[arg.name] == 'undefined') {
                if(!arg.optional) {
                    throw new KalturaAPIException(KalturaExceptionTypes.ARGUMENT_CANNOT_BE_EMPTY, {argument: arg.name});
                }
                return null;
            }
            return parseValue(arg, request[arg.name]);
        });
    }
    var ret = action.method.apply(null, args);
    if(!action.returnType) {
        return null;
    }
    
    return ret;
}

function handleRequest(service, action, request) {
    if(!service) {
        throw new KalturaAPIException(KalturaExceptionTypes.INVALID_SERVICE);
    }
    if(!action) {
        throw new KalturaAPIException(KalturaExceptionTypes.ACTION_NOT_SPECIFIED);
    }
    if(!Nhoenix.controllers[service]) {
        throw new KalturaAPIException(KalturaExceptionTypes.INVALID_SERVICE, {service: service});
    }
    if(!Nhoenix.controllers[service].actions[action]) {
        throw new KalturaAPIException(KalturaExceptionTypes.INVALID_ACTION, {service: service, action: action});
    }

    return handleAction(Nhoenix.controllers[service].actions[action], request);
}

async function handle(service, action, request, response) {
    response.startTime = Date.now();
    try{
        var result = await handleRequest(service, action, request);
        response.send({
            executionTime: (Date.now() - response.startTime),
            result: result
        });
    }
    catch(err) {
        console.error(err);
        if(! err instanceof KalturaAPIException) {
            err = new KalturaAPIException(KalturaExceptionTypes.INTERNAL_SERVER_ERROR);
        }
        response.send({
            executionTime: (Date.now() - response.startTime),
            result: {
                error: err
            }
        });
    }
}

const Nhoenix = {
    start: () => {
        app.use(bodyParser.json());

        app.post(Nhoenix.options.basePath, (request, response) => {
            handle(request.body.service, request.body.action, request.body, response);
        });        
        app.post(`${Nhoenix.options.basePath}/service/:service/action/:action`, (request, response) => {
            handle(request.params.service, request.params.action, request.body, response);
        });
  
        app.listen(Nhoenix.options.http.port);
    }
};

module.exports = {
    KalturaObject: KalturaObject,
    KalturaAPIException: KalturaAPIException,
    KalturaExceptionType: KalturaExceptionType,

    configure: options => {
        options = options || {};
        options.http = options.http || {
            port: 80
        };
        options.https = options.https || {
            port: 443
        };
        options.basePath = options.basePath || '/api_v3';

        Nhoenix.options = options;
    },

    /**
     * @param {object}
     */
    use: controllers => {
        if(typeof controllers === 'string') {
            controllers = glob.sync(`${controllers}/*.js`);
        }
        Nhoenix.controllers = parser.controllers(controllers);
    },

    test: handleRequest,

    start: Nhoenix.start
};