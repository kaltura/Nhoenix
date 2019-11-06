const glob = require("glob");
const express = require('express');
const bodyParser = require('body-parser');

const types = require('./lib/types.js');
const config = require('./lib/config.js');
const parser = require('./lib/parser.js');
const sessionManager = require('./lib/session.js');

const app = express();
app.use(bodyParser.json());

app.use((error, request, response, next) => {
    if (error instanceof SyntaxError) {
        response.send({
            executionTime: (Date.now() - response.startTime),
            result: {
                error: new types.KalturaAPIException(types.ExceptionType.INVALID_JSON_FORMAT)
            }
        });
    } else {
      next();
    }
});

function parseValue(arg, value) {
    switch(arg.type) {
        case 'time':
        case 'number':
            if(isNaN(value)) {
                throw new types.KalturaAPIException(types.ExceptionType.ARGUMENT_MUST_BE_NUMERIC, {argument: arg.name});
            }
            value = parseInt(value);
            if(arg.minValue && value < arg.minValue) {
                throw new types.KalturaAPIException(types.ExceptionType.ARGUMENT_MIN_VALUE_CROSSED, {argument: arg.name, value: arg.minValue});
            }
            if(arg.maxValue && value > arg.maxValue) {
                throw new types.KalturaAPIException(types.ExceptionType.ARGUMENT_MAX_VALUE_CROSSED, {argument: arg.name, value: arg.maxValue});
            }
            return value;

        case 'string':
            value = value.toString();
            if(arg.minLength && value.length < arg.minLength) {
                throw new types.KalturaAPIException(types.ExceptionType.ARGUMENT_MIN_LENGTH_CROSSED, {argument: arg.name, value: arg.minLength});
            }
            if(arg.maxLength && value.length > arg.maxLength) {
                throw new types.KalturaAPIException(types.ExceptionType.ARGUMENT_MAX_LENGTH_CROSSED, {argument: arg.name, value: arg.maxLength});
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
                    throw new types.KalturaAPIException(types.ExceptionType.INVALID_AGRUMENT_VALUE, {argument: arg.name, value: 'boolean'});
            }
        
        default:
            var type = arg.objectType;
            if(type.type === 'object') {
                if(value.objectType && value.objectType != type.name) {
                    if(!type.children[value.objectType]) {
                        throw new types.KalturaAPIException(types.ExceptionType.TYPE_NOT_SUPPORTED, {argument: arg.name, value: value.objectType});
                    }
                    type = type.children[value.objectType];
                }
                if(type.abstract) {
                    throw new types.KalturaAPIException(types.ExceptionType.ABSTRACT_PARAMETER, {type: type.name});                
                }
                
                var obj = new type.class();
                type.properties.forEach(property => {
                    if(value[property.name] !== undefined) {
                        obj[property.methodName].apply(obj, [parseValue(property, value[property.name])]);
                    }
                });
                
                var baseType = type.baseType;
                while(baseType) {
                    if(baseType.properties) {
                        baseType.properties.forEach(property => {
                            if(value[property.name] !== undefined) {
                                obj[property.methodName].apply(obj, [parseValue(property, value[property.name])]);
                            }
                        });
                    }
                    baseType = baseType.baseType;
                }
            
                return obj;
            }
            else if(type.type === 'enum') {
                if(!type.enum.exists(value)) {
                    throw new types.KalturaAPIException(types.ExceptionType.ARGUMENT_STRING_SHOULD_BE_ENUM, {argument: arg.name, enum: type.name});
                }
                return value;
            }
            throw 'unknown type'; // TODO
    }
}

async function handleAction(controllerClass, action, request) {
    var args = [];
    var session;

    if(request) {
        if(action.args) {
            args = action.args.map(arg => {   
                if(request[arg.name] == null || typeof request[arg.name] == 'undefined') {
                    if(!arg.optional) {
                        throw new types.KalturaAPIException(types.ExceptionType.ARGUMENT_CANNOT_BE_EMPTY, {argument: arg.name});
                    }
                    return null;
                }
                return parseValue(arg, request[arg.name]);
            });
        }
        if(request.ks) {
            session = sessionManager.parse(request.ks);
        }
    }

    var controller = new controllerClass(session);
    var ret = await action.method.apply(controller, args);
    if(!action.returnType) {
        return null;
    }
    
    return ret;
}

async function handleRequest(service, action, request) {
    if(!service) {
        throw new types.KalturaAPIException(types.ExceptionType.INVALID_SERVICE);
    }
    if(!action) {
        throw new types.KalturaAPIException(types.ExceptionType.ACTION_NOT_SPECIFIED);
    }
    if(!Nhoenix.controllers[service]) {
        throw new types.KalturaAPIException(types.ExceptionType.INVALID_SERVICE, {service: service});
    }
    if(!Nhoenix.controllers[service].actions[action]) {
        throw new types.KalturaAPIException(types.ExceptionType.INVALID_ACTION, {service: service, action: action});
    }

    return await handleAction(Nhoenix.controllers[service].class, Nhoenix.controllers[service].actions[action], request);
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
        if(! err instanceof types.KalturaAPIException) {
            err = new types.KalturaAPIException(types.ExceptionType.INTERNAL_SERVER_ERROR);
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
        app.post(config.basePath, async (request, response) => {
            await handle(request.body.service, request.body.action, request.body, response);
        });
        
        app.post(`${config.basePath}/service/:service/action/:action`, async (request, response) => {
            await handle(request.params.service, request.params.action, request.body, response);
        });
        
        app.listen(config.http.port);
    },

    configure: options => {
        options = options || {};
        options.http = config.get('http') || {
            port: 80
        };
        options.https = config.get('https') || {
            port: 443
        };
        options.basePath = config.get('basePath') || '/api_v3';

        config.assign(options);
        
        sessionManager.configure({
            partners: config.get('partners')
        });

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

    config: config
}

module.parse = true;
module.exports = Object.assign(Nhoenix, types);