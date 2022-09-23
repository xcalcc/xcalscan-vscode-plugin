import * as MarkdownIt from "markdown-it";

class MarkdownEngine {
    public md2html(markdown: string) {
        const md = new MarkdownIt({
            linkify: true,
            breaks: true
        });
    
        return md.render(markdown.replace(/↵/g,'\n'));
    }
}

export const markdownEngine: MarkdownEngine = new MarkdownEngine();