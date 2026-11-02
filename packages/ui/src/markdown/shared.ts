// Renderer-neutral Markdown document, streaming, outline and syntax contracts.
export { parseMdDoc, parseMdNodes, parseMdInline } from './markdown-parse'
export {
	createMarkdownStreamParser,
	createMarkdownIncrementalState,
	parseMarkdownIncremental,
	trimStreamingArtifacts,
} from './markdown-stream'
export type { MarkdownStreamParser, MarkdownIncrementalState } from './markdown-stream'
export { decodeMarkdownCharacterReferences } from './markdown-character-references'
export {
	assertMdDoc,
	isMdDoc,
	mdDoc,
	mdInlineText,
	mdInlineLen,
	mdNodeText,
	MD_DOC_KIND,
	MD_DOC_VERSION,
} from './markdown-ast'
export {
	outlineFromDoc,
	parseOutlineFromMarkdown,
	markdownHeadings,
	projectMdHeadings,
	inlineMarkdownText,
	slugify,
	uniqueSlug,
} from '../components/collections/outline-utils'

export {
	useOutlineFromDoc,
	useOutlineFromMarkdown,
} from '../components/collections/outline-hooks.tsrx'
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
	MdDataValue,
	MdPoint,
	MdPosition,
	MdExtension,
	MdText,
	MdStrong,
	MdEmphasis,
	MdDelete,
	MdInlineCode,
	MdInlineMath,
	MdLink,
	MdImage,
	MdCitation,
	MdBreak,
	MdHeading,
	MdParagraph,
	MdCode,
	MdMath,
	MdBlockquote,
	MdList,
	MdListItem,
	MdTable,
	MdTableRow,
	MdTableCell,
	MdTableAlignment,
	MdThematicBreak,
	MdParseOptions,
	MarkdownProps,
	MarkdownDataProps,
	MarkdownSourceProps,
	MarkdownPresentationProps,
	MarkdownComponents,
	MarkdownInlinePlugin,
	MarkdownSource,
	MarkdownSourceLines,
	MarkdownScreenProps,
	OutlineItem,
	CodeToken,
	SyntaxToken,
	TokenLine,
	CodeTokenizer,
} from '../props'

export { useStreamingText } from '../components/content/use-streaming-text.tsrx'
export type {
	StreamingTextSpeed,
	UseStreamingTextOptions,
} from '../components/content/use-streaming-text.tsrx'
