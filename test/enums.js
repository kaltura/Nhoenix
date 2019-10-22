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

describe('enums', function() {

    it('in-module', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test enum
             * @kind enum
             */
            const KalturaTest = Nhoenix.KalturaStringEnum({
                VAL1: '1',
                VAL2: '2',
            });
            
            /**
             * Test
             * @service test
             */
            const controller = {
                KalturaTest: KalturaTest,

                /**
                 * Do nothing
                 * @param {KalturaTest} val The enum
                 * @action doNothing
                 */
                doNothing: (val) => {
                    return 1;
                }
            };                
            module.exports = controller;`;

        parser.controllers([writeSource(src)]);
    });
    
    it('required', function() {
        this.timeout(10000);
        const objectSource = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test enum
             * @kind enum
             */
            const KalturaTest = Nhoenix.KalturaNumericEnum({
                VAL1: 1,
                VAL2: 2,
            });
                        
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
                 * @param {KalturaTest} val The enum
                 * @action doNothing
                 */
                doNothing: (val) => {
                    return 1;
                }
            };                
            module.exports = controller;`;

        parser.controllers([writeSource(controllerSource)]);
    });
            
    it('required enums', function() {
        this.timeout(10000);
        const objectSource = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test enum
             * @kind enum
             */
            const KalturaTest1 = Nhoenix.KalturaStringEnum({
                VAL1: '1',
                VAL2: '2',
            });
                  
                  
            /**
             * Test enum
             * @kind enum
             */
            const KalturaTest2 = Nhoenix.KalturaStringEnum({
                VAL1: '1',
                VAL2: '2',
            });
                  
                        
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
                 * @param {KalturaTest1} val The enum
                 * @action doNothing
                 */
                doNothing: (val) => {
                    return 1;
                }
            };                
            module.exports = controller;`;

        parser.controllers([writeSource(controllerSource)]);
    });
    
            
    it('moduled enums', function() {
        this.timeout(10000);
        const objectSource = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');
  
            /**
             * Test enum
             * @kind enum
             */
            const KalturaTest1 = Nhoenix.KalturaStringEnum({
                VAL1: '1',
                VAL2: '2',
            });
                     
            /**
             * Test enum
             * @kind enum
             */
            const KalturaTest2 = Nhoenix.KalturaStringEnum({
                VAL1: '1',
                VAL2: '2',
            });
            
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
    
    it('no base', function() {
        this.timeout(10000);
        const src = `
            /**
             * Test enum
             * @kind enum
             */
            const KalturaTest = {
                VAL1: '1',
                VAL2: '2',
            };
            
            /**
             * Test
             * @service test
             */
            const controller = {
                KalturaTest: KalturaTest,

                /**
                 * Do nothing
                 * @param {KalturaTest} val The enum
                 * @action doNothing
                 */
                doNothing: (val) => {
                    return 1;
                }
            };                
            module.exports = controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Enum [KalturaTest] must extend from KalturaStringEnum or KalturaNumericEnum');
            return;
        }
        assert.fail('Validation should have fail');
    });
    
    it('not exported', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test enum
             * @kind enum
             */
            const KalturaTest = Nhoenix.KalturaStringEnum({
                VAL1: '1',
                VAL2: '2',
            });
            
            /**
             * Test
             * @service test
             */
            const controller = {
                /**
                 * Do nothing
                 * @param {KalturaTest} val The enum
                 * @action doNothing
                 */
                doNothing: (val) => {
                    return 1;
                }
            };                
            module.exports = controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Enum [KalturaTest] must be exported in its module');
            return;
        }
        assert.fail('Validation should have fail');
    });
    
    it('invalid name', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test enum
             * @kind enum
             */
            const kalturaTest = Nhoenix.KalturaStringEnum({
                VAL1: '1',
                VAL2: '2',
            });
            
            /**
             * Test
             * @service test
             */
            const controller = {
                kalturaTest: kalturaTest,
                
                /**
                 * Do nothing
                 * @param {kalturaTest} val The enum
                 * @action doNothing
                 */
                doNothing: (val) => {
                    return 1;
                }
            };                
            module.exports = controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Action [test.doNothing] argument [0] invalid type [kalturaTest]');
            return;
        }
        assert.fail('Validation should have fail');
    });
    
    it('invalid value name', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test enum
             * @kind enum
             */
            const kalturaTest = Nhoenix.KalturaStringEnum({
                val1: '1',
                VAL2: '2',
            });
            
            /**
             * Test
             * @service test
             */
            const controller = {
                kalturaTest: kalturaTest,
                
                /**
                 * Do nothing
                 * @param {kalturaTest} val The enum
                 * @action doNothing
                 */
                doNothing: (val) => {
                    return 1;
                }
            };                
            module.exports = controller;`;

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
             * test enum
             * @kind enum
             */
            const KalturaTest = Nhoenix.KalturaStringEnum({
                VAL1: '1',
                VAL2: '2',
            });
            
            /**
             * Test
             * @service test
             */
            const controller = {
                KalturaTest: KalturaTest,

                /**
                 * Do nothing
                 * @param {kalturaTest} val The enum
                 * @action doNothing
                 */
                doNothing: (val) => {
                    return 1;
                }
            };                
            module.exports = controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Enum [KalturaTest] description [test enum] is invalid');
            return;
        }
        assert.fail('Validation should have fail');
    });
    
    it('invalid string value', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test enum
             * @kind enum
             */
            const KalturaTest = Nhoenix.KalturaStringEnum({
                VAL1: 1,
                VAL2: 2,
            });
            
            /**
             * Test
             * @service test
             */
            const controller = {
                KalturaTest: KalturaTest,

                /**
                 * Do nothing
                 * @param {kalturaTest} val The enum
                 * @action doNothing
                 */
                doNothing: (val) => {
                    return 1;
                }
            };                
            module.exports = controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Enum value [1] must be string');
            return;
        }
        assert.fail('Validation should have fail');
    });
    
    it('invalid numeric value', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test enum
             * @kind enum
             */
            const KalturaTest = Nhoenix.KalturaNumericEnum({
                VAL1: '1',
                VAL2: '2',
            });
            
            /**
             * Test
             * @service test
             */
            const controller = {
                KalturaTest: KalturaTest,

                /**
                 * Do nothing
                 * @param {kalturaTest} val The enum
                 * @action doNothing
                 */
                doNothing: (val) => {
                    return 1;
                }
            };                
            module.exports = controller;`;

        try {
            parser.controllers([writeSource(src)]);
        }
        catch(e) {
            assert.equal(e, 'Enum value [1] must be numeric');
            return;
        }
        assert.fail('Validation should have fail');
    });
});
