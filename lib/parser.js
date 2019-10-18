
const fs = require('fs');
const jsdoc = require('jsdoc-api');

const types = [
    'boolean',
    'string',
    'number',
    'time'
];

function validateArgument(service, action, arg, validObjects) {
    if(!arg.name) {
        throw `Action [${service}.${action}] argument [${arg.index}] name not specified`;
    }
    if(!arg.name.match(/^[a-z][a-zA-Z0-9]*$/)) {
        throw `Action [${service}.${action}] argument [${arg.index}] name [${arg.name}] is invalid`;
    }
    if(!arg.description.match(/^[A-Z].+/)) {
        throw `Action [${service}.${action}] argument [${arg.index}] name [${arg.name}] is invalid`;
    }
    if(!arg.type) {
        throw `Action [${service}.${action}] argument [${arg.index}] type not specified`;
    }
    if(types.indexOf(arg.type) < 0 && !validObjects[arg.type]) {
        throw `Action [${service}.${action}] argument [${arg.index}] invalid type [${arg.type}]`;
    }

    if(arg.type === 'string') {
        var valueRestrictions = Object.keys(arg).filter(key => key.endsWith('Value'));
        if(valueRestrictions.length) {
            throw `Action [${service}.${action}] string argument [${arg.index}] invalid restrictions [${valueRestrictions.join(', ')}]`;
        }
    }
    else {
        var lengthRestrictions = Object.keys(arg).filter(key => key.endsWith('Length'));
        if(lengthRestrictions.length) {
            throw `Action [${service}.${action}] ${arg.type} argument [${arg.index}] invalid restrictions [${lengthRestrictions.join(', ')}]`;
        }
    }
}

function validateAction(service, action, validObjects) {
    if(!action.name.match(/^[a-z][a-zA-Z0-9]+$/)) {
        throw `Action [${service}.${action.name}] action name is invalid`;
    }
    if(!action.description) {
        throw `Action [${service}.${action.name}] description not specified`;
    }
    if(typeof action.description !== 'string') {
        throw `Action [${service}.${action.name}] description must be a string`;
    }
    if(!action.description.match(/^[A-Z].+/)) {
        throw `Action [${service}.${action.name}] invalid description [${action.description}]`;
    }
    // TODO validate return type
    if(action.args) {
        action.args.forEach(arg => validateArgument(service, action.name, arg, validObjects));
    }
}

function validateService(service, validObjects) {
    if(!service.name.match(/^[a-z][a-zA-Z0-9]+$/)) {
        throw `Service [${service.name}] service name is invalid`;
    }
    if(!service.description) {
        throw `Service [${service.name}] service description not specified`;
    }
    if(!service.description.match(/^[A-Z].+/)) {
        throw `Service [${service.name}] service description format is invalid`;
    }
    if(!Object.keys(service.actions).length) {
        throw `Service [${service.name}] no actions defined`;
    }
    Object.keys(service.actions).forEach(action => validateAction(service.name, service.actions[action], validObjects));
}

function parseObjects(objectsModule, objects) {
    objects = objects || {};
    objectsModule.children
    .filter(childModule => childModule.parse)
    .forEach(childModule => parseObjects(childModule, objects));
    
    var doc = jsdoc.explainSync({files: objectsModule.filename})
    
    doc
    .filter(comment => comment.kind === 'class' && comment.longname.startsWith('Kaltura'))
    .forEach(comment => {
        objects[comment.longname] = true
    });

    // TODO validate objects
    return objects;
}

function parseController(doc) {
    var file = doc.find(comment => comment.kind === 'package').files[0];
    var metadata = doc.reduce((data, comment) => {
        if(comment.tags) {
            comment.tags.forEach(tag => comment[tag.title] = (tag.value ? tag.value : true));
            delete comment.tags;
        }
        data[comment.longname] = comment;
        return data;
    }, {});

    if(!metadata['module.exports']) {
        throw `File ${file} is not a valid node module`;
    }

    var controller = require(file);
    var controllerMetadata = false;
    if(metadata['module.exports'].service) {
        controllerMetadata = metadata['module.exports'];
    }
    else if(metadata['module.exports'].meta.code.type == 'Identifier' && metadata[metadata['module.exports'].meta.code.value].service) {
        controllerMetadata = metadata[metadata['module.exports'].meta.code.value];
    }
    if(!controllerMetadata) {
        throw `File ${file} no service defined`;
    }

    var controllerModule = module.children.find(mod => mod.id === file)
    var objects = parseObjects(controllerModule);
    var service = {
        name: controllerMetadata.service,
        description: controllerMetadata.description,
        actions: doc
            .filter(comment => comment.memberof === controllerMetadata.longname && comment.action)
            .reduce((data, comment) => {
                if(comment.kind != 'function') {
                    throw `Action [${controllerMetadata.service}.${comment.action}] is not a function`;
                }

                if(data[comment.action]) {
                    throw `Action [${controllerMetadata.service}.${comment.action}] appears more than once`;
                }

                var action = {
                    name: comment.action,
                    description: comment.description,
                    method: controller[comment.name]
                };
                
                if(comment.returns && comment.returns.length && comment.returns[0].type && comment.returns[0].type.names && comment.returns[0].type.names.length) {
                    let returnType = comment.returns[0].type.names[0];
                    action.returnType = returnType;
                }

                if(action.method.length) {
                    if(!comment.params) {
                        throw `Action [${controllerMetadata.service}.${comment.action}] arguments not described`;
                    }
                    var args = false;
                    if(comment.meta.code.type === 'ArrowFunctionExpression') {
                        args = action.method.toString()
                            .replace(/[\(\)\r\n]/g, '')
                            .replace(/=>.+$/g, '')
                            .split(',')
                            .map(arg => arg.trim());
                    }

                    if(!args) {
                        throw `Action [${controllerMetadata.service}.${comment.action}] failed to parse argument names`;
                    }
                    
                    var argsFound = {};
                    action.args = comment.params.map(param => {
                        var index = args.indexOf(param.name);
                        if(index < 0) {
                            throw `Action [${controllerMetadata.service}.${comment.action}] argument [${param.name}] does not exist`;
                        }
                        if(!param.type || !param.type.names || !param.type.names.length) {
                            throw `Action [${controllerMetadata.service}.${comment.action}] argument [${param.name}] type not defined`;
                        }
                        if(!param.description || !param.description.length) {
                            throw `Action [${controllerMetadata.service}.${comment.action}] argument [${param.name}] description not defined`;
                        }
                        argsFound[param.name] = true;

                        var description = param.description.replace(/@.+$/, '').trim();
                        var arg = {
                            index: index,
                            name: param.name,
                            type: param.type.names[0],
                            description: description,
                        };
                        
                        var tags = param.description.split('@');
                        if(tags.length > 1) {
                            tags.slice(1).forEach(tag => {
                                var parts = tag.trim().split(' ');
                                var tag = parts[0];
                                var value = parts[1];
                                if(tag.startsWith('min') || tag.startsWith('max')) {
                                    if(isNaN(value)) {
                                        throw `Action [${controllerMetadata.service}.${comment.action}] argument [${param.name}] ${tag} is not a number`;
                                    }
                                    value = parseInt(value);
                                }
                                arg[tag] = value;
                            });
                        }
                        return arg;
                    })
                    .sort((a, b) => a.index > b.index);
                    if(args.length > action.args.length) {
                        var notFound = args.filter(arg => !argsFound[arg]).join(', ');
                        throw `Action [${controllerMetadata.service}.${comment.action}] missing arguments [${notFound}] definitions`;
                    }
                }

                data[comment.action] = action;
                return data;
            }, {})
    };

    validateService(service, objects);
    return service;
}

function parseControllers(files) {
    if(!Array.isArray(files) || !files.length) {
        throw `Controllers expected to be array of file paths`;
    }
    files.forEach(file => {
        if(!fs.existsSync(file)) {
            throw `Controller file [${file}] does not exist`;
        }
    })
    var controllers = files.map(file => parseController(jsdoc.explainSync({files: file})));
    return controllers.reduce((data, controller) => {    
        if(data[controller.name]) {
            throw `Service [${controller.name}] appears more than once`;
        }
        data[controller.name] = controller;
        return data;
    }, {});
}

module.exports = {
    controllers: parseControllers,
};