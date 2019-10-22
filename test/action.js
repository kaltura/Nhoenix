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

describe('action', function() {

    it('valid', function() {
        this.timeout(10000);
        const src = `
            /**
             * Test
             * @service test
             */
            const controller = {
                /**
                 * Do nothing
                 * @action doNothing
                 * @returns {number}
                 */
                doNothing: () => {
                }
            };                
            module.exports = controller;`;

        parser.controllers([writeSource(src)]);
    });
    
    it('no action', function() {
        this.timeout(10000);
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
        this.timeout(10000);
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
        this.timeout(10000);
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
        this.timeout(10000);
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
        this.timeout(10000);
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
        this.timeout(10000);
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
        this.timeout(10000);
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
        this.timeout(10000);
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
    
    it('invalid return type', function() {
        this.timeout(10000);
        const src = `
            /**
             * Test
             * @service test
             */
            const controller = {
                /**
                 * Do nothing
                 * @action doNothing
                 * @returns {invalid}
                 */
                doNothing: () => {
                }
            };                
            module.exports = controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Action [test.doNothing] invalid return type [invalid]');
            return;
        }
        assert.fail('Validation should have fail');
    });

    it('object return type', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test object
             */
            class KalturaTest extends Nhoenix.KalturaObject {
                /**
                 * Test property
                 * @property test
                 * @type {number}
                 */
                Test() {}
            }

            /**
             * Test
             * @service test
             */
            const controller = {
                KalturaTest: KalturaTest,

                /**
                 * Do nothing
                 * @action doNothing
                 * @returns {KalturaTest}
                 */
                doNothing: () => {
                }
            };                
            module.exports = controller;`;

        parser.controllers([writeSource(src)]);
    });
    
    it('valid arg', function() {
        this.timeout(10000);
        const src = `
            /**
             * Test
             * @service test
             */
            const controller = {
                /**
                 * Do nothing
                 * @param {string} par Object argument
                 * @action doNothing
                 */
                doNothing: (par) => {
                }
            };                
            module.exports = controller;`;

        parser.controllers([writeSource(src)]);
    });
    
    it('object arg', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test object
             */
            class KalturaTest extends Nhoenix.KalturaObject {
                /**
                 * Test property
                 * @property test
                 * @type {number}
                 */
                Test() {}
            }

            /**
             * Test
             * @service test
             */
            const controller = {
                KalturaTest: KalturaTest,

                /**
                 * Do nothing
                 * @param {KalturaTest} par Object argument
                 * @action doNothing
                 */
                doNothing: (par) => {
                }
            };                
            module.exports = controller;`;

        parser.controllers([writeSource(src)]);
    });

    it('invalid arg', function() {
        this.timeout(10000);
        const src = `
            /**
             * Test
             * @service test
             */
            const controller = {
                /**
                 * Do nothing
                 * @param {KalturaTest} par Object argument
                 * @action doNothing
                 */
                doNothing: (par) => {
                }
            };                
            module.exports = controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Action [test.doNothing] argument [0] invalid type [KalturaTest]');
            return;
        }
        assert.fail('Validation should have fail');
    });
});