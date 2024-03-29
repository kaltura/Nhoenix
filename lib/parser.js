
const fs = require('fs');
const path = require('path');
const jsdoc = require('jsdoc-api');

const types = [
    'boolean',
    'string',
    'number',
    'time',
    'array'
];

function validateProperty(type, property, validObjects) {
    if(!property.name.match(/^[a-z][a-zA-Z0-9]*$/)) {
        throw `Type [${type}] property [${property.name}] name is invalid`;
    }
    if(!property.methodName.match(/^[A-Z][a-zA-Z0-9]*$/)) {
        throw `Type [${type}] property [${property.name}] method name is invalid`;
    }
    if(!property.description) {
        throw `Type [${type}] property [${property.name}] description not defined`;
    }
    if(!property.description.match(/^[A-Z].+/)) {
        throw `Type [${type}] property [${property.name}] description is invalid`;
    }
    if(types.indexOf(property.type) < 0 && !validObjects[property.type]) {
        throw `Type [${type}] property [${property.name}] invalid type [${property.type}]`;
    }
}

function validateEnum(enumType) {
    if(!enumType.name.match(/^Kaltura[A-Z][a-zA-Z0-9]+$/)) {
        throw `Enum [${enumType.name}] name is invalid`;
    }
    if(!enumType.description.match(/^[A-Z].+/)) {
        throw `Enum [${enumType.name}] description [${enumType.description}] is invalid`;
    }
    Object.keys(enumType.enum).forEach(key => {
        if(!key.match(/^[A-Z][A-Z0-9_]*$/)) {
            throw `Enum [${enumType.name}] key [${key}] is invalid`;
        }
    })
}

function validateType(type, validObjects) {
    if(type.name == 'KalturaObject' || type.name == 'KalturaEnum') {
        return;
    }

    if(!type.name.match(/^Kaltura[A-Z][a-zA-Z0-9]+$/)) {
        throw `Type [${type.name}] name is invalid`;
    }
    if(!type.description) {
        throw `Type [${type.name}] description not defined`;
    }
    if(!type.description.match(/^[A-Z].+/)) {
        throw `Type [${type.name}] description [${type.description}] is invalid`;
    }
    if(type.base != 'KalturaObject' && !validObjects[type.base]) {
        throw `Type [${type.name}] base class [${type.base}] is not known as KalturaObject`;
    }
    type.properties.forEach(property => validateProperty(type.name, property, validObjects))
}

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
    if(action.returnType) {        
        if(types.indexOf(action.returnType) < 0 && !validObjects[action.returnType]) {
            throw `Action [${service}.${action.name}] invalid return type [${action.returnType}]`;
        }
    }
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
    
    var doc = jsdoc.explainSync({files: objectsModule.filename});
    var file = fs.readFileSync(objectsModule.filename, 'utf-8').split('\n');
    
    doc
    .filter(enumComment => enumComment.kind === 'enum' && enumComment.longname.startsWith('Kaltura'))
    .forEach(enumComment => {
        if(!objectsModule.exports[enumComment.name]) {
            throw `Enum [${enumComment.name}] must be exported in its module`;
        }
        
        var enumType = objectsModule.exports[enumComment.name];
        if(enumType.constructor.name !== 'KalturaStringEnum' && enumType.constructor.name !== 'KalturaNumericEnum') {
            throw `Enum [${enumComment.name}] must extend from KalturaStringEnum or KalturaNumericEnum`;
        }
        
        var type = {
            type: 'enum',
            name: enumComment.name,
            enum: enumType,
            description: enumComment.description,
        };
        validateEnum(type);
        objects[enumComment.name] = type
    });
    
    doc
    .filter(classComment => classComment.kind === 'class' && classComment.longname.startsWith('Kaltura') && classComment.meta.code.type === 'ClassDeclaration')
    .forEach(classComment => {
        var base = null;
        if(classComment.name != 'KalturaObject' && classComment.name != 'KalturaEnum') {
            var declarationCode = file[classComment.meta.lineno - 1];
            var match = declarationCode.match(/class\s+[^\s]+\s+extends\s+([^\s]+)/m);
            if(!match) {
                throw `Type [${classComment.name}] should extend from KalturaObject`;
            }
            base = match[1].split('.').pop();
        }
        
        if(!objectsModule.exports[classComment.name]) {
            throw `Type [${classComment.name}] must be exported in its module`;
        }
        
        var type = {
            type: 'object',
            name: classComment.name,
            class: objectsModule.exports[classComment.name],
            base: base,
            description: classComment.classdesc,
            properties: doc.filter(propertyComment => propertyComment.memberof === classComment.name && propertyComment.kind === 'function' && propertyComment.properties)
            .map(propertyComment => {
                var property = {
                    name: propertyComment.properties[0].name,
                    type: propertyComment.type.names[0],
                    description: propertyComment.description,
                    methodName: propertyComment.name,
                }
                if(property.type.startsWith('Array.')) {
                    var arrayType = property.type.replace(/Array[.]<(Kaltura[^>]+)>/, '$1');
                    if(objects[arrayType]) {
                        property.arrayType = objects[arrayType];
                    }
                    else {
                        throw `Type [${classComment.name}] property [${property.name}] invalid array type [${arrayType}]`;
                    }
                    property.type = 'array';
                }
                else if(objects[property.type]) {
                    property.objectType = objects[property.type];
                }
                if(propertyComment.tags) {
                    propertyComment.tags.forEach(tag => {
                        property[tag.originalTitle] = isNaN(tag.value) ? tag.value : parseInt(tag.value);
                    });
                }
                return property;
            }),
            children: {}            
        };
        if(classComment.virtual) {
            type.abstract = true;
        }
        type.addChild = child => {
            type.children[child.name] = child;
            if(type.base != 'KalturaObject') {
                objects[type.base].addChild(child);
            }
        };

        validateType(type, objects);
        if(base && base != 'KalturaObject' && base != 'KalturaEnum') {
            if(objects[base].addChild) {
                objects[base].addChild(type);
            }
            type.baseType = objects[base];
        }
        objects[classComment.name] = type
    });

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
    if(metadata['module.exports'].meta.code.type == 'Identifier' && metadata[metadata['module.exports'].meta.code.value].service) {
        controllerMetadata = metadata[metadata['module.exports'].meta.code.value];
    }
    if(!controllerMetadata) {
        throw `File ${file} no service defined`;
    }

    var controllerModule = module.children.find(mod => mod.id === file)
    var objects = parseObjects(controllerModule);
    var service = {
        name: controllerMetadata.service,
        class: controller,
        description: controllerMetadata.classdesc,        
        actions: doc
            .filter(comment => comment.memberof === controllerMetadata.longname && comment.action && comment.kind === 'function')
            .reduce((data, comment) => {
                if(data[comment.action]) {
                    throw `Action [${controllerMetadata.service}.${comment.action}] appears more than once`;
                }

                var action = {
                    name: comment.action,
                    description: comment.description,
                    methodName: comment.name,
                    method: controller.prototype[comment.name]
                };
                
                if(comment.returns && comment.returns.length && comment.returns[0].type && comment.returns[0].type.names && comment.returns[0].type.names.length) {
                    let returnType = comment.returns[0].type.names[0];
                    action.returnType = returnType;
                }

                if(action.method.length) {
                    if(!comment.params || !comment.params.length) {
                        throw `Action [${controllerMetadata.service}.${comment.action}] arguments not described`;
                    }
                    var args = false;
                    if(comment.meta.code.type === 'MethodDefinition') {
                        args = action.method.toString()
                            .replace(/[\r\n]/g, '')
                            .replace(/[^\(]+\(([^\)]+)\).+/g, '$1')
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
                        if(objects[arg.type]) {
                            arg.objectType = objects[arg.type];
                        }
                        
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