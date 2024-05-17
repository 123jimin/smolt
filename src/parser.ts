import {tokenize} from "./tokenizer.js";
import {makeAST, astToSource} from "./ast.js";

type SmoltTemplate = (args?: Record<string, unknown>) => string;

/**
 * Takes a template source, then returns the JavaScript code for the template function.
 * 
 * This function by itself is safe, unlike `makeTemplate`.
 * 
 * @param template_src Template source.
 * @returns The source code for a function which takes context variables and returns the templated string.
 */
export function toTemplateSrc(template_src: string): string {
    const tokens = tokenize(template_src);
    const ast = makeAST(tokens);
    const src = astToSource(ast);

    return src;
}

/**
 * Takes a template source, then compiles it into a template function.
 * 
 * Equivalent to `eval(toTemplateSrc(template_src))`, so this function *MUST NOT* be used when `template_src` can't be trusted.
 * 
 * @param template_src Template source.
 * @returns The function which takes context variables and returns the templated string.
 */
export function makeTemplate(template_src: string): SmoltTemplate { 
    const f = eval(toTemplateSrc(template_src));
    f.toString = () => f();
    return f;
}