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

describe('controller', function() {

    it('basic', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 */
                doNothing () {
                }
            }
            module.exports = Controller;`;

        parser.controllers([writeSource(src)]);
    });
    
    it('no controller', function() {
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 */
                doNothing () {
                }
            }
            module.exports = Controller;`;

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
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 */
                doNothing () {
                }
            }
            module.exports = Controller;`;

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
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * 
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 */
                doNothing () {
                }
            }
            module.exports = Controller;`;

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
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * no capital letter
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 */
                doNothing () {
                }
            }
            module.exports = Controller;`;

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
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service Test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 */
                doNothing () {
                }
            }
            module.exports = Controller;`;

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
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service 1test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 */
                doNothing () {
                }
            }
            module.exports = Controller;`;

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
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test_
             */
            class Controller extends Nhoenix.Controller {
                 /**
                  * Do nothing
                  * @action doNothing
                  */
                 doNothing () {
                 }
            }
            module.exports = Controller;`;

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
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
            }
            module.exports = Controller;`;

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
        this.timeout(10000);
        const src = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test
             * @service test
             */
            class Controller extends Nhoenix.Controller {
                /**
                 * Do nothing
                 * @action doNothing
                 */
                do1 () {
                }
                /**
                 * Do nothing
                 * @action doNothing
                 */
                do2 () {
                }
            }
            module.exports = Controller;`;

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