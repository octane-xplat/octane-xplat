// Web leaf for the shared Markdown implementation. The shared file renders
// through universal leaves (MdParagraph/View/Table resolve their own web
// twins) plus universal @try/@pending/@catch boundary vocabulary, so the web
// barrel resolves to this leaf rather than scanning the shared file for
// host elements.
export { Markdown, MarkdownScreen, MarkdownPluginNodeRenderer } from './Markdown.tsrx'
