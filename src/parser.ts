import {tokenize} from "./tokenizer.js";
import {makeAST, astToSource} from "./ast.js";

type SmoltTemplate = (args?: Record<string, unknown>) => string;

export function toTemplateSrc(template_src: string): string {
    const tokens = tokenize(template_src);
    const ast = makeAST(tokens);
    const src = astToSource(ast);

    return src;
}

export function makeTemplate(template_src: string): SmoltTemplate { 
    return eval(toTemplateSrc(template_src));
}