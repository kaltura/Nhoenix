const fs = require('fs');
const tmp = require('tmp');
const assert = require('assert');
const parser = require('../lib/parser.js');

function writeSource(src) {
    const filename = tmp.tmpNameSync({postfix: '.js'});
    fs.writeFileSync(filename, src);
    return filename;
}

describe('validate', function() {

    describe('arguments', function() {

        it('no args', function() {
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @action doNothing
                     */
                    doNothing: () => {
                    }
                };                
                module.exports = controller;`;

            var services = parser.controllers([writeSource(src)]);
            assert.ok(!services.test.actions.doNothing.args)
        });
        
        it('simple with brackets', function() {
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {string} myArg The param
                     * @action doNothing
                     */
                    doNothing: (myArg) => {
                    }
                };                
                module.exports = controller;`;

            var services = parser.controllers([writeSource(src)]);
            assert.equal(services.test.actions.doNothing.args.length, 1);
            assert.equal(services.test.actions.doNothing.args[0].type, 'string');
            assert.equal(services.test.actions.doNothing.args[0].name, 'myArg');
            assert.equal(services.test.actions.doNothing.args[0].description, 'The param');
        });
        
        it('primitives', function() {
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {boolean} a Boolean
                     * @param {string} b String
                     * @param {number} c Number
                     * @param {time} d Time
                     * @action doNothing
                     */
                    doNothing: (a, b, c, d) => {
                    }
                };                
                module.exports = controller;`;

            var services = parser.controllers([writeSource(src)]);
            assert.equal(services.test.actions.doNothing.args[0].type, 'boolean');
            assert.equal(services.test.actions.doNothing.args[1].type, 'string');
            assert.equal(services.test.actions.doNothing.args[2].type, 'number');
            assert.equal(services.test.actions.doNothing.args[3].type, 'time');
        });
        
        it('wrong order', function() {
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {string} d DD
                     * @param {string} b BB
                     * @param {string} c CC
                     * @param {string} a AA
                     * @action doNothing
                     */
                    doNothing: (a, b, c, d) => {
                    }
                };                
                module.exports = controller;`;

            var services = parser.controllers([writeSource(src)]);
            assert.equal(services.test.actions.doNothing.args[0].name, 'a');
            assert.equal(services.test.actions.doNothing.args[1].name, 'b');
            assert.equal(services.test.actions.doNothing.args[2].name, 'c');
            assert.equal(services.test.actions.doNothing.args[3].name, 'd');
        });
        
        it('simple no brackets', function() {
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {string} myArg The param
                     * @action doNothing
                     */
                    doNothing: myArg => {
                    }
                };                
                module.exports = controller;`;

            parser.controllers([writeSource(src)]);
        });
        
        it('complex', function() {
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {string} a First arg @minLength 3
                     * @param {number} b Second one @minValue 1 @maxValue 100
                     * @action doNothing
                     */
                    doNothing: (a, b) => {
                    }
                };                
                module.exports = controller;`;

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
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {string} myArg
                     * @action doNothing
                     */
                    doNothing: (myArg) => {
                    }
                };                
                module.exports = controller;`;

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
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param myArg No type
                     * @action doNothing
                     */
                    doNothing: (myArg) => {
                    }
                };                
                module.exports = controller;`;

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
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {bad} myArg My arg
                     * @action doNothing
                     */
                    doNothing: (myArg) => {
                    }
                };                
                module.exports = controller;`;

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
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {string} myArg no capital letter
                     * @action doNothing
                     */
                    doNothing: (myArg) => {
                    }
                };                
                module.exports = controller;`;

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
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {string} MyArg The param
                     * @action doNothing
                     */
                    doNothing: (MyArg) => {
                    }
                };                
                module.exports = controller;`;

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
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {string} myArg_ The param
                     * @action doNothing
                     */
                    doNothing: (myArg_) => {
                    }
                };                
                module.exports = controller;`;

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
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @action doNothing
                     */
                    doNothing: (myArg) => {
                    }
                };                
                module.exports = controller;`;

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
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {string} a The param
                     * @action doNothing
                     */
                    doNothing: (a, b) => {
                    }
                };                
                module.exports = controller;`;

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
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {string} b The param
                     * @action doNothing
                     */
                    doNothing: (a, b, c) => {
                    }
                };                
                module.exports = controller;`;

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
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {number} val The param @minValue NaN
                     * @action doNothing
                     */
                    doNothing: (val) => {
                    }
                };                
                module.exports = controller;`;

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
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {string} val The param @minLength NaN
                     * @action doNothing
                     */
                    doNothing: (val) => {
                    }
                };                
                module.exports = controller;`;

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
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {string} val The param @minValue 3 @maxValue 100
                     * @action doNothing
                     */
                    doNothing: (val) => {
                    }
                };                
                module.exports = controller;`;

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
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {number} val The param @minLength 3 @maxLength 100
                     * @action doNothing
                     */
                    doNothing: (val) => {
                    }
                };                
                module.exports = controller;`;

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
});