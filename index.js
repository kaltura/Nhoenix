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
};

function validateArgument(arg, value) {
    // TODO
}

function handleAction(action, request) {
    var args = [];
    if(action.args) {
        args = action.args.map(arg => {            
            if(request[arg.name]) {
                var value = request[arg.name];
                validateArgument(arg, value);
                return value;
            }
            else {
                if(!arg.optional) {
                    throw new KalturaAPIException(KalturaExceptionTypes.ARGUMENT_CANNOT_BE_EMPTY, {argument: arg.name});
                }
                return null;
            }
        });
    }
    var ret = action.method.apply(null, args);
    // TODO validate type
    return ret;
}

async function handle(service, action, request, response) {
    response.startTime = Date.now();
    try{
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

        var result = await handleAction(Nhoenix.controllers[service].actions[action], request);
        response.send({
            executionTime: (Date.now() - response.startTime),
            result: result
        });
    }
    catch(err) {
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

    start: Nhoenix.start
};