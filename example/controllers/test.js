
const Nhoenix = require('nhoenix');

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

    multiply() {
        return this.Int() * 2;
    }
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

    /**
     * Return object property
     * @action objectProperty
     * @param {KalturaTest} obj The object
     * @returns {number}
     */
    objectProperty: (obj) => {
        return obj.Int();
    },

    /**
     * Return object method
     * @action objectMethod
     * @param {KalturaTest} obj The object
     * @returns {number}
     */
    objectMethod: (obj) => {
        return obj.multiply();
    },
};

module.exports = controller;