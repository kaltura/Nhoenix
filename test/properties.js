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

describe('validate', function() {

    describe('objects', function() {

        it('valid', function() {
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

                /**
                 * Test object
                 */
                class KalturaTest extends Nhoenix.KalturaObject {
                
                    /**
                     * Integer property
                     * @property int
                     * @type {number}
                     */
                    Int() {}
                
                    /**
                     * String property
                     * @property str
                     * @type {string}
                     */
                    Str() {}
                
                    /**
                     * Boolean property
                     * @property bl
                     * @type {boolean}
                     */
                    Bl() {}
                
                    /**
                     * Time property
                     * @property tim
                     * @type {time}
                     */
                    Tim() {}
                }
                
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {KalturaTest} obj The object
                     * @action doNothing
                     */
                    doNothing: (obj) => {
                        return 1;
                    }
                };                
                module.exports = controller;`;

            parser.controllers([writeSource(src)]);
        });
        
        it('nested', function() {
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

                /**
                 * Nested object
                 */
                class KalturaNested extends Nhoenix.KalturaObject {
                
                    /**
                     * Integer property
                     * @property prop
                     * @type {number}
                     */
                    Prop() {}
                }
                
                /**
                 * Test object
                 */
                class KalturaTest extends Nhoenix.KalturaObject {
                
                    /**
                     * Integer property
                     * @property nested
                     * @type {KalturaNested}
                     */
                    Nested() {}
                }

                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {KalturaTest} obj The object
                     * @action doNothing
                     */
                    doNothing: (obj) => {
                        return 1;
                    }
                };                
                module.exports = controller;`;

            parser.controllers([writeSource(src)]);
        });

        it('required nested', function() {
            this.timeout(10000);
            const objectSource = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

                /**
                 * Test object
                 */
                class KalturaTest1 extends Nhoenix.KalturaObject {                
                    /**
                     * Test property
                     * @property test
                     * @type {number}
                     */
                    Test() {}
                }
                         
                module.parse = true;
                module.exports = {
                    KalturaTest1: KalturaTest1
                };`;

            const objectSourcePath = writeSource(objectSource).replace(/\\/g, '\\\\');
            const controllerSource = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');
                const KalturaTest1 = require('${objectSourcePath}').KalturaTest1;
                
                /**
                 * Test object
                 */
                class KalturaTest2 extends Nhoenix.KalturaObject {                
                    /**
                     * Test property
                     * @property test
                     * @type {KalturaTest1}
                     */
                    Test() {}
                }

                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {KalturaTest2} obj The object
                     * @action doNothing
                     */
                    doNothing: (obj) => {
                        return 1;
                    }
                };                
                module.exports = controller;`;

            parser.controllers([writeSource(controllerSource)]);
        });
                
        it('invalid name', function() {
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

                /**
                 * Test object
                 */
                class KalturaTest extends Nhoenix.KalturaObject {
                
                    /**
                     * Invalid property
                     * @property InvalidProperty
                     * @type {number}
                     */
                    Invalid() {}
                }
                
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {KalturaTest} obj The object
                     * @action doNothing
                     */
                    doNothing: (obj) => {
                        return 1;
                    }
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Type [KalturaTest] property [InvalidProperty] name is invalid');
                return;
            }
            assert.fail('Validation should have fail');
        });
                
        it('invalid method name', function() {
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

                /**
                 * Test object
                 */
                class KalturaTest extends Nhoenix.KalturaObject {
                
                    /**
                     * Invalid method
                     * @property invalidProperty
                     * @type {number}
                     */
                    invalid() {}
                }
                
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {KalturaTest} obj The object
                     * @action doNothing
                     */
                    doNothing: (obj) => {
                        return 1;
                    }
                };
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Type [KalturaTest] property [invalidProperty] method name is invalid');
                return;
            }
            assert.fail('Validation should have fail');
        });
                
        it('invalid description', function() {
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

                /**
                 * Test object
                 */
                class KalturaTest extends Nhoenix.KalturaObject {
                
                    /**
                     * invalid method
                     * @property invalid
                     * @type {number}
                     */
                    Invalid() {}
                }
                
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {KalturaTest} obj The object
                     * @action doNothing
                     */
                    doNothing: (obj) => {
                        return 1;
                    }
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Type [KalturaTest] property [invalid] description is invalid');
                return;
            }
            assert.fail('Validation should have fail');
        });
                
        it('missing description', function() {
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

                /**
                 * Test object
                 */
                class KalturaTest extends Nhoenix.KalturaObject {
                
                    /**
                     * @property invalid
                     * @type {number}
                     */
                    Invalid() {}
                }
                
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {KalturaTest} obj The object
                     * @action doNothing
                     */
                    doNothing: (obj) => {
                        return 1;
                    }
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Type [KalturaTest] property [invalid] description not defined');
                return;
            }
            assert.fail('Validation should have fail');
        });
                
        it('invalid type', function() {
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

                /**
                 * Test object
                 */
                class KalturaTest extends Nhoenix.KalturaObject {
                
                    /**
                     * Invalid type
                     * @property invalid
                     * @type {invalid}
                     */
                    Invalid() {}
                }
                
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {KalturaTest} obj The object
                     * @action doNothing
                     */
                    doNothing: (obj) => {
                        return 1;
                    }
                };                
                module.exports = controller;`;

            try {
                parser.controllers([writeSource(src)]);
            }
            catch(e) {
                assert.equal(e, 'Type [KalturaTest] property [invalid] invalid type [invalid]');
                return;
            }
            assert.fail('Validation should have fail');
        });
    });
});