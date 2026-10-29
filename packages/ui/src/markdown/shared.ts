// Renderer-neutral Markdown document, streaming, outline and syntax contracts.
export { parseMdDoc, parseMdNodes, mdInlineText } from './markdown-parse'
export { createMarkdownStreamParser } from './markdown-stream'
export type { MarkdownStreamParser } from './markdown-stream'
export {
	outlineFromDoc,
	parseOutlineFromMarkdown,
	markdownHeadings,
	inlineMarkdownText,
	slugify,
	uniqueSlug,
} from '../components/collections/outline-utils'

export { useOutlineFromDoc, useOutlineFromMarkdown } from '../components/collections/outline-hooks.tsrx'
export {
	tokenize,
	tokenizeAsync,
	tokenizeStreaming,
	flatTokensToLines,
	TOKEN_TYPES,
	syntaxTokenVar,
	syntaxTokenVarRef,
} from './code-tokenizer'

export type { SyntaxTokenType } from './code-tokenizer'
export type {
	MdDoc,
	MdNode,
	MdInline,
	MarkdownProps,
	MarkdownDataProps,
	MarkdownTextProps,
	MarkdownPresentationProps,
	MarkdownScreenProps,
	OutlineItem,
	CodeToken,
	SyntaxToken,
	TokenLine,
	CodeTokenizer,
} from '../props'

export { useStreamingText } from '../components/content/use-streaming-text'
export type { StreamingTextSpeed, UseStreamingTextOptions } from '../components/content/use-streaming-text'
