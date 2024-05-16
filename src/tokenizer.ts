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