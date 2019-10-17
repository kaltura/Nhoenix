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

    describe('controller', function() {

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
                    }
                };
                module.exports = controller;`;

            parser.controllers([writeSource(src)]);
        });
        
        it('module', function() {
            const src = `
                /**
                 * Test
                 * @service test
                 */
                module.exports = {
                    /**
                     * Do nothing
                     * @action doNothing
                     */
                    doNothing: () => {
                    }
                };`;

            parser.controllers([writeSource(src)]);
        });
        
        it('no controller', function() {
            const src = `
                /**
                 * Test
                 */
                const controller = {
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.ok(e.endsWith('no service defined'));
                return;
            }
            assert.fail('Validation should have fail');
        });
        
        it('no description', function() {
            const src = `
                /**
                 * @service test
                 */
                const controller = {
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Service [test] service description not specified');
                return;
            }
            assert.fail('Validation should have fail');
        });
        
        it('empty description', function() {
            const src = `
                /**
                 * 
                 * @service test
                 */
                const controller = {
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Service [test] service description not specified');
                return;
            }
            assert.fail('Validation should have fail');
        });
        
        it('invalid description', function() {
            const src = `
                /**
                 * no capital letter
                 * @service test
                 */
                const controller = {
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Service [test] service description format is invalid');
                return;
            }
            assert.fail('Validation should have fail');
        });
        
        it('invalid name capital', function() {
            const src = `
                /**
                 * Test
                 * @service Test
                 */
                const controller = {
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Service [Test] service name is invalid');
                return;
            }
            assert.fail('Validation should have fail');
        });
        
        it('invalid name number', function() {
            const src = `
                /**
                 * Test
                 * @service 1test
                 */
                const controller = {
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Service [1test] service name is invalid');
                return;
            }
            assert.fail('Validation should have fail');
        });
        
        it('invalid name invalid chars', function() {
            const src = `
                /**
                 * Test
                 * @service test_
                 */
                const controller = {
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Service [test_] service name is invalid');
                return;
            }
            assert.fail('Validation should have fail');
        });
            
        it('no actions', function() {
            const src = `
                /**
                 * Test
                 * @service test
                 */
                const controller = {
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
            
        it('duplicated actions', function() {
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
                    do1: () => {
                    },
                    
                    /**
                     * Do nothing
                     * @action doNothing
                     */
                    do2: () => {
                    }
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Action [test.doNothing] appears more than once');
                return;
            }
            assert.fail('Validation should have fail');
        });
    });
});