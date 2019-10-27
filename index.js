const httpContext = require('express-http-context');
const glob = require("glob");
const express = require('express');
const bodyParser = require('body-parser');

const types = require('./lib/types.js');
const config = require('./lib/config.js');
const parser = require('./lib/parser.js');
const sessionManager = require('./lib/session.js');

sessionManager.configure({
    partners: config.get('partners')
});

const app = express();
app.use(httpContext.middleware);
app.use(bodyParser.json());

app.use((error, request, response, next) => {
    if (error instanceof SyntaxError) {
        response.send({
            executionTime: (Date.now() - response.startTime),
            result: {
                error: new types.KalturaAPIException(KalturaExceptionTypes.INVALID_JSON_FORMAT)
            }
        });
    } else {
      next();
    }
});


var KalturaExceptionTypes = {
    INTERNAL_SERVER_ERROR: new types.KalturaExceptionType('INTERNAL_SERVER_ERROR', 'Internal Server Error'),
    INVALID_JSON_FORMAT: new types.KalturaExceptionType('INVALID_JSON_FORMAT', 'Invalid JSON format'),
    INVALID_SERVICE: new types.KalturaExceptionType('INVALID_SERVICE', 'Service [{service}] not found'),
    INVALID_ACTION: new types.KalturaExceptionType('INVALID_ACTION', 'Action [{service}.{action}] not found'),
    ACTION_NOT_SPECIFIED: new types.KalturaExceptionType('ACTION_NOT_SPECIFIED', 'Action not specified'),
    ARGUMENT_CANNOT_BE_EMPTY: new types.KalturaExceptionType('ARGUMENT_CANNOT_BE_EMPTY', 'Argument [{argument}] cannot be empty'),
    ARGUMENT_MUST_BE_NUMERIC: new types.KalturaExceptionType('ARGUMENT_MUST_BE_NUMERIC', 'Argument [{argument}] must be numeric'),
    ARGUMENT_MIN_LENGTH_CROSSED: new types.KalturaExceptionType('ARGUMENT_MIN_LENGTH_CROSSED', 'Argument [{argument}] minimum length is [{value}]'),
    ARGUMENT_MAX_LENGTH_CROSSED: new types.KalturaExceptionType('ARGUMENT_MAX_LENGTH_CROSSED', 'Argument [{argument}] maximum length is [{value}]'),
    ARGUMENT_MIN_VALUE_CROSSED: new types.KalturaExceptionType('ARGUMENT_MIN_VALUE_CROSSED', 'Argument [{argument}] minimum value is [{value}]'),
    ARGUMENT_MAX_VALUE_CROSSED: new types.KalturaExceptionType('ARGUMENT_MAX_VALUE_CROSSED', 'Argument [{argument}] maximum value is [{value}]'),
    INVALID_AGRUMENT_VALUE: new types.KalturaExceptionType('ARGUMENT_MAX_VALUE_CROSSED', 'Argument [{argument}] value must be of type [{value}]'),
    TYPE_NOT_SUPPORTED: new types.KalturaExceptionType('TYPE_NOT_SUPPORTED', 'Type [{value}] is not supported for argument [{argument}]'),
    ABSTRACT_PARAMETER: new types.KalturaExceptionType('ABSTRACT_PARAMETER', 'Abstract parameter type [{type}]'),
    ARGUMENT_STRING_SHOULD_BE_ENUM: new types.KalturaExceptionType('ARGUMENT_STRING_SHOULD_BE_ENUM', 'Argument [{argument}] values must be of type [{enum}]'),
};

function parseValue(arg, value) {
    switch(arg.type) {
        case 'time':
        case 'number':
            if(isNaN(value)) {
                throw new types.KalturaAPIException(KalturaExceptionTypes.ARGUMENT_MUST_BE_NUMERIC, {argument: arg.name});
            }
            value = parseInt(value);
            if(arg.minValue && value < arg.minValue) {
                throw new types.KalturaAPIException(KalturaExceptionTypes.ARGUMENT_MIN_VALUE_CROSSED, {argument: arg.name, value: arg.minValue});
            }
            if(arg.maxValue && value > arg.maxValue) {
                throw new types.KalturaAPIException(KalturaExceptionTypes.ARGUMENT_MAX_VALUE_CROSSED, {argument: arg.name, value: arg.maxValue});
            }
            return value;

        case 'string':
            value = value.toString();
            if(arg.minLength && value.length < arg.minLength) {
                throw new types.KalturaAPIException(KalturaExceptionTypes.ARGUMENT_MIN_LENGTH_CROSSED, {argument: arg.name, value: arg.minLength});
            }
            if(arg.maxLength && value.length > arg.maxLength) {
                throw new types.KalturaAPIException(KalturaExceptionTypes.ARGUMENT_MAX_LENGTH_CROSSED, {argument: arg.name, value: arg.maxLength});
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
                    throw new types.KalturaAPIException(KalturaExceptionTypes.INVALID_AGRUMENT_VALUE, {argument: arg.name, value: 'boolean'});
            }
        
        default:
            var type = arg.objectType;
            if(type.type === 'object') {
                if(value.objectType && value.objectType != type.name) {
                    if(!type.children[value.objectType]) {
                        throw new types.KalturaAPIException(KalturaExceptionTypes.TYPE_NOT_SUPPORTED, {argument: arg.name, value: value.objectType});
                    }
                    type = type.children[value.objectType];
                }
                if(type.abstract) {
                    throw new types.KalturaAPIException(KalturaExceptionTypes.ABSTRACT_PARAMETER, {type: type.name});                
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
            else if(type.type === 'enum') {
                if(!type.enum.exists(value)) {
                    throw new types.KalturaAPIException(KalturaExceptionTypes.ARGUMENT_STRING_SHOULD_BE_ENUM, {argument: arg.name, enum: type.name});
                }
                return value;
            }
            throw 'unknown type'; // TODO
    }
}

function handleAction(action, request) {
    var args = [];
    if(action.args) {
        args = action.args.map(arg => {   
            if(request[arg.name] == null || typeof request[arg.name] == 'undefined') {
                if(!arg.optional) {
                    throw new types.KalturaAPIException(KalturaExceptionTypes.ARGUMENT_CANNOT_BE_EMPTY, {argument: arg.name});
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
        throw new types.KalturaAPIException(KalturaExceptionTypes.INVALID_SERVICE);
    }
    if(!action) {
        throw new types.KalturaAPIException(KalturaExceptionTypes.ACTION_NOT_SPECIFIED);
    }
    if(!Nhoenix.controllers[service]) {
        throw new types.KalturaAPIException(KalturaExceptionTypes.INVALID_SERVICE, {service: service});
    }
    if(!Nhoenix.controllers[service].actions[action]) {
        throw new types.KalturaAPIException(KalturaExceptionTypes.INVALID_ACTION, {service: service, action: action});
    }

    return handleAction(Nhoenix.controllers[service].actions[action], request);
}

function handle(service, action, request, response) {
    response.startTime = Date.now();
    try{
        if(request.ks) {
            var session  = sessionManager.parse(request.ks);
            //console.log('pre', session);
            //httpContext.set('session', session);
            //var s = Nhoenix.getSession();
        }
        var result = handleRequest(service, action, request);
        response.send({
            executionTime: (Date.now() - response.startTime),
            result: result
        });
    }
    catch(err) {
        console.error(err);
        if(! err instanceof types.KalturaAPIException) {
            err = new types.KalturaAPIException(KalturaExceptionTypes.INTERNAL_SERVER_ERROR);
        }
        response.send({
            executionTime: (Date.now() - response.startTime),
            result: {
                error: err
            }
        });
    }
}

class Controller {
    constructor(session) {
        if(session) {
            this.session = session;
        }
    }
}

const Nhoenix = {
    Controller: Controller,

    start: () => {
        app.use((request, response, next) => {
            console.log('123');
            httpContext.set('test', 'sdf');
            next();
        });

        app.post(Nhoenix.options.basePath, (request, response) => {
            setTimeout(() => {
                console.log('test', httpContext.get('test'));
            }, 1000);            
            handle(request.body.service, request.body.action, request.body, response);
        });
        
        app.post(`${Nhoenix.options.basePath}/service/:service/action/:action`, (request, response) => {
            handle(request.params.service, request.params.action, request.body, response);
        });
        
        app.listen(Nhoenix.options.http.port);
    },

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

    getSession: () => {
        return httpContext.get('session');
    },

    test: handleRequest
}

module.exports = Object.assign(Nhoenix, types);