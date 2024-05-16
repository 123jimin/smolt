import {tokenize} from "./tokenizer.js";
import {makeAST, compileAST, type SmoltAST} from "./ast.js";

type SmoltTemplate = (args: Record<string, unknown>) => string;

export function parse(template_src: string): SmoltTemplate {
    const tokens = tokenize(template_src);
    const ast = makeAST(tokens);
    const src = compileAST(ast);
    
    return eval(src);
}