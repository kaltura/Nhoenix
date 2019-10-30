const fs = require('fs');
const tmp = require('tmp');
const path = require('path');
const assert = require('assert');
const Nhoenix = require('../index.js');

function writeSource(src) {
    const filename = tmp.tmpNameSync({postfix: '.js'});
    fs.writeFileSync(filename, src);
    return filename;
}

describe('requests', function() {

    it('void', function() {
        this.timeout(10000);
        const src = `
            /**
             * Test
             * @service test
             */
            class Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 */
                doNothing () {
                }
            }

            module.exports = Controller;`;

        Nhoenix.use([writeSource(src)]);            
        var ret = Nhoenix.test('test', 'doNothing');
        assert.strictEqual(ret, null);
    });
    
    it('null', function() {
        this.timeout(10000);
        const src = `
            /**
             * Test
             * @service test
             */
            class Controller {
                /**
                 * Do nothing
                 * @param {string} myArg The param
                 * @action doNothing
                 */
                doNothing (myArg) {
                    return myArg;
                }
            }

            module.exports = Controller;`;

        Nhoenix.use([writeSource(src)]);
        
        try {
            Nhoenix.test('test', 'doNothing', {myArg: null});
        }
        catch(e) {
            assert.equal(e.message, 'Argument [myArg] cannot be empty');
            return;
        }
        assert.fail('Validation should have fail');
    });
    
    it('missing', function() {
        this.timeout(10000);
        const src = `
            /**
             * Test
             * @service test
             */
            class Controller {
                /**
                 * Do nothing
                 * @param {string} myArg The param
                 * @action doNothing
                 */
                doNothing (myArg) {
                    return myArg;
                }
            }

            module.exports = Controller;`;

        Nhoenix.use([writeSource(src)]);
        
        try {
            Nhoenix.test('test', 'doNothing', {});
        }
        catch(e) {
            assert.equal(e.message, 'Argument [myArg] cannot be empty');
            return;
        }
        assert.fail('Validation should have fail');
    });

    it('optional', function() {
        this.timeout(10000);
        const src = `                 
            /**
             * Test
             * @service test
             */
            class Controller {
                /**
                 * Do nothing
                 * @param {string} myArg The param @optional true
                 * @action doNothing
                 * @returns {string}
                 */
                doNothing (myArg) {
                    myArg = myArg || 'default value';
                    return myArg;
                }
            }

            module.exports = Controller;`;

        Nhoenix.use([writeSource(src)]);

        var ret = Nhoenix.test('test', 'doNothing', {myArg: 'set value'});
        assert.strictEqual(ret, 'set value');
          
        var ret = Nhoenix.test('test', 'doNothing', {});
        assert.strictEqual(ret, 'default value');
    });
    
    describe('string', function() {

        it('string', function() {
            this.timeout(10000);
            const src = `            
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {string} myArg The param
                     * @action doNothing
                     * @returns {string}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: 'my string'});
            assert.strictEqual(ret, 'my string');
        });
        
        it('int', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {string} myArg The param
                     * @action doNothing
                     * @returns {string}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: 123});
            assert.strictEqual(ret, '123');
        });
        
        it('float', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {string} myArg The param
                     * @action doNothing
                     * @returns {string}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: 1.5});
            assert.strictEqual(ret, '1.5');
        });
        
        it('boolean', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {string} myArg The param
                     * @action doNothing
                     * @returns {string}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: true});
            assert.strictEqual(ret, 'true');
        });
    });
    
    describe('boolean', function() {
        
        it('true', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {boolean} myArg The param
                     * @action doNothing
                     * @returns {boolean}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: true});
            assert.strictEqual(ret, true);
        });
        
        it('false', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {boolean} myArg The param
                     * @action doNothing
                     * @returns {boolean}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: false});
            assert.strictEqual(ret, false);
        });
        
        it('int true', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {boolean} myArg The param
                     * @action doNothing
                     * @returns {boolean}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: 1});
            assert.strictEqual(ret, true);
        });
        
        it('int false', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {boolean} myArg The param
                     * @action doNothing
                     * @returns {boolean}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: 0});
            assert.strictEqual(ret, false);
        });
        
        it('string true', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {boolean} myArg The param
                     * @action doNothing
                     * @returns {boolean}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: 'true'});
            assert.strictEqual(ret, true);
        });
        
        it('string false', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {boolean} myArg The param
                     * @action doNothing
                     * @returns {boolean}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: 'false'});
            assert.strictEqual(ret, false);
        });
        
        it('string int true', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {boolean} myArg The param
                     * @action doNothing
                     * @returns {boolean}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: '1'});
            assert.strictEqual(ret, true);
        });
        
        it('string int false', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {boolean} myArg The param
                     * @action doNothing
                     * @returns {boolean}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: '0'});
            assert.strictEqual(ret, false);
        });
        
        it('int non-boolean', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {boolean} myArg The param
                     * @action doNothing
                     * @returns {boolean}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);
            
            try {
                Nhoenix.test('test', 'doNothing', {myArg: 2});
            }
            catch(e) {
                assert.equal(e.message, 'Argument [myArg] value must be of type [boolean]');
                return;
            }
            assert.fail('Validation should have fail');
        });
        
        it('string non-boolean', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {boolean} myArg The param
                     * @action doNothing
                     * @returns {boolean}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);
            
            try {
                Nhoenix.test('test', 'doNothing', {myArg: 'invalid'});
            }
            catch(e) {
                assert.equal(e.message, 'Argument [myArg] value must be of type [boolean]');
                return;
            }
            assert.fail('Validation should have fail');
        });
        
        it('object non-boolean', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {boolean} myArg The param
                     * @action doNothing
                     * @returns {boolean}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);
            
            try {
                Nhoenix.test('test', 'doNothing', {myArg: {invalid: 'invalid'}});
            }
            catch(e) {
                assert.equal(e.message, 'Argument [myArg] value must be of type [boolean]');
                return;
            }
            assert.fail('Validation should have fail');
        });
    });
    
    describe('number', function() {
        
        it('int', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {number} myArg The param
                     * @action doNothing
                     * @returns {number}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: 35});
            assert.strictEqual(ret, 35);
        });
        
        it('string', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {number} myArg The param
                     * @action doNothing
                     * @returns {number}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: '45'});
            assert.strictEqual(ret, 45);
        });
        
        it('NaN', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {number} myArg The param
                     * @action doNothing
                     * @returns {number}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);
            
            try {
                Nhoenix.test('test', 'doNothing', {myArg: 'string'});
            }
            catch(e) {
                assert.equal(e.message, 'Argument [myArg] must be numeric');
                return;
            }
            assert.fail('Validation should have fail');
        });
    });
    
    describe('time', function() {
        
        it('int', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {time} myArg The param
                     * @action doNothing
                     * @returns {time}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: 35});
            assert.strictEqual(ret, 35);
        });
        
        it('string', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {time} myArg The param
                     * @action doNothing
                     * @returns {time}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: '45'});
            assert.strictEqual(ret, 45);
        });
        
        it('NaN', function() {
            this.timeout(10000);
            const src = `
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {time} myArg The param
                     * @action doNothing
                     * @returns {time}
                     */
                    doNothing (myArg) {
                        return myArg;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);
            
            try {
                Nhoenix.test('test', 'doNothing', {myArg: 'string'});
            }
            catch(e) {
                assert.equal(e.message, 'Argument [myArg] must be numeric');
                return;
            }
            assert.fail('Validation should have fail');
        });
        
    });
    
    describe('object', function() {
        
        it('simple', function() {
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
                     * @param {KalturaTest} myArg The param
                     * @action doNothing
                     * @returns {KalturaTest}
                     */
                    doNothing (myArg) {
                        return myArg.Test();
                    }
                }
                Controller.KalturaTest = KalturaTest;

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: {
                objectType: 'KalturaTest',
                test: 123
            }});
            assert.strictEqual(ret, 123);
        });
        
        it('untyped object', function() {
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
                     * @param {KalturaTest} myArg The param
                     * @action doNothing
                     * @returns {KalturaTest}
                     */
                    doNothing (myArg) {
                        return myArg.Test();
                    }
                }
                Controller.KalturaTest = KalturaTest;

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: {
                test: 123
            }});
            assert.strictEqual(ret, 123);
        });
        
        it('extended object', function() {
            this.timeout(10000);
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');
                
                /**
                 * Test object
                 */
                class KalturaTest extends Nhoenix.KalturaObject {
                    /**
                     * Test property
                     * @property test1
                     * @type {number}
                     */
                    Test1() {}
                }
                  
                /**
                 * Test object
                 */
                class KalturaExtended extends KalturaTest {                
                    /**
                     * Test property
                     * @property test2
                     * @type {number}
                     */
                    Test2() {}
                }

                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {KalturaTest} myArg The param
                     * @action doNothing
                     * @returns {KalturaTest}
                     */
                    doNothing (myArg) {
                        if(myArg instanceof KalturaExtended) {
                            return myArg.Test2();
                        }
                        return myArg.Test1();
                    }
                }
                Controller.KalturaTest = KalturaTest;
                Controller.KalturaExtended = KalturaExtended;

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: {
                objectType: 'KalturaExtended',
                test1: 123,
                test2: 456,
            }});
            assert.strictEqual(ret, 456);
        });
        
        it('double extended object', function() {
            this.timeout(10000);
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');
                
                /**
                 * Test object
                 */
                class KalturaTest extends Nhoenix.KalturaObject {
                    /**
                     * Test property
                     * @property test1
                     * @type {number}
                     */
                    Test1() {}
                }
                  
                /**
                 * Test object
                 */
                class KalturaExtended extends KalturaTest {                
                    /**
                     * Test property
                     * @property test2
                     * @type {number}
                     */
                    Test2() {}
                }
                  
                /**
                 * Test object
                 */
                class KalturaExtendedAgain extends KalturaExtended {                
                    /**
                     * Test property
                     * @property test3
                     * @type {number}
                     */
                    Test3() {}
                }
                  
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {KalturaTest} myArg The param
                     * @action doNothing
                     * @returns {KalturaTest}
                     */
                    doNothing (myArg) {
                        if(myArg instanceof KalturaExtendedAgain) {
                            return myArg.Test3();
                        }
                        if(myArg instanceof KalturaExtended) {
                            return myArg.Test2();
                        }
                        return myArg.Test1();
                    }
                }
                Controller.KalturaTest = KalturaTest;
                Controller.KalturaExtended = KalturaExtended;
                Controller.KalturaExtendedAgain = KalturaExtendedAgain;

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);
            var ret = Nhoenix.test('test', 'doNothing', {myArg: {
                objectType: 'KalturaExtendedAgain',
                test1: 123,
                test2: 456,
                test3: 789,
            }});
            assert.strictEqual(ret, 789);
            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: {
                objectType: 'KalturaExtended',
                test1: 123,
                test2: 456,
                test3: 789,
            }});
            assert.strictEqual(ret, 456);
        });
        
        it('nested object', function() {
            this.timeout(10000);
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');
                
                /**
                 * Test object
                 */
                class KalturaNested extends Nhoenix.KalturaObject {
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
                class KalturaTest extends Nhoenix.KalturaObject {                
                    /**
                     * Test property
                     * @property nested
                     * @type {KalturaNested}
                     */
                    Nested() {}
                }
                  
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {KalturaTest} myArg The param
                     * @action doNothing
                     * @returns {KalturaTest}
                     */
                    doNothing (myArg) {
                        return myArg.Nested().Test();
                    }
                }
                Controller.KalturaNested = KalturaNested;
                Controller.KalturaTest = KalturaTest;

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: {
                nested: {
                    test: 123
                }
            }});
            assert.strictEqual(ret, 123);
        });
        
        it('extended nested object', function() {
            this.timeout(10000);
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');
                
                /**
                 * Test object
                 */
                class KalturaNested extends Nhoenix.KalturaObject {
                    /**
                     * Test property
                     * @property test1
                     * @type {number}
                     */
                    Test1() {}
                }
                  
                /**
                 * Test object
                 */
                class KalturaExtendedNested extends KalturaNested {
                    /**
                     * Test property
                     * @property test2
                     * @type {number}
                     */
                    Test2() {}
                }
                  
                /**
                 * Test object
                 */
                class KalturaTest extends Nhoenix.KalturaObject {                
                    /**
                     * Test property
                     * @property nested
                     * @type {KalturaNested}
                     */
                    Nested() {}
                }
                  
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {KalturaTest} myArg The param
                     * @action doNothing
                     * @returns {KalturaTest}
                     */
                    doNothing (myArg) {
                        if(myArg.Nested() instanceof KalturaExtendedNested) {
                            return myArg.Nested().Test2();
                        }
                        return myArg.Nested().Test1();
                    }
                }
                Controller.KalturaNested = KalturaNested;
                Controller.KalturaExtendedNested = KalturaExtendedNested;
                Controller.KalturaTest = KalturaTest;

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: {
                nested: {
                    objectType: 'KalturaExtendedNested',
                    test1: 123,
                    test2: 456
                }
            }});
            assert.strictEqual(ret, 456);
        });

        it('abstract extended object', function() {
            this.timeout(10000);
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');
                
                /**
                 * Test object
                 * @abstract
                 */
                class KalturaTest extends Nhoenix.KalturaObject {
                    /**
                     * Test property
                     * @property test1
                     * @type {number}
                     */
                    Test1() {}
                }
                  
                /**
                 * Test object
                 */
                class KalturaExtended extends KalturaTest {                
                    /**
                     * Test property
                     * @property test2
                     * @type {number}
                     */
                    Test2() {}
                }
                  
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {KalturaTest} myArg The param
                     * @action doNothing
                     * @returns {KalturaTest}
                     */
                    doNothing (myArg) {
                        if(myArg instanceof KalturaExtended) {
                            return myArg.Test2();
                        }
                        return myArg.Test1();
                    }
                }
                Controller.KalturaTest = KalturaTest;
                Controller.KalturaExtended = KalturaExtended;

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: {
                objectType: 'KalturaExtended',
                test1: 123,
                test2: 456,
            }});
            assert.strictEqual(ret, 456);
        });

        it('abstract object', function() {
            this.timeout(10000);
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');
                
                /**
                 * Test object
                 * @abstract
                 */
                class KalturaTest extends Nhoenix.KalturaObject {
                    /**
                     * Test property
                     * @property test1
                     * @type {number}
                     */
                    Test1() {}
                }
                  
                /**
                 * Test object
                 */
                class KalturaExtended extends KalturaTest {                
                    /**
                     * Test property
                     * @property test2
                     * @type {number}
                     */
                    Test2() {}
                }
                  
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {KalturaTest} myArg The param
                     * @action doNothing
                     * @returns {KalturaTest}
                     */
                    doNothing (myArg) {
                        if(myArg instanceof KalturaExtended) {
                            return myArg.Test2();
                        }
                        return myArg.Test1();
                    }
                }
                Controller.KalturaTest = KalturaTest;
                Controller.KalturaExtended = KalturaExtended;

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            
            try {
                Nhoenix.test('test', 'doNothing', {myArg: {}});
            }
            catch(e) {
                assert.equal(e.message, 'Abstract parameter type [KalturaTest]');
                return;
            }
            assert.fail('Validation should have fail');
        });

        it('abstract nested extended object', function() {
            this.timeout(10000);
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');
                
                /**
                 * Test object
                 * @abstract
                 */
                class KalturaNested extends Nhoenix.KalturaObject {
                    /**
                     * Test property
                     * @property test1
                     * @type {number}
                     */
                    Test1() {}
                }
                  
                /**
                 * Test object
                 */
                class KalturaExtendedNested extends KalturaNested {
                    /**
                     * Test property
                     * @property test2
                     * @type {number}
                     */
                    Test2() {}
                }
                  
                /**
                 * Test object
                 */
                class KalturaTest extends Nhoenix.KalturaObject {                
                    /**
                     * Test property
                     * @property nested
                     * @type {KalturaNested}
                     */
                    Nested() {}
                }
                  
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {KalturaTest} myArg The param
                     * @action doNothing
                     * @returns {KalturaTest}
                     */
                    doNothing (myArg) {
                        return myArg.Nested().Test1();
                    }
                }
                Controller.KalturaNested = KalturaNested;
                Controller.KalturaExtendedNested = KalturaExtendedNested;
                Controller.KalturaTest = KalturaTest;

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: {
                nested: {
                    objectType: 'KalturaExtendedNested',
                    test1: 123
                }
            }});
            assert.strictEqual(ret, 123);
        });

        it('abstract nested object', function() {
            this.timeout(10000);
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');
                
                /**
                 * Test object
                 * @abstract
                 */
                class KalturaNested extends Nhoenix.KalturaObject {
                    /**
                     * Test property
                     * @property test1
                     * @type {number}
                     */
                    Test1() {}
                }
                  
                /**
                 * Test object
                 */
                class KalturaExtendedNested extends KalturaNested {
                    /**
                     * Test property
                     * @property test2
                     * @type {number}
                     */
                    Test2() {}
                }
                  
                /**
                 * Test object
                 */
                class KalturaTest extends Nhoenix.KalturaObject {                
                    /**
                     * Test property
                     * @property nested
                     * @type {KalturaNested}
                     */
                    Nested() {}
                }
                  
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {KalturaTest} myArg The param
                     * @action doNothing
                     * @returns {KalturaTest}
                     */
                    doNothing (myArg) {
                        return myArg.Nested().Test1();
                    }
                }
                Controller.KalturaNested = KalturaNested;
                Controller.KalturaExtendedNested = KalturaExtendedNested;
                Controller.KalturaTest = KalturaTest;

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            
            try {
                Nhoenix.test('test', 'doNothing', {myArg: {
                    nested: {
                        test1: 123
                    }
                }});
            }
            catch(e) {
                assert.equal(e.message, 'Abstract parameter type [KalturaNested]');
                return;
            }
            assert.fail('Validation should have fail');
        });

        it('default property', function() {
            this.timeout(10000);
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');
                
                /**
                 * Test object
                 */
                class KalturaTest extends Nhoenix.KalturaObject {
                    
                    constructor() {
                        super();
                        this.test = 123;
                    }

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
                     * @param {KalturaTest} myArg The param
                     * @action doNothing
                     * @returns {KalturaTest}
                     */
                    doNothing (myArg) {
                        return myArg.Test();
                    }
                }
                Controller.KalturaTest = KalturaTest;

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: {}});
            assert.strictEqual(ret, 123);
        });

        it('property restrictions', function() {
            this.timeout(10000);
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');
                
                /**
                 * Test object
                 */
                class KalturaTest extends Nhoenix.KalturaObject {
                    
                    /**
                     * Test property
                     * @property int
                     * @minValue 3
                     * @maxValue 5
                     * @type {number}
                     */
                    Int() {}
                    
                    /**
                     * Test property
                     * @property str
                     * @minLength 3
                     * @maxLength 5
                     * @type {string}
                     */
                    Str() {}
                }
                  
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {KalturaTest} myArg The param
                     * @action doNothing
                     * @returns {string}
                     */
                    doNothing (myArg) {
                        return myArg.Str() + ':' + myArg.Int();
                    }
                }
                Controller.KalturaTest = KalturaTest;

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {myArg: {
                int: 4,
                str: '1234'
            }});
            assert.strictEqual(ret, '1234:4');
            
            try {
                Nhoenix.test('test', 'doNothing', {myArg: {
                    int: 2,
                    str: '1234'
                }});
                assert.fail('Validation should have fail');
            }
            catch(e) {
                assert.equal(e.message, 'Argument [int] minimum value is [3]');
            }

            try {
                Nhoenix.test('test', 'doNothing', {myArg: {
                    int: 8,
                    str: '1234'
                }});
                assert.fail('Validation should have fail');
            }
            catch(e) {
                assert.equal(e.message, 'Argument [int] maximum value is [5]');
            }

            try {
                Nhoenix.test('test', 'doNothing', {myArg: {
                    int: 4,
                    str: '12'
                }});
                assert.fail('Validation should have fail');
            }
            catch(e) {
                assert.equal(e.message, 'Argument [str] minimum length is [3]');
            }

            try {
                Nhoenix.test('test', 'doNothing', {myArg: {
                    int: 4,
                    str: '123456'
                }});
                assert.fail('Validation should have fail');
            }
            catch(e) {
                assert.equal(e.message, 'Argument [str] maximum length is [5]');
            }
        });

        it('args restrictions', function() {
            this.timeout(10000);
            const src = `                  
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {number} int The param @minValue 3 @maxValue 5
                     * @param {string} str The param @minLength 3 @maxLength 5
                     * @action doNothing
                     * @returns {string}
                     */
                    doNothing (int, str) {
                        return str + ':' + int;
                    }
                }

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {
                int: 4,
                str: '1234'
            });
            assert.strictEqual(ret, '1234:4');
            
            try {
                Nhoenix.test('test', 'doNothing', {
                    int: 2,
                    str: '1234'
                });
                assert.fail('Validation should have fail');
            }
            catch(e) {
                assert.equal(e.message, 'Argument [int] minimum value is [3]');
            }

            try {
                Nhoenix.test('test', 'doNothing', {
                    int: 8,
                    str: '1234'
                });
                assert.fail('Validation should have fail');
            }
            catch(e) {
                assert.equal(e.message, 'Argument [int] maximum value is [5]');
            }

            try {
                Nhoenix.test('test', 'doNothing', {
                    int: 4,
                    str: '12'
                });
                assert.fail('Validation should have fail');
            }
            catch(e) {
                assert.equal(e.message, 'Argument [str] minimum length is [3]');
            }

            try {
                Nhoenix.test('test', 'doNothing', {
                    int: 4,
                    str: '123456'
                });
                assert.fail('Validation should have fail');
            }
            catch(e) {
                assert.equal(e.message, 'Argument [str] maximum length is [5]');
            }
        });
    });
    
    describe('enum', function() {
        
        it('string', function() {
            this.timeout(10000);
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');
                
                /**
                 * Test enum
                 * @kind enum
                 */
                const KalturaTest = Nhoenix.KalturaStringEnum({
                    VAL1: 'abc',
                    VAL2: 'def',
                });
                              
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {KalturaTest} val The enum
                     * @action doNothing
                     * @returns {string}
                     */
                    doNothing (val) {
                        return val;
                    }
                }
                Controller.KalturaTest = KalturaTest;

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {val: 'abc'});
            assert.strictEqual(ret, 'abc');
        });
        
        it('property', function() {
            this.timeout(10000);
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');
                
                /**
                 * Test enum
                 * @kind enum
                 */
                const KalturaTestType = Nhoenix.KalturaStringEnum({
                    VAL1: 'abc',
                    VAL2: 'def',
                });
                
                /**
                 * Test object
                 */
                class KalturaTest extends Nhoenix.KalturaObject {                
                    /**
                     * Test property
                     * @property test
                     * @type {KalturaTestType}
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
                     * @param {KalturaTest} obj The object
                     * @action doNothing
                     * @returns {string}
                     */
                    doNothing (obj) {
                        return obj.Test();
                    }
                }
                Controller.KalturaTestType = KalturaTestType;
                Controller.KalturaTest = KalturaTest;

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {
                obj: {
                    test: 'abc'
                }
            });
            assert.strictEqual(ret, 'abc');
        });

        it('invalid string', function() {
            this.timeout(10000);
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');
                
                /**
                 * Test enum
                 * @kind enum
                 */
                const KalturaTest = Nhoenix.KalturaStringEnum({
                    VAL1: 'abc',
                    VAL2: 'def',
                });
                              
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {KalturaTest} val The enum
                     * @action doNothing
                     * @returns {string}
                     */
                    doNothing (val) {
                        return val;
                    }
                }
                Controller.KalturaTest = KalturaTest;

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
                        
            try {
                Nhoenix.test('test', 'doNothing', {val: 'abcd'});
                assert.fail('Validation should have fail');
            }
            catch(e) {
                assert.equal(e.message, 'Argument [val] values must be of type [KalturaTest]');
            }
        });
        
        it('invalid property', function() {
            this.timeout(10000);
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');
                
                /**
                 * Test enum
                 * @kind enum
                 */
                const KalturaTestType = Nhoenix.KalturaStringEnum({
                    VAL1: 'abc',
                    VAL2: 'def',
                });
                
                /**
                 * Test object
                 */
                class KalturaTest extends Nhoenix.KalturaObject {                
                    /**
                     * Test property
                     * @property test
                     * @type {KalturaTestType}
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
                     * @param {KalturaTest} obj The object
                     * @action doNothing
                     * @returns {string}
                     */
                    doNothing (obj) {
                        return obj.Test();
                    }
                }
                Controller.KalturaTestType = KalturaTestType;
                Controller.KalturaTest = KalturaTest;

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);
                    
            try {
                Nhoenix.test('test', 'doNothing', {
                    obj: {
                        test: 'abcd'
                    }
                });
                assert.fail('Validation should have fail');
            }
            catch(e) {
                assert.equal(e.message, 'Argument [test] values must be of type [KalturaTestType]');
            }
        });
        
        it('numeric', function() {
            this.timeout(10000);
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');
                
                /**
                 * Test enum
                 * @kind enum
                 */
                const KalturaTest = Nhoenix.KalturaNumericEnum({
                    VAL1: 123,
                    VAL2: 456,
                });
                
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {KalturaTest} val The enum
                     * @action doNothing
                     * @returns {string}
                     */
                    doNothing (val) {
                        return val;
                    }
                }
                Controller.KalturaTest = KalturaTest;

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
            var ret = Nhoenix.test('test', 'doNothing', {val: 123});
            assert.strictEqual(ret, 123);
        });
        
        it('invalid numeric', function() {
            this.timeout(10000);
            const src = `
                const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');
                
                /**
                 * Test enum
                 * @kind enum
                 */
                const KalturaTest = Nhoenix.KalturaNumericEnum({
                    VAL1: 123,
                    VAL2: 456,
                });
                
                /**
                 * Test
                 * @service test
                 */
                class Controller {
                    /**
                     * Do nothing
                     * @param {KalturaTest} val The enum
                     * @action doNothing
                     * @returns {string}
                     */
                    doNothing (val) {
                        return val;
                    }
                }
                Controller.KalturaTest = KalturaTest;

                module.exports = Controller;`;

            Nhoenix.use([writeSource(src)]);            
                        
            try {
                Nhoenix.test('test', 'doNothing', {val: 1234});
                assert.fail('Validation should have fail');
            }
            catch(e) {
                assert.equal(e.message, 'Argument [val] values must be of type [KalturaTest]');
            }
        });
    });        
});