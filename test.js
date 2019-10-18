
const jsdoc = require('jsdoc-api');

class KalturaObject {
    static implementProperties(clazz) {
        if(clazz.implemented) {
            return;
        }        
        clazz.implemented = true;

        //console.log(clazz.toString());
        var methods = Object.getOwnPropertyNames(clazz.prototype);
        methods.forEach(method => {
            if(method === 'constructor' || clazz.prototype[method].toString().match('[^{}]}$')) {
                return;
            }
            console.log('implementing ', clazz.name, method);
            
            
            
            /*
            var privateProperty = method[0].toLowerCase() + method.substr(1);
            AAA.prototype[property] = function() {
                if(arguments.length) {
                    this[privateProperty] = arguments[0];
                }
                else {
                    return this[privateProperty];
                }
            }
            */
        });
    }

    constructor() {
        this.constructor.implementProperties(this.constructor);
    }
}

/**
 * Class description
 */
class KalturaTest extends KalturaObject {
    /**
     * @property val1
     */
    Val1() {}
    Val2() {}
    testMethod() {
        void(0);
    }
}

var a = new AAA();
var b = new AAA();
