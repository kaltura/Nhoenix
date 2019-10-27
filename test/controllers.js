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

describe('controllers', function() {

    it('const', function() {
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
    
    it('multiple files', function() {
        this.timeout(10000);
        const src1 = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test 1
             * @service test1
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
            
        const src2 = `
            const Nhoenix = require('${path.resolve('./').replace(/\\/g, '\\\\')}');

            /**
             * Test 2
             * @service test2
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

        var services = parser.controllers([writeSource(src1), writeSource(src2)]);
        assert.equal(Object.keys(services).length, 2);
        assert.ok(services.test1);
        assert.ok(services.test2);
    });
    
    it('duplicate service', function() {
        this.timeout(10000);
        const src1 = `
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
            
        const src2 = `
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
