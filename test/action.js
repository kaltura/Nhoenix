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

    describe('action', function() {

        it('valid', function() {
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
                        return 1;
                    }
                };                
                module.exports = controller;`;

            parser.controllers([writeSource(src)]);
        });
        
        it('no action', function() {
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     */
                    doNothing: () => {
                        return 1;
                    }
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Service [test] no actions defined');
                return;
            }
            assert.fail('Validation should have fail');
        });
        
        it('no description', function() {
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * @action doNothing
                     */
                    doNothing: () => {
                        return 1;
                    }
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Action [test.doNothing] description not specified');
                return;
            }
            assert.fail('Validation should have fail');
        });
        
        it('empty description', function() {
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * 
                     * @action doNothing
                     */
                    doNothing: () => {
                        return 1;
                    }
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Action [test.doNothing] description not specified');
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
                     * no capital letter
                     * @action doNothing
                     */
                    doNothing: () => {
                        return 1;
                    }
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Action [test.doNothing] invalid description [no capital letter]');
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
                     * @action DoNothing
                     */
                    doNothing: () => {
                        return 1;
                    }
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Action [test.DoNothing] action name is invalid');
                return;
            }
            assert.fail('Validation should have fail');
        });
        
        it('invalid name number', function() {
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @action 1doNothing
                     */
                    doNothing: () => {
                        return 1;
                    }
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Action [test.1doNothing] action name is invalid');
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
                     * @action doNothing_
                     */
                    doNothing: () => {
                        return 1;
                    }
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Action [test.doNothing_] action name is invalid');
                return;
            }
            assert.fail('Validation should have fail');
        });
        
        it('not a function', function() {
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
                    doNothing: 1
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Action [test.doNothing] is not a function');
                return;
            }
            assert.fail('Validation should have fail');
        });
        
        // TODO return type
    });
});