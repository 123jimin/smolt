// @ts-check

import { assert } from 'chai';
import { tokenize, makeTemplate } from "../dist/index.js";

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

describe("makeTemplate", function() {
    it("should be able to handle the example", function() {
        const t = makeTemplate("{{#if name}}Hello, {{toUpper(name)}}!{{#else}}Who are you?{{#endif}}");
        assert.strictEqual(t({name: "Smith", toUpper: (name) => name.toUpperCase()}), "Hello, SMITH!");
        assert.strictEqual(t(), "Who are you?");
        assert.strictEqual(`${t}`, "Who are you?");
    });

    it("should leave simple strings unchanged", function() {
        /**
         * @param {string} s 
         */
        function checkSimple(s) {
            assert.strictEqual(makeTemplate(s)(), s)
        }
        
        checkSimple("");
        checkSimple(" ");
        checkSimple("Hello, world!");
        checkSimple("The quick \n //brown fox jumps\t\nover  {  the\nlazy }># dog.");
    });

    it("should be able to substitute variables", function() {
        assert.strictEqual(makeTemplate("{{foo}}")({foo: "Hello, world!"}), "Hello, world!");
        assert.strictEqual(makeTemplate("{{bar}}")({foo: 1, bar: 2}), "2");
        assert.strictEqual(makeTemplate("{{foo}} + {{bar}} = {{foo + bar}}")({foo: 1, bar: 2}), "1 + 2 = 3");
        assert.strictEqual(makeTemplate("{{$foo}}, {{foo.bar}}, {{_baz[0]}}, {{$x[1]}}")({$foo: 1, foo: {bar: 2}, _baz: [3], $x: [5, 4, 3, 2, 1]}), "1, 2, 3, 4");
    });

    it("should not substitute keywords", function() {
        assert.strictEqual(makeTemplate("{{true}} {{false}} null={{null}} undefined={{undefined}}")({"true": 1, "false": 2, "null": 3, "undefined": 4}), "true false null= undefined=")
    });

    it("should be able to handle quoted string sproperly", function() {
        assert.strictEqual(makeTemplate(`{{"Hello, world!"}} {{foo + "asdf"}}`)({foo: 1}), "Hello, world! 1asdf");
        assert.strictEqual(makeTemplate(`{{asdf + "asdf\\"asdf" + asdf}}`)({asdf: 'foo'}), "fooasdf\"asdffoo");
    });

    it("should handle comments", function() {
        assert.strictEqual(makeTemplate("{{// Hello, world!}}")(), "");
        assert.strictEqual(makeTemplate("The quick brown\n{{// Hello, world!}}\nfox jumps over\n{{// Hi!}}the lazy dog.")(), "The quick brown\nfox jumps over\nthe lazy dog.");
    })

    it("should remove a null line", function() {
        assert.strictEqual(makeTemplate(`Hello\n{{= ""}}\nworld!`)(), "Hello\n\nworld!");
        assert.strictEqual(makeTemplate(`Hello\n{{= null}}\nworld!`)(), "Hello\nworld!");
        assert.strictEqual(makeTemplate(`He{{bar}}\n{{= null}}llo\n{{foo}}{{= null}}{{bar}}\nworl{{foo}}d!`)({foo: null, bar: (void 0)}), "He\nllo\nworld!");
        assert.strictEqual(makeTemplate(`Hello\n{{= null}} {{= null}}\nworld!`)(), "Hello\n \nworld!");

        assert.strictEqual(makeTemplate(`Hello,\n{{null}}{{undefined}}\n{{// uwu}}\n{{= false}}\nworld!`)(), "Hello,\nfalse\nworld!");
    });

    it("should be able to handle multiple elif chains", function() {
        const v = makeTemplate("{{#if foo == 1}}ONE{{#elif foo == 2}}TWO{{#elif foo == 3}}THREE{{#else}}FOUR{{#endif}}");
        assert.strictEqual(v({foo: 1}), 'ONE');
        assert.strictEqual(v({foo: 2}), 'TWO');
        assert.strictEqual(v({foo: 3}), 'THREE');
        assert.strictEqual(v({foo: 4}), 'FOUR');
    });

    describe("toString", function() {
        it("should return the templated string with no context", function() {
            assert.strictEqual(makeTemplate("Hello, world!").toString(), "Hello, world!");
        });
    });
});