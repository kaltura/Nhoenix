
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

/**
 * Base numeric enum
 */
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

/**
 * Base string enum
 */
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
     * Should be implemented by extending types
     * @param {boolean} isNew
     * @abstract
     */
    validate(isNew) {
        throw `Abstract method validate is not implemented for type [${this.objectType}]`;
    }

    /**
     * Auto overridden for each extending object
     */
    static fromCore(core) {}

    /**
     * Translate API object to core object
     * @param {boolean} isNew
     */
    toCore(isNew) {
        this.validate(isNew);
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

/**
 * API Exception
 */
class KalturaAPIException extends KalturaObject {
    constructor(code, message, args) {
        super();
        if(code instanceof ExceptionType) {
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

class ExceptionType {
    constructor(code, template) {
        this.code = code;
        this.template = template;
        ExceptionType[code] = this;
    }
}

new ExceptionType('INTERNAL_SERVER_ERROR', 'Internal Server Error');
new ExceptionType('INVALID_JSON_FORMAT', 'Invalid JSON format');
new ExceptionType('INVALID_SERVICE', 'Service [{service}] not found');
new ExceptionType('INVALID_ACTION', 'Action [{service}.{action}] not found');
new ExceptionType('INVALID_ARGUMENT', 'Argument [{argument}] is invalid');
new ExceptionType('ACTION_NOT_SPECIFIED', 'Action not specified');
new ExceptionType('ARGUMENT_CANNOT_BE_EMPTY', 'Argument [{argument}] cannot be empty');
new ExceptionType('ARGUMENT_MUST_BE_NUMERIC', 'Argument [{argument}] must be numeric');
new ExceptionType('ARGUMENT_MIN_LENGTH_CROSSED', 'Argument [{argument}] minimum length is [{value}]');
new ExceptionType('ARGUMENT_MAX_LENGTH_CROSSED', 'Argument [{argument}] maximum length is [{value}]');
new ExceptionType('ARGUMENT_MIN_VALUE_CROSSED', 'Argument [{argument}] minimum value is [{value}]');
new ExceptionType('ARGUMENT_MAX_VALUE_CROSSED', 'Argument [{argument}] maximum value is [{value}]');
new ExceptionType('ARGUMENT_MAX_VALUE_CROSSED', 'Argument [{argument}] value must be of type [{value}]');
new ExceptionType('TYPE_NOT_SUPPORTED', 'Type [{value}] is not supported for argument [{argument}]');
new ExceptionType('ABSTRACT_PARAMETER', 'Abstract parameter type [{type}]');
new ExceptionType('ARGUMENT_STRING_SHOULD_BE_ENUM', 'Argument [{argument}] values must be of type [{enum}]');
new ExceptionType('OBJECT_NOT_FOUND', '{objectType} not found');

/**
 * Base Filter
 */
class KalturaFilter extends KalturaObject {
    str2IntArray(str) {
        return str.split(',').map(value => {
            value = value.trim();
            if(isNaN(value)) {
                throw new KalturaAPIException(ExceptionType.ARGUMENT_CANNOT_BE_EMPTY, {argument: 'KalturaAuditTrail.description'});
            }
            return parseInt(value);
        });
    }
}

/**
 * Filter pager
 */
class KalturaFilterPager extends KalturaObject {

    validate() {
    }

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

/**
 * Base list-response
 */
class KalturaListResponse extends KalturaObject {
    /**
     * Total number of objects
     * @property totalCount
     * @type {number}
     */
    TotalCount() {}
}

module.parse = true;
module.exports = {
    KalturaEnum: KalturaEnum,
    KalturaNumericEnum: KalturaNumericEnum.new,
    KalturaStringEnum: KalturaStringEnum.new,
    KalturaObject: KalturaObject,
    KalturaAPIException: KalturaAPIException,
    ExceptionType: ExceptionType,
    KalturaFilterPager: KalturaFilterPager,
    KalturaFilter: KalturaFilter,
    KalturaListResponse: KalturaListResponse,
};