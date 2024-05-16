// @ts-check

import { assert } from 'chai';
import { parse } from "../dist/index.js";

describe("parse", function() {
    it("should leave simple strings unchanged", function() {
        /**
         * @param {string} s 
         */
        function checkSimple(s) {
            assert.equal(parse(s)({}), s)
        }
        
        checkSimple("");
        checkSimple(" ");
        checkSimple("Hello, world!");
        checkSimple("The quick \n //brown fox jumps\t\nover  {  the\nlazy }># dog.");
    });
});