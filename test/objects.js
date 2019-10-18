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

        it('in-module', function() {
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

        it('required class', function() {
            const objectSource = `
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
                         
                module.parse = true;
                module.exports = {
                    KalturaTest: KalturaTest
                };`;

            const objectSourcePath = writeSource(objectSource).replace(/\\/g, '\\\\');
            const controllerSource = `
                const KalturaTest = require('${objectSourcePath}').KalturaTest;
                
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

            parser.controllers([writeSource(controllerSource)]);
        });
                
        it('required classes', function() {
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
                     
                /**
                 * Test object
                 */
                class KalturaTest2 extends KalturaTest1 {                
                    /**
                     * Test property
                     * @property test
                     * @type {number}
                     */
                    Test() {}
                }
                         
                module.parse = true;
                module.exports = {
                    KalturaTest1: KalturaTest1,
                    KalturaTest2: KalturaTest2,
                };`;

            const objectSourcePath = writeSource(objectSource).replace(/\\/g, '\\\\');
            const controllerSource = `
                const kalturaTypes = require('${objectSourcePath}');
                const {KalturaTest1, KalturaTest2} = kalturaTypes;
                
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {KalturaTest1} obj The object
                     * @action doNothing
                     */
                    doNothing: (obj) => {
                        return 1;
                    }
                };                
                module.exports = controller;`;

            parser.controllers([writeSource(controllerSource)]);
        });
        
                
        it('moduled classes', function() {
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
                     
                /**
                 * Test object
                 */
                class KalturaTest2 extends Nhoenix.KalturaObject {                
                    /**
                     * Test property
                     * @property test
                     * @type {number}
                     */
                    Test() {}
                }
                
                module.parse = true;
                module.exports = {
                    KalturaTest1: KalturaTest1,
                    KalturaTest2: KalturaTest2,
                };`;

            const objectSourcePath = writeSource(objectSource).replace(/\\/g, '\\\\');
            const controllerSource = `
                const kalturaTypes = require('${objectSourcePath}');
                
                /**
                 * Test
                 * @service test
                 */
                const controller = {
                    /**
                     * Do nothing
                     * @param {KalturaTest1} obj The object
                     * @action doNothing
                     */
                    doNothing: (obj) => {
                        return 1;
                    }
                };                
                module.exports = controller;`;

            parser.controllers([writeSource(controllerSource)]);
        });

        
        // TODO object properties (valid, required, required multiple levels and missing)
    });
});