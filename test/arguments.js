const fs = require('fs');
const tmp = require('tmp');
const path = require('path');
const assert = require('assert');
const parser = require('../lib/parser.js');

function writeSource(src) {
    const filename = tmp.tmpNameSync({postfix: '.js'});
    fs.writeFileSync(filename, src);
    return filename;
}

describe('arguments', function() {

    it('no args', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @returns {number}
                 */
                doNothing () {
                }
            }
            module.exports = Controller;`;

        var services = parser.controllers([writeSource(src)]);
        assert.ok(!services.test.actions.doNothing.args)
    });
    
    it('simple', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {string} myArg The param
                 * @returns {number}
                 */
                doNothing (myArg) {
                }
            }
            module.exports = Controller;`;

        var services = parser.controllers([writeSource(src)]);
        assert.equal(services.test.actions.doNothing.args.length, 1);
        assert.equal(services.test.actions.doNothing.args[0].type, 'string');
        assert.equal(services.test.actions.doNothing.args[0].name, 'myArg');
        assert.equal(services.test.actions.doNothing.args[0].description, 'The param');
    });
    
    it('primitives', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {boolean} a Boolean
                 * @param {string} b String
                 * @param {number} c Number
                 * @param {time} d Time
                 */
                doNothing (a, b, c, d) {
                }
            }
            module.exports = Controller;`;

        var services = parser.controllers([writeSource(src)]);
        assert.equal(services.test.actions.doNothing.args[0].type, 'boolean');
        assert.equal(services.test.actions.doNothing.args[1].type, 'string');
        assert.equal(services.test.actions.doNothing.args[2].type, 'number');
        assert.equal(services.test.actions.doNothing.args[3].type, 'time');
    });
    
    it('wrong order', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {string} d DD
                 * @param {string} b BB
                 * @param {string} c CC
                 * @param {string} a AA
                 */
                doNothing (a, b, c, d) {
                }
            }
            module.exports = Controller;`;

        var services = parser.controllers([writeSource(src)]);
        assert.equal(services.test.actions.doNothing.args[0].name, 'a');
        assert.equal(services.test.actions.doNothing.args[1].name, 'b');
        assert.equal(services.test.actions.doNothing.args[2].name, 'c');
        assert.equal(services.test.actions.doNothing.args[3].name, 'd');
    });
        
    it('complex', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {string} a First arg @minLength 3
                 * @param {number} b Second one @minValue 1 @maxValue 100
                 */
                doNothing (a, b) {
                }
            }
            module.exports = Controller;`;

            var services = parser.controllers([writeSource(src)]);
            
            assert.equal(services.test.actions.doNothing.args[0].type, 'string');
            assert.equal(services.test.actions.doNothing.args[0].name, 'a');
            assert.equal(services.test.actions.doNothing.args[0].description, 'First arg');
            assert.strictEqual(services.test.actions.doNothing.args[0].minLength, 3);
            
            assert.equal(services.test.actions.doNothing.args[1].type, 'number');
            assert.equal(services.test.actions.doNothing.args[1].name, 'b');
            assert.equal(services.test.actions.doNothing.args[1].description, 'Second one');
            assert.strictEqual(services.test.actions.doNothing.args[1].minValue, 1);
            assert.strictEqual(services.test.actions.doNothing.args[1].maxValue, 100);
    });
    
    it('no description', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {string} myArg
                 */
                doNothing (myArg) {
                }
            }
            module.exports = Controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Action [test.doNothing] argument [myArg] description not defined');
            return;
        }
        assert.fail('Validation should have fail');
    });
    
    it('no type', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param myArg No type
                 */
                doNothing (myArg) {
                }
            }
            module.exports = Controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Action [test.doNothing] argument [myArg] type not defined');
            return;
        }
        assert.fail('Validation should have fail');
    });
    
    it('invalid type', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {bad} myArg My arg
                 */
                doNothing (myArg) {
                }
            }
            module.exports = Controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Action [test.doNothing] argument [0] invalid type [bad]');
            return;
        }
        assert.fail('Validation should have fail');
    });

    it('invalid description', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {string} myArg no capital letter
                 */
                doNothing (myArg) {
                }
            }
            module.exports = Controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Action [test.doNothing] argument [0] name [myArg] is invalid');
            return;
        }
        assert.fail('Validation should have fail');
    });
    
    it('invalid name capital', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {string} MyArg The param
                 */
                doNothing (MyArg) {
                }
            }
            module.exports = Controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Action [test.doNothing] argument [0] name [MyArg] is invalid');
            return;
        }
        assert.fail('Validation should have fail');
    });
    
    it('invalid name invalid chars', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {string} myArg_ The param
                 */
                doNothing (myArg_) {
                }
            }
            module.exports = Controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Action [test.doNothing] argument [0] name [myArg_] is invalid');
            return;
        }
        assert.fail('Validation should have fail');
    });
    
    it('missing 1/1', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 */
                doNothing (myArg) {
                }
            }
            module.exports = Controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Action [test.doNothing] arguments not described');
            return;
        }
        assert.fail('Validation should have fail');
    });
    
    it('missing 1/many', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {string} a The param
                 */
                doNothing (a, b) {
                }
            }
            module.exports = Controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Action [test.doNothing] missing arguments [b] definitions');
            return;
        }
        assert.fail('Validation should have fail');
    });
    
    it('missing many/many', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {string} b The param
                 */
                doNothing (a, b, c) {
                }
            }
            module.exports = Controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Action [test.doNothing] missing arguments [a, c] definitions');
            return;
        }
        assert.fail('Validation should have fail');
    });

    it('minValue non-number', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {number} val The param @minValue NaN
                 */
                doNothing (val) {
                }
            }
            module.exports = Controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Action [test.doNothing] argument [val] minValue is not a number');
            return;
        }
        assert.fail('Validation should have fail');
    });

    it('minLength non-number', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {string} val The param @minLength NaN
                 */
                doNothing (val) {
                }
            }
            module.exports = Controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Action [test.doNothing] argument [val] minLength is not a number');
            return;
        }
        assert.fail('Validation should have fail');
    });

    it('min/max value on string', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {string} val The param @minValue 3 @maxValue 100
                 */
                doNothing (val) {
                }
            }
            module.exports = Controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Action [test.doNothing] string argument [0] invalid restrictions [minValue, maxValue]');
            return;
        }
        assert.fail('Validation should have fail');
    });

    it('min/max length on number', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {number} val The param @minLength 3 @maxLength 100
                 */
                doNothing (val) {
                }
            }
            module.exports = Controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Action [test.doNothing] number argument [0] invalid restrictions [minLength, maxLength]');
            return;
        }
        assert.fail('Validation should have fail');
    });
});