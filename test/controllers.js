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

    describe('controllers', function() {

        it('const', function() {
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
        
        it('multiple files', function() {
            this.timeout(10000);
            const src1 = `
                /**
                 * Test 1
                 * @service test1
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
                
            const src2 = `
                /**
                 * Test 2
                 * @service test2
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

            var services = parser.controllers([writeSource(src1), writeSource(src2)]);
            assert.equal(Object.keys(services).length, 2);
            assert.ok(services.test1);
            assert.ok(services.test2);
        });
        
        it('duplicate service', function() {
            this.timeout(10000);
            const src1 = `
                /**
                 * Test 1
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
                
            const src2 = `
                /**
                 * Test 2
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

            try {
                parser.controllers([writeSource(src1), writeSource(src2)]);
            }
            catch(e) {
                assert.equal(e, 'Service [test] appears more than once');
                return;
            }
            assert.fail('Validation should have fail');
        });
        
        it('not array', function() {
            try {
                parser.controllers(1);
            }
            catch(e) {
                assert.equal(e, 'Controllers expected to be array of file paths');
                return;
            }
            assert.fail('Validation should have fail');
        });
        
        it('empty array', function() {
            try {
                parser.controllers([]);
            }
            catch(e) {
                assert.equal(e, 'Controllers expected to be array of file paths');
                return;
            }
            assert.fail('Validation should have fail');
        });
        
        it('wrong file path', function() {
            try {
                parser.controllers(['does.not.exist']);
            }
            catch(e) {
                assert.equal(e, 'Controller file [does.not.exist] does not exist');
                return;
            }
            assert.fail('Validation should have fail');
        });
    });
});