# smolt

[![NPM Version](https://img.shields.io/npm/v/%40jiminp%2Fsmolt)](https://www.npmjs.com/package/@jiminp/smolt) ![GitHub License](https://img.shields.io/github/license/123jimin/smolt)

smolt is a smol and simple JavaScript template engine.

smolt aims to achieve smol code size.

**smolt has smol security, as smolt uses `eval` for compiling templates!**

smolt is only suitable for smol JavaScript projects where all templates can be trusted.

## Installation

```sh
npm install @jiminp/smolt
```

## Usage

```js
import { makeTemplate } from smolt;

const f = makeTemplate("{{#if name}}Hello, {{toUpper(name)}}!{{#else}}Who are you?{{#endif}}");

// Prints "Hello, SMITH!".
console.log(f({
    name: "Smith",
    toUpper: (name) => name.toUpperCase(),
}));

// Prints "Who are you?".
console.log(f());

// Prints "Who are you?" (calls `f.toString()`).
console.log(`${f}`);

```

smolt has a smol api.

```ts
type SmoltTemplate = (args?: Record<string, unknown>) => string;

// Uses `eval` to compile the source.
function makeTemplate(template_src: string): SmoltTemplate;

// Returns the source code, which can be `eval`-d to obtain a template function.
function toTemplateSrc(template_src: string): string;
```

## Grammar

smolt has a smol grammar.

```text
{{ctx_var}}
{{ctx_func(arg1, arg2, arg3, ...)}}
{{ctx_var + ctx_var}}
{{"prefix" + ctx_var + "postfix"}}
```

smolt has smol intelligence, and assumes all variables are from the context.

smolt makes you avoid this issue by doing the following.

```text
{{= ctx.ctx_var}}
{{= ctx.ctx_func(arg1, arg2, arg3, ...)}}
{{= Math.random()}}
{{= ... any arbitrary JavaScript expression (scary!) }}
```

smolt has branches, but no loops yet.

```text
{{#if ctx_var == "foo"}}var is foo{{#elif ctx_var == "baz"}}var is baz{{#endif}}
```

smolt has comments.

```text
Hello,
{{// owo}}
world!
```

smolt removes a line that only contains comments or null values; the below template gives `Hello,\nfalse\nworld!`.

```text
Hello,
{{null}}{{undefined}}
{{// uwu}}
{{= false}}
world!
```
