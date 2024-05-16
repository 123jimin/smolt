type SmoltTemplate = (args: Record<string, unknown>) => string;

export function tokenize(template_src: string): string[] {
    const tokens: string[] = [];

    const regex_tag = /({{(?:#[A-Za-z]+\b\s?|\/\/|=)?)(.*?)}}/g;
    let last_index = 0;

    for(const match of template_src.matchAll(regex_tag)) {
        if(last_index < match.index) tokens.push(template_src.slice(last_index, match.index));
        tokens.push(match[1].trimEnd(), match[2].trim(), '}}');
        last_index = match.index + match[0].length;
    }

    if(last_index < template_src.length) tokens.push(template_src.slice(last_index));

    return tokens;
}

type SmoltLiteral = {type: 'literal'; value: string};
type SmoltContextExpression = {type: 'context_expr', value: string};
type SmoltRawExpression = {type: 'raw_expr', value: string;};
type SmoltBranch = {type: 'if'; condition: string; block: SmoltBlock; other?: SmoltBranch|SmoltBlock;};
type SmoltStatement = SmoltLiteral|SmoltContextExpression|SmoltRawExpression|SmoltBranch;
type SmoltBlock = {type: 'block'; statements: Array<SmoltStatement>;};
type SmoltAST = SmoltStatement|SmoltBlock;

export function parse(template_src: string): SmoltTemplate {
    const tokens = tokenize(template_src);
    const statements: Array<SmoltStatement> = [];
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
                statements.push({type: 'context_expr', value: tokens[i+1]});
                break;
            case "=":
                statements.push({type: 'raw_expr', value: tokens[i+1]});
                break;
            case 'if':
                break;
            case 'elif':
                break;
            case 'endif':
                break;
        }

        i += 2;
    }

    return makeTemplate({type: 'block', statements});
}

function makeTemplate(ast: SmoltAST): SmoltTemplate {
    return (ctx: Record<string, unknown>) => {
        return [...evaluate(ast, ctx)].join('');
    };
}

function* evaluate(ast: SmoltAST, ctx: Record<string, unknown>): Generator<string|null> {
    switch(ast.type) {
        case 'literal': {
            yield ast.value;
            break;
        }
        case 'context_expr': {
            // TODO: do it more smartly.
            let src = ast.value;
            src = src.replace(/\b[A-Za-z0-9_$]+\b/g, (m) => `ctx.${m}`);
            const res = eval(src);
            if(res == null) yield null;
            else yield `${res}`;
            break;
        }
        case 'raw_expr': {
            const res = eval(ast.value);
            if(res == null) yield null;
            else yield `${res}`;
            break;
        }
        case 'block': {
            for(const statement of ast.statements) yield* evaluate(statement, ctx);
            break;
        }
        default:
            yield `<${ast.type}>`;
    }
}