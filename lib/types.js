
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
    }
}

class KalturaFilter extends KalturaObject {
}

class KalturaFilterPager extends KalturaObject {
    /**
     * The number of objects to retrieve. Possible range 1 ≤ value ≤ 50. defaults to 25
     * @property totalCount
     * @type {pageSize}
     */
    PageSize() {}
    
    /**
     * The page number for which page of objects should be retrieved
     * @property totalCount
     * @type {pageIndex}
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