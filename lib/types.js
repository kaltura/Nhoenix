
const jsdoc = require('jsdoc-api');
const format = require("string-template")

class KalturaEnum {
    exists(value) {
        return Object.keys(this).find(key => this[key] === value) !== undefined;
    }
    toValue(name) {
        return this[name];
    }
    toName(value) {
        return Object.keys(this).find(key => this[key] === value);
    }
}

class KalturaNumericEnum extends KalturaEnum {
    static new(values) {
        Object.values(values).forEach(value => {
            if(typeof value !== 'number') {
                throw `Enum value [${value}] must be numeric`;
            }
        });
        values.__proto__ = KalturaNumericEnum.prototype;
        return values;
    }
}

class KalturaStringEnum extends KalturaEnum {
    static new(values) {
        Object.values(values).forEach(value => {
            if(typeof value !== 'string') {
                throw `Enum value [${value}] must be string`;
            }
        });
        values.__proto__ = KalturaStringEnum.prototype;
        return values;
    }
}

class KalturaObject {
    static implementProperties(clazz) {
        if(clazz.map) {
            return clazz.map;
        }

        var base = Object.getPrototypeOf(clazz);
        if(base.name === 'KalturaObject') {
            clazz.map = {};
        }
        else {
            var baseMap = KalturaObject.implementProperties(base);
            clazz.map = JSON.parse(JSON.stringify(baseMap));
        }

        var doc = jsdoc.explainSync({source: clazz.toString()});
        var properties = doc.filter(comment => comment.properties);
        properties.forEach(property => {
            if(property.tags) {
                property.tags.forEach(tag => {
                    property[tag.originalTitle] = isNaN(tag.value) ? tag.value : parseInt(tag.value);
                });
            }
            var methodName = property.name;
            var propertyName = property.properties[0].name;
            var coreName = property.coreProperty ? property.coreProperty : propertyName;
            clazz.map[propertyName] = coreName;

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

        clazz.fromCore = core => {
            var obj = new clazz();
            Object.keys(clazz.map).forEach(propertyName => {
                if(core[propertyName] !== null) {
                    obj[propertyName] = core[clazz.map[propertyName]];
                }
            });
            return obj;
        };

        return clazz.map;
    }

    constructor() {
        this.constructor.implementProperties(this.constructor);
        this.objectType = this.constructor.name;
    }

    /**
     * Should be implemented by extending types
     * @abstract
     */
    newCore() {
        throw `Abstract method newCore is not implemented for type [${this.objectType}]`;
    }

    /**
     * Auto overridden for each extending object
     */
    static fromCore(core) {}

    /**
     * Translate API object to core object
     */
    toCore() {
        var obj = this.newCore();
        var map = this.constructor.map;
        Object.keys(map).forEach(propertyName => {
            if(this[propertyName] !== undefined) {
                obj[map[propertyName]] = this[propertyName];
            }
        });
        return obj;
    }
}

class KalturaAPIException extends KalturaObject {
    constructor(code, message, args) {
        super();
        if(code instanceof KalturaExceptionType) {
            args = message;
            this.message = format(code.template, args);
            this.code = code.code;
        }
        else {
            this.message = message;
            this.code = code;
        }
        if(args) {
            this.args = args;
        }
    }
}

class KalturaExceptionType {
    constructor(code, template) {
        this.code = code;
        this.template = template;
        KalturaExceptionType[code] = this;
    }
}

new KalturaExceptionType('INTERNAL_SERVER_ERROR', 'Internal Server Error');
new KalturaExceptionType('INVALID_JSON_FORMAT', 'Invalid JSON format');
new KalturaExceptionType('INVALID_SERVICE', 'Service [{service}] not found');
new KalturaExceptionType('INVALID_ACTION', 'Action [{service}.{action}] not found');
new KalturaExceptionType('INVALID_ARGUMENT', 'Argument [{argument}] is invalid');
new KalturaExceptionType('ACTION_NOT_SPECIFIED', 'Action not specified');
new KalturaExceptionType('ARGUMENT_CANNOT_BE_EMPTY', 'Argument [{argument}] cannot be empty');
new KalturaExceptionType('ARGUMENT_MUST_BE_NUMERIC', 'Argument [{argument}] must be numeric');
new KalturaExceptionType('ARGUMENT_MIN_LENGTH_CROSSED', 'Argument [{argument}] minimum length is [{value}]');
new KalturaExceptionType('ARGUMENT_MAX_LENGTH_CROSSED', 'Argument [{argument}] maximum length is [{value}]');
new KalturaExceptionType('ARGUMENT_MIN_VALUE_CROSSED', 'Argument [{argument}] minimum value is [{value}]');
new KalturaExceptionType('ARGUMENT_MAX_VALUE_CROSSED', 'Argument [{argument}] maximum value is [{value}]');
new KalturaExceptionType('ARGUMENT_MAX_VALUE_CROSSED', 'Argument [{argument}] value must be of type [{value}]');
new KalturaExceptionType('TYPE_NOT_SUPPORTED', 'Type [{value}] is not supported for argument [{argument}]');
new KalturaExceptionType('ABSTRACT_PARAMETER', 'Abstract parameter type [{type}]');
new KalturaExceptionType('ARGUMENT_STRING_SHOULD_BE_ENUM', 'Argument [{argument}] values must be of type [{enum}]');
new KalturaExceptionType('OBJECT_NOT_FOUND', '{objectType} not found');

class KalturaFilter extends KalturaObject {    
    validate() {

    }

    str2IntArray(str) {
        return str.split(',').map(value => {
            value = value.trim();
            if(isNaN(value)) {
                throw new KalturaAPIException(KalturaExceptionType.ARGUMENT_CANNOT_BE_EMPTY, {argument: 'KalturaAuditTrail.description'});
            }
            return parseInt(value);
        });
    }
}

class KalturaFilterPager extends KalturaObject {
    /**
     * The number of objects to retrieve. Possible range 1 ≤ value ≤ 50. defaults to 25
     * @property pageSize
     * @type {number}
     */
    PageSize() {}
    
    /**
     * The page number for which page of objects should be retrieved
     * @property pageIndex
     * @type {number}
     */
    PageIndex() {}
}

class KalturaListResponse extends KalturaObject {
    /**
     * Total number of objects
     * @property totalCount
     * @type {number}
     */
    TotalCount() {}
}

module.exports = {
    KalturaNumericEnum: KalturaNumericEnum.new,
    KalturaStringEnum: KalturaStringEnum.new,
    KalturaObject: KalturaObject,
    KalturaAPIException: KalturaAPIException,
    KalturaExceptionType: KalturaExceptionType,
    KalturaFilterPager: KalturaFilterPager,
    KalturaFilter: KalturaFilter,
    KalturaListResponse: KalturaListResponse,
};