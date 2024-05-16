// @ts-check

import { assert } from 'chai';
import { tokenize, parse } from "../dist/index.js";

describe("tokenize", function() {
    it("should be able to tokenize simple string", function() {
        const empty_tokens = tokenize("");
        assert.isArray(empty_tokens);
        if(empty_tokens.length > 0) {
            assert.deepStrictEqual(empty_tokens, [""]);
        }
        assert.deepStrictEqual(tokenize("Hello, world!"), ["Hello, world!"]);
    });

    it("should be able to tokenize strings with variables", function() {
        assert.deepStrictEqual(tokenize("{{foo}}"), ["{{", "foo", "}}"]);
        assert.deepStrictEqual(tokenize("{{bar.baz}}"), ["{{", "bar.baz", "}}"]);
        assert.deepStrictEqual(tokenize("Hello {{foo}}, goodbye {{bar}}! {{ baz   }}  "), ["Hello ", "{{", "foo", "}}", ", goodbye ", "{{", "bar", "}}", "! ", "{{", "baz", "}}", "  "]);
    });

    it("should be able to handle branches", function() {
        assert.deepStrictEqual(tokenize("{{#if asdf}}"), ["{{#if", "asdf", "}}"]);
        assert.deepStrictEqual(tokenize("A {{#if b}} {{hello world}} C {{#elif d}} E {{#endif}}"), ["A ", "{{#if", "b", "}}", " ", "{{", "hello world", "}}", " C ", "{{#elif", "d", "}}", " E ", "{{#endif", "", "}}"]);
    });
});

describe("parse", function() {
    it("should be able to handle the example", function() {
        assert.strictEqual(parse("Hello, {{toUpper(name)}}!")({name: "Smith", toUpper: (name) => name.toUpperCase()}), "Hello, SMITH!")
    });

    it("should leave simple strings unchanged", function() {
        /**
         * @param {string} s 
         */
        function checkSimple(s) {
            assert.strictEqual(parse(s)({}), s)
        }
        
        checkSimple("");
        checkSimple(" ");
        checkSimple("Hello, world!");
        checkSimple("The quick \n //brown fox jumps\t\nover  {  the\nlazy }># dog.");
    });

    it("should be able to substitute variables", function() {
        assert.strictEqual(parse("{{foo}}")({foo: "Hello, world!"}), "Hello, world!");
        assert.strictEqual(parse("{{bar}}")({foo: 1, bar: 2}), "2");
    });
});