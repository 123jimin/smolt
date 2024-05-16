export type SmoltLiteral = {type: 'literal'; value: string};
export type SmoltExpression = {type: 'expr', value: string};
export type SmoltBranch = {type: 'branch'; branches: Array<{condition: string|null; body: SmoltBlock}>;};
export type SmoltStatement = SmoltLiteral|SmoltExpression|SmoltBranch;
export type SmoltBlock = {type: 'block'; statements: Array<SmoltStatement>;};
export type SmoltAST = SmoltStatement|SmoltBlock;

function replaceContextVars(src: string): string {
    // TODO: do it more smartly.
    return src.replace(/\b[A-Za-z_$][A-Za-z0-9_$]*\b/g, (m) => `ctx.${m}`);
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
            default: {
                throw new Error(`Unknown command: \`${token.slice(2)}\`!`);
            }
        }

        i += 2;
    }

    return {type: 'block', statements};
}

export function compileAST(ast: SmoltAST): string {
    // TODO:
    // - Remove redundant brackets.
    // - Remove a `null` line.
    return `((ctx)=>{const _W_=[${compileASTInner(ast)}].flat();return _W_.join('')})`;
}

function compileASTInner(ast: SmoltAST): string {
    switch(ast.type) {
        case 'literal': return JSON.stringify(ast.value);
        case 'expr': return `(${ast.value})`;
        case 'block': return `[${ast.statements.map(compileASTInner).join(',')}]`;
        case 'branch': {
            if(ast.branches.length <= 1) {
                return `(${ast.branches[0].condition})?${compileASTInner(ast.branches[0].body)}:[]`;
            }
            return `(${ast.branches.map(({condition, body})=>{
                const compiled_body = compileASTInner(body);
                return condition == null ? compiled_body : `(${condition})?${compiled_body}`;
            }).join(':')})`;
        }
        default: return ast;
    }
}