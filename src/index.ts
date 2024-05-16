type SmoltTemplate = (args: Record<string, unknown>) => string;

export function parse(template_src: string): SmoltTemplate {
    // TODO: implement this!
    return () => template_src;
}