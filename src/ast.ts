export type SmoltLiteral = {type: 'literal'; value: string};
export type SmoltExpression = {type: 'expr', value: string};
export type SmoltBranch = {type: 'branch'; branches: Array<{condition: string|null; body: SmoltAST}>;};
export type SmoltStatement = SmoltLiteral|SmoltExpression|SmoltBranch;
export type SmoltBlock = {type: 'block'; statements: Array<SmoltStatement>;};
export type SmoltAST = SmoltStatement|SmoltBlock;

const REGEX_KEYWORD_ONLY = /^(true|false|null|undefined)$/;

const REGEX_SRC_IDENTIFIER = `[A-Za-z_$][A-Za-z0-9_$]*`;
const REGEX_SRC_VALUE = `${REGEX_SRC_IDENTIFIER}(\\s*\\.\\s*${REGEX_SRC_IDENTIFIER})*`;
const REGEX_VALUE = new RegExp(`\\b${REGEX_SRC_VALUE}\\b`, 'g');
const REGEX_VALUE_ONLY = new RegExp(`^${REGEX_SRC_VALUE}$`);

function replaceContextVarsOutQuote(src: string): string {
    return src.replace(REGEX_VALUE, (...args) => {
        if(REGEX_KEYWORD_ONLY.test(args[0])) return args[0];
        return "ctx." + args[0];
    });
}

function replaceContextVars(src: string): string {
    if(REGEX_VALUE_ONLY.test(src)) {
        if(REGEX_KEYWORD_ONLY.test(src)) return src;
        else return `ctx.${src}`;
    }
    
    let quote_char = "";
    let chunk_start = 0;
    const chunks: string[] = [];
    for(let i=0; i<src.length; ++i) {
        if(quote_char) {
            if(src[i] === quote_char && src[i-1] !== '\\') {
                quote_char = "";
                chunks.push(src.slice(chunk_start, i+1));
                chunk_start = i+1;
            }
            continue;
        }

        if(src[i] === '"' || src[i] === "'") {
            if(chunk_start < i) {
                chunks.push(replaceContextVarsOutQuote(src.slice(chunk_start, i)));
            }

            quote_char = src[i];
            chunk_start = i;
        }
    }

    if(quote_char) throw new Error(`Unclosed quotation started at loc=${chunk_start}!`);

    if(chunk_start < src.length) {
        const chunk = src.slice(chunk_start);
        chunks.push(quote_char ? chunk : replaceContextVarsOutQuote(chunk));
    }

    return chunks.join('');
}

function simplifyAST(ast: SmoltAST): SmoltAST {
    switch(ast.type) {
        case 'branch': {
            for(let i=0; i<ast.branches.length; ++i) {
                const branch = ast.branches[i];
                branch.body = simplifyAST(branch.body);

                if(branch.condition == null) {
                    ast.branches = ast.branches.slice(i+1);
                    break;
                }
            }
            break;
        }
        case 'block': {
            if(ast.statements.length === 1) return ast.statements[0];
        }
    }

    return ast;
}

export function makeAST(tokens: string[]): SmoltAST {
    let statements: Array<SmoltStatement> = [];
    const stack: Array<Array<SmoltStatement>> = [];

    for(let i=0; i<tokens.length; ++i) {
        const token = tokens[i];
        if(!token.startsWith("{{")) {
            statements.push({type: 'literal', value: token});
            continue;
        }

        if(i+2 >= tokens.length || tokens[i+2] !== '}}') {
            statements.push({type: 'literal', value: token});
            continue;
        }

        switch(token.slice(2)) {
            case "":
                statements.push({type: 'expr', value: replaceContextVars(tokens[i+1])});
                break;
            case "=":
                statements.push({type: 'expr', value: tokens[i+1]});
                break;
            case '#if': {
                const if_body: SmoltBlock = {type: 'block', statements: []};
                const if_statement: SmoltBranch = {type: 'branch', branches: [{condition: replaceContextVars(tokens[i+1]), body: if_body}]};

                statements.push(if_statement);
                stack.push(statements);

                statements = if_body.statements;
                break;
            }
            case '#elif': {
                const top_statement = stack.at(-1);
                if(!top_statement) throw new Error("Unmatched `elif`!");

                let branch_statement = top_statement.at(-1);
                if(branch_statement?.type !== 'branch') throw new Error(`Unexpected statement ${JSON.stringify(branch_statement)}!`);

                const new_block: SmoltBlock = {type: 'block', statements: []};
                branch_statement.branches.push({condition: replaceContextVars(tokens[i+1]), body: new_block});

                statements = new_block.statements;
                break;
            }
            case '#else': {
                const top_statement = stack.at(-1);
                if(!top_statement) throw new Error("Unmatched `else`!");

                let branch_statement = top_statement.at(-1);
                if(branch_statement?.type !== 'branch') throw new Error(`Unexpected statement ${JSON.stringify(branch_statement)}!`);

                const new_block: SmoltBlock = {type: 'block', statements: []};
                branch_statement.branches.push({condition: null, body: new_block});

                statements = new_block.statements;
                break;
            }
            case '#endif': {
                const popped_statements = stack.pop();
                if(!popped_statements) throw new Error("Unmatched `endif`!");
                statements = popped_statements;
                break;
            }
            case '//':
                // To remove a line consisting of only a command...
                statements.push({type: 'expr', value: "null"});
                break;
            default: {
                throw new Error(`Unknown command: \`${token.slice(2)}\`!`);
            }
        }

        i += 2;
    }

    return {type: 'block', statements};
}

export function astToSource(ast: SmoltAST): string {
    ast = simplifyAST(ast);

    if(ast.type === 'literal') {
        return `(()=>${JSON.stringify(ast.value)})`;
    }

    const SRC_INIT = `let W;{W=[${astToSourceInner(ast, false)}].flat()}`;
    const SRC_BUILD = `let S=[],f=!0,g,n=!1;for(let w of W){if(w!=null){g=w[w.length-1]==='\\n';if(f&&n&&w[0]==='\\n')w=w.slice(1);S.push(w);f=g}n=w==null}`;
    return `((ctx={})=>{\n${SRC_INIT}\n${SRC_BUILD}\nreturn S.join('')})`;
}

function astToSourceInner(ast: SmoltAST, need_bracket: boolean = true): string {
    switch(ast.type) {
        case 'literal': return JSON.stringify(ast.value);
        case 'expr': return `(${ast.value})`;
        case 'block':{
            const inner = ast.statements.map((statement) => astToSourceInner(statement, false)).join(',');
            if(need_bracket) return `[${inner}]`;
            else return inner;
        }
        case 'branch': {
            if(ast.branches.length === 0) return `[]`;
            if(ast.branches.length === 1) {
                return `(${ast.branches[0].condition})?${astToSourceInner(ast.branches[0].body)}:[]`;
            }
            return `(${ast.branches.map(({condition, body})=>{
                const compiled_body = astToSourceInner(body);
                return condition == null ? compiled_body : `(${condition})?${compiled_body}`;
            }).join(':')})`;
        }
        default: return ast;
    }
}