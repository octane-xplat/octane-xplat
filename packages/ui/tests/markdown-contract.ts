// Consumer compilation fixture for the documented Markdown entrypoint.
import {
	createMarkdownStreamParser,
	outlineFromDoc,
	parseMdDoc,
	flatTokensToLines,
	tokenize,
	type CodeTokenizer,
	type CodeToken,
	type MdDoc,
	type MarkdownProps,
	type SyntaxToken,
} from '@octane-xplat/ui/markdown'

const parser = createMarkdownStreamParser()
parser.append('# Release notes\n\n')
const document: MdDoc = parser.append('Hello **world')
outlineFromDoc(document)
const props: MarkdownProps = { data: document }
void props
parser.finish()
parser.reset()
parseMdDoc('# Hello')
const custom: CodeTokenizer = (code) => [{ type: 'comment', start: 0, end: code.length }]
flatTokensToLines(custom('hello', 'text'), 'hello')
tokenize('const ready = true', 'typescript')
const absolute: CodeToken = { type: 'keyword', start: 0, end: 5 }
const relative: SyntaxToken = { type: 'string', start: 6, end: 10 }
void absolute
void relative
// @ts-expect-error unsupported token category
const invalid: CodeToken = { type: 'invented', start: 0, end: 1 }
void invalid
// @ts-expect-error cache and segmentation plumbing is private
import { computeSegments } from '@octane-xplat/ui/markdown'
void computeSegments
