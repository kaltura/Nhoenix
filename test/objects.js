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

describe('objects', function() {

    it('in-module', function() {
        this.timeout(10000);
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
            }
            
            /**
             * Test
             * @service test
             */
            class Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {KalturaTest} obj The object
                 */
                doNothing (obj) {
                }
            }
            Controller.KalturaTest = KalturaTest;

            module.exports = Controller;`;

        parser.controllers([writeSource(src)]);
    });
    
    it('required class', function() {
        this.timeout(10000);
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
            class Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {KalturaTest} obj The object
                 */
                doNothing (obj) {
                }
            }
            Controller.KalturaTest = KalturaTest;

            module.exports = Controller;`;

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
            class Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {KalturaTest1} obj The object
                 */
                doNothing (obj) {
                }
            }

            module.exports = Controller;`;

        parser.controllers([writeSource(controllerSource)]);
    });
    
            
    it('moduled classes', function() {
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
            class Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {KalturaTest2} obj The object
                 */
                doNothing (obj) {
                }
            }

            module.exports = Controller;`;

        parser.controllers([writeSource(controllerSource)]);
    });
    
    it('extend required', function() {
        this.timeout(10000);
        const objectSource1 = `
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
                KalturaTest1: KalturaTest1,
            };`;

        const objectSource1Path = writeSource(objectSource1).replace(/\\/g, '\\\\');
        const objectSource2 = `
        const kalturaTypes = require('${objectSource1Path}');
                    
            /**
             * Test object
             */
            class KalturaTest2 extends kalturaTypes.KalturaTest1 {                
                /**
                 * Test property
                 * @property test
                 * @type {number}
                 */
                Test() {}
            }
            
            module.parse = true;
            module.exports = {
                KalturaTest2: KalturaTest2,
            };`;

        const objectSource2Path = writeSource(objectSource2).replace(/\\/g, '\\\\');
        const controllerSource = `
            const kalturaTypes = require('${objectSource2Path}');
            
            /**
             * Test
             * @service test
             */
            class Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {KalturaTest2} obj The object
                 */
                doNothing (obj) {
                }
            }

            module.exports = Controller;`;

        parser.controllers([writeSource(controllerSource)]);
    });
    
    it('no base', function() {
        this.timeout(10000);
        const src = `
            /**
             * Test object
             */
            class KalturaTest {
            
                /**
                 * Integer property
                 * @property int
                 * @type {number}
                 */
                Int() {}
            }
            
            /**
             * Test
             * @service test
             */
            class Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {KalturaTest} obj The object
                 */
                doNothing (obj) {
                }
            }
            Controller.KalturaTest = KalturaTest;

            module.exports = Controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Type [KalturaTest] should extend from KalturaObject');
            return;
        }
        assert.fail('Validation should have fail');
    });
    
    it('non-kaltura base', function() {
        this.timeout(10000);
        const src = `
            class Base {}

            /**
             * Test object
             */
            class KalturaTest extends Base {
            
                /**
                 * Integer property
                 * @property int
                 * @type {number}
                 */
                Int() {}
            }
            
            /**
             * Test
             * @service test
             */
            class Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {KalturaTest} obj The object
                 */
                doNothing (obj) {
                }
            }
            Controller.KalturaTest = KalturaTest;

            module.exports = Controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Type [KalturaTest] base class [Base] is not known as KalturaObject');
            return;
        }
        assert.fail('Validation should have fail');
    });
    
    it('non-kaltura base base', function() {
        this.timeout(10000);
        const src = `
            class Base {}

            /**
             * Test object
             */
            class KalturaBase extends Base {
            
                /**
                 * Integer property
                 * @property int
                 * @type {number}
                 */
                Int() {}
            }
            
            /**
             * Test object
             */
            class KalturaTest extends KalturaBase {
            
                /**
                 * Integer property
                 * @property int
                 * @type {number}
                 */
                Int() {}
            }
            
            /**
             * Test
             * @service test
             */
            class Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {KalturaTest} obj The object
                 */
                doNothing (obj) {
                }
            }
            Controller.KalturaBase = KalturaBase;
            Controller.KalturaTest = KalturaTest;

            module.exports = Controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Type [KalturaBase] base class [Base] is not known as KalturaObject');
            return;
        }
        assert.fail('Validation should have fail');
    });
    
    it('not exported', function() {
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
            class Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {KalturaTest} obj The object
                 */
                doNothing (obj) {
                }
            }

            module.exports = Controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Type [KalturaTest] must be exported in its module');
            return;
        }
        assert.fail('Validation should have fail');
    });
    
    it('invalid name', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test object
             */
            class kalturaTest extends Nhoenix.KalturaObject {                
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
            class Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {kalturaTest} obj The object
                 */
                doNothing (obj) {
                }
            }
            Controller.kalturaTest = kalturaTest;

            module.exports = Controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Action [test.doNothing] argument [0] invalid type [kalturaTest]');
            return;
        }
        assert.fail('Validation should have fail');
    });
    
    it('invalid description', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * test object
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
            class Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 * @param {KalturaTest} obj The object
                 */
                doNothing (obj) {
                }
            }
            Controller.KalturaTest = KalturaTest;

            module.exports = Controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Type [KalturaTest] description [test object] is invalid');
            return;
        }
        assert.fail('Validation should have fail');
    });
});
