
const Nhoenix = require('nhoenix');

/**
 * Test object
 */
class KalturaTest extends Nhoenix.KalturaObject {

    /**
     * Integer property
     * @type {number}
     */
    int = 0

    /**
     * String property
     * @type {string}
     */
    str = null

    /**
     * Boolean property
     * @type {boolean}
     */
    bl = null

    /**
     * Time property
     * @type {time}
     */
    tim = null

}

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
    },

    /**
     * Throw exception
     * @action throw
     * @returns {number}
     */
    error: () => {
        throw new Nhoenix.KalturaAPIException('CUSTOM_ERROR', 'Custom Error');
    },

    /**
     * Return arg
     * @action do
     * @param {string} myArg The param
     * @returns {string}
     */
    doAction: myArg => {
        return myArg;
    },

    /**
     * Concat
     * @action concat
     * @param {string} a Param A
     * @param {string} b Param B
     * @returns {string}
     */
    concat: (a, b) => {
        return `${a}${b}`;
    },

    /**
     * Do promise
     * @action promise
     * @param {string} a Param A
     * @param {string} b Param B
     * @returns {string}
     */
    promise: (a, b) => {
        return Promise.resolve(`Promise: ${a}${b}`);
    },
};

module.exports = controller;