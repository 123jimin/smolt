# smolt

> [!CAUTION]
> This library UNSAFE, as it uses `eval`.
> **Only use this in a personal project.**

> [!CAUTION]
> This library is currently work-in-progress. Any API may change.

## Introduction

smolt is a smol and simple JavaScript template engine. smolt aims to achieve smol code size (compared to, for example, 87KB of Handlebars), suitable for other smol, **non-production** JavaScript projects.

## Usage

```js
import { parse } from smolt;

const f = parse("Hello, {{toUpper(name)}}!");
console.log(f({
    name: "Smith",
    toUpper: (name) => name.toUpperCase(),
}));

// Prints "Hello, SMITH!".
```

## Grammar

```text
{{context_variable_name}}
{{context_function_name(arg1, arg2, arg3, ...)}}
{{= arbitrary JavaScript expression (scary!) }}
{{// arbitrary comment}}
{{#for var in ...}}
{{#if ...}} {{#elif ...}} {{#endif}}
```
