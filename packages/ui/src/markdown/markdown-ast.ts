// Canonical Markdown document model — the recursive, serializable AST every
// Markdown entry point shares. Node names and fields follow Astryx's
// MDAST-aligned canonical tree (packages/core/src/Markdown/ast.ts at
// v0.7.4, MIT) so parse output, baked route data, transforms, and outline
// projections describe one structure.

/** JSON-compatible value an extension node may carry as data. */
export type MdDataValue =
	| null
	| boolean
	| number
	| string
	| readonly MdDataValue[]
	| { readonly [key: string]: MdDataValue }

export interface MdPoint {
	readonly line?: number
	readonly column?: number
	readonly offset?: number
}

export interface MdPosition {
	readonly start: MdPoint
	readonly end: MdPoint
}

interface MdNodeBase {
	/** Where the node sits in the source it was parsed from. Present on
	 *  top-level blocks; nested blocks do not carry one. */
	readonly position?: MdPosition
	readonly data?: MdDataValue
}

/** Data a Markdown extension contributes to the document. Renderers learn
 *  which extension produced it from `plugin`/`name`; `source` is the
 *  exact text the node was parsed from when known. */
export interface MdExtension extends MdNodeBase {
	readonly type: 'extension'
	readonly plugin: string
	readonly name: string
	readonly data: MdDataValue
	readonly display: 'inline' | 'block'
	readonly source?: string
}

export interface MdText extends MdNodeBase {
	readonly type: 'text'
	readonly value: string
}

interface MdParent<Type extends 'strong' | 'emphasis' | 'delete'> extends MdNodeBase {
	readonly type: Type
	readonly children: readonly MdInline[]
}

export type MdStrong = MdParent<'strong'>
export type MdEmphasis = MdParent<'emphasis'>
export type MdDelete = MdParent<'delete'>

export interface MdInlineCode extends MdNodeBase {
	readonly type: 'inlineCode'
	readonly value: string
}

/** Opt-in `$…$` math — parsed only with `math: true`. */
export interface MdInlineMath extends MdNodeBase {
	readonly type: 'inlineMath'
	readonly value: string
}

export interface MdLink extends MdNodeBase {
	readonly type: 'link'
	readonly url: string
	readonly children: readonly MdInline[]
}

export interface MdImage extends MdNodeBase {
	readonly type: 'image'
	readonly url: string
	readonly alt: string
}

export interface MdCitation extends MdNodeBase {
	readonly type: 'citation'
	readonly sourceId: string
}

/** A hard line break — two trailing spaces or a backslash before the line ending. */
export interface MdBreak extends MdNodeBase {
	readonly type: 'break'
}

/** One inline run inside a heading/paragraph/list item/table cell. */
export type MdInline =
	| MdText
	| MdStrong
	| MdEmphasis
	| MdDelete
	| MdInlineCode
	| MdInlineMath
	| MdLink
	| MdImage
	| MdCitation
	| MdBreak
	| (MdExtension & { readonly display: 'inline' })

export interface MdHeading extends MdNodeBase {
	readonly type: 'heading'
	readonly depth: 1 | 2 | 3 | 4 | 5 | 6
	readonly children: readonly MdInline[]
}

export interface MdParagraph extends MdNodeBase {
	readonly type: 'paragraph'
	readonly children: readonly MdInline[]
}

export interface MdCode extends MdNodeBase {
	readonly type: 'code'
	readonly lang: string | null
	readonly meta?: string
	readonly value: string
}

/** Opt-in `$$…$$` display math — parsed only with `math: true`. */
export interface MdMath extends MdNodeBase {
	readonly type: 'math'
	readonly value: string
}

export interface MdBlockquote extends MdNodeBase {
	readonly type: 'blockquote'
	readonly children: readonly MdNode[]
}

export interface MdListItem extends MdNodeBase {
	readonly type: 'listItem'
	readonly checked?: boolean
	readonly children: readonly MdNode[]
}

export interface MdList extends MdNodeBase {
	readonly type: 'list'
	readonly ordered: boolean
	readonly start?: number
	readonly spread?: boolean
	/** Ordered-list marker delimiter; absent for bullets. */
	readonly delimiter?: '.' | ')'
	readonly children: readonly MdListItem[]
}

export type MdTableAlignment = 'left' | 'center' | 'right' | null

export interface MdTableCell extends MdNodeBase {
	readonly type: 'tableCell'
	readonly children: readonly MdInline[]
}

export interface MdTableRow extends MdNodeBase {
	readonly type: 'tableRow'
	readonly children: readonly MdTableCell[]
}

export interface MdTable extends MdNodeBase {
	readonly type: 'table'
	readonly align: readonly MdTableAlignment[]
	readonly children: readonly MdTableRow[]
}

export interface MdThematicBreak extends MdNodeBase {
	readonly type: 'thematicBreak'
}

/** One block in a Markdown doc — the recursive, serializable shape that
 *  `xplat routes` bakes for `.md` routes and the runtime parser emits. */
export type MdNode =
	| MdHeading
	| MdParagraph
	| MdCode
	| MdMath
	| MdBlockquote
	| MdList
	| MdTable
	| MdThematicBreak
	| MdImage
	| (MdExtension & { readonly display: 'block' })

/** Kind tag of the serialized markdown document envelope. */
export const MD_DOC_KIND = 'octane-xplat/md'
/** Version of the serialized document envelope. v2 is the recursive
 *  MDAST-aligned tree; the flattened v1 shape is rejected, not adapted. */
export const MD_DOC_VERSION = 2

/** A parsed Markdown document — the versioned AST (`kind: 'octane-xplat/md'`,
 *  `v: 2`) produced by `parseMdDoc`/`createMarkdownStreamParser` and consumed
 *  by `Markdown`'s `data` prop. Canonical import: `@octane-xplat/ui/markdown`.
 *
 * @see MdNode, MdInline, MarkdownDataProps.
 */
export interface MdDoc {
	/** Document kind tag for the serialized markdown format. */
	kind: 'octane-xplat/md'
	/** Format version — always 2. */
	v: 2
	/** Top-level markdown blocks. */
	children: readonly MdNode[]
}

/** Options for the markdown parser entry points. */
export interface MdParseOptions {
	/** Set of citation source ids — `[id]` / `【id】` markers in this set
	 *  become citation nodes instead of plain text / links. */
	readonly sourceIds?: ReadonlySet<string>
	/**
	 * Autolink mode. When set to `'gfm'`, the parser turns bare
	 * `https?://…` / `www.…` URLs, `<URL>` / `<email>` angle-bracket
	 * forms, and `user@host` emails into `link` inline nodes (per the
	 * GitHub Flavored Markdown autolink-literal extension plus the
	 * CommonMark §6.5 autolink form). Disabled by default.
	 *
	 * Two intentional deviations from the strict GFM spec for v1, inherited
	 * from the reference: trailing `&entity;` is not peeled off the URL,
	 * and an invalid TLD suffix is not rejected (any plausible TLD shape
	 * is accepted).
	 */
	readonly autolink?: 'gfm'
	/** Parse `$…$` / `$$…$$` into math node types. Off by default. */
	readonly math?: boolean
}

/** Wrap top-level blocks in the versioned document envelope. */
export function mdDoc(children: readonly MdNode[]): MdDoc {
	return { kind: MD_DOC_KIND, v: MD_DOC_VERSION, children }
}

/** Shallow envelope check — kind tag and supported version. For full node
 *  validation use {@link assertMdDoc}. */
export function isMdDoc(value: unknown): value is MdDoc {
	return (
		typeof value === 'object' &&
		value !== null &&
		(value as MdDoc).kind === MD_DOC_KIND &&
		(value as MdDoc).v === MD_DOC_VERSION &&
		Array.isArray((value as MdDoc).children)
	)
}

function fail(path: string, problem: string): never {
	throw new TypeError(`invalid MdDoc: ${path} ${problem}`)
}

function isDataValue(value: unknown): value is MdDataValue {
	if (value === null || typeof value !== 'object') {
		return value === null || ['boolean', 'number', 'string'].includes(typeof value)
	}
	if (Array.isArray(value)) {
		return value.every(isDataValue)
	}
	return Object.values(value as Record<string, unknown>).every(isDataValue)
}

function checkBase(node: object, path: string): void {
	const n = node as MdNodeBase
	if (n.position !== undefined) {
		const pos = n.position
		for (const side of ['start', 'end'] as const) {
			const point = pos?.[side]
			if (point == null || typeof point !== 'object') {
				fail(path, `position.${side} must be an object`)
			}
			for (const field of ['line', 'column', 'offset'] as const) {
				if (point[field] !== undefined && typeof point[field] !== 'number') {
					fail(path, `position.${side}.${field} must be a number`)
				}
			}
		}
	}
	if (n.data !== undefined && !isDataValue(n.data)) {
		fail(path, 'data must be JSON-compatible')
	}
}

function checkInline(node: unknown, path: string): void {
	if (typeof node !== 'object' || node === null) {
		fail(path, 'inline node must be an object')
	}
	const n = node as MdInline
	checkBase(n, path)
	const kids = (n as MdStrong | MdLink).children
	switch (n.type) {
		case 'text':
		case 'inlineCode':
		case 'inlineMath':
			if (typeof n.value !== 'string') fail(path, `${n.type}.value must be a string`)
			return
		case 'strong':
		case 'emphasis':
		case 'delete':
			if (!Array.isArray(kids)) fail(path, `${n.type}.children must be an array`)
			kids.forEach((k: MdInline, i: number) => checkInline(k, `${path}/${n.type}[${i}]`))
			return
		case 'link':
			if (typeof n.url !== 'string') fail(path, 'link.url must be a string')
			if (!Array.isArray(kids)) fail(path, 'link.children must be an array')
			kids.forEach((k: MdInline, i: number) => checkInline(k, `${path}/link[${i}]`))
			return
		case 'image':
			if (typeof n.url !== 'string') fail(path, 'image.url must be a string')
			if (typeof n.alt !== 'string') fail(path, 'image.alt must be a string')
			return
		case 'citation':
			if (typeof n.sourceId !== 'string') fail(path, 'citation.sourceId must be a string')
			return
		case 'break':
			return
		case 'extension':
			checkExtension(node as MdExtension, path, 'inline')
			return
		default:
			fail(path, `unknown inline node type ${JSON.stringify((n as MdInline).type)}`)
	}
}

function checkExtension(node: MdExtension, path: string, display: 'inline' | 'block'): void {
	if (typeof node.plugin !== 'string' || node.plugin === '') {
		fail(path, 'extension.plugin must be a non-empty string')
	}
	if (typeof node.name !== 'string' || node.name === '') {
		fail(path, 'extension.name must be a non-empty string')
	}
	if (node.display !== display) {
		fail(path, `extension in ${display} position must have display '${display}'`)
	}
	if (!isDataValue(node.data)) {
		fail(path, 'extension.data must be JSON-compatible')
	}
	if (node.source !== undefined && typeof node.source !== 'string') {
		fail(path, 'extension.source must be a string')
	}
}

function checkBlock(node: unknown, path: string): void {
	if (typeof node !== 'object' || node === null) {
		fail(path, 'block node must be an object')
	}
	const n = node as MdNode
	checkBase(n, path)
	switch (n.type) {
		case 'heading':
			if (typeof n.depth !== 'number' || n.depth < 1 || n.depth > 6) {
				fail(path, 'heading.depth must be 1..6')
			}
			if (!Array.isArray(n.children)) fail(path, 'heading.children must be an array')
			n.children.forEach((k: MdInline, i: number) => checkInline(k, `${path}/heading[${i}]`))
			return
		case 'paragraph':
			if (!Array.isArray(n.children)) fail(path, 'paragraph.children must be an array')
			n.children.forEach((k: MdInline, i: number) => checkInline(k, `${path}/paragraph[${i}]`))
			return
		case 'code':
			if (typeof n.value !== 'string') fail(path, 'code.value must be a string')
			if (n.lang !== null && typeof n.lang !== 'string') {
				fail(path, 'code.lang must be a string or null')
			}
			if (n.meta !== undefined && typeof n.meta !== 'string') {
				fail(path, 'code.meta must be a string')
			}
			return
		case 'math':
			if (typeof n.value !== 'string') fail(path, 'math.value must be a string')
			return
		case 'blockquote':
			if (!Array.isArray(n.children)) fail(path, 'blockquote.children must be an array')
			n.children.forEach((k: MdNode, i: number) => checkBlock(k, `${path}/blockquote[${i}]`))
			return
		case 'list': {
			if (typeof n.ordered !== 'boolean') fail(path, 'list.ordered must be a boolean')
			if (n.start !== undefined && typeof n.start !== 'number') {
				fail(path, 'list.start must be a number')
			}
			if (n.spread !== undefined && typeof n.spread !== 'boolean') {
				fail(path, 'list.spread must be a boolean')
			}
			if (n.delimiter !== undefined && n.delimiter !== '.' && n.delimiter !== ')') {
				fail(path, "list.delimiter must be '.' or ')'")
			}
			if (!Array.isArray(n.children)) fail(path, 'list.children must be an array')
			n.children.forEach((item: MdListItem, i: number) => {
				if (item.type !== 'listItem') {
					fail(`${path}/list[${i}]`, 'list children must be listItem nodes')
				}
				checkBase(item, `${path}/list[${i}]`)
				if (item.checked !== undefined && typeof item.checked !== 'boolean') {
					fail(`${path}/list[${i}]`, 'listItem.checked must be a boolean')
				}
				if (!Array.isArray(item.children)) {
					fail(`${path}/list[${i}]`, 'listItem.children must be an array')
				}
				item.children.forEach((k: MdNode, j: number) => checkBlock(k, `${path}/list[${i}][${j}]`))
			})
			return
		}
		case 'table': {
			if (!Array.isArray(n.align)) fail(path, 'table.align must be an array')
			n.align.forEach((a, i) => {
				if (a !== null && a !== 'left' && a !== 'center' && a !== 'right') {
					fail(`${path}.align[${i}]`, 'must be left|center|right|null')
				}
			})
			if (!Array.isArray(n.children)) fail(path, 'table.children must be an array')
			n.children.forEach((row: MdTableRow, i: number) => {
				if (row.type !== 'tableRow') {
					fail(`${path}/table[${i}]`, 'table children must be tableRow nodes')
				}
				if (!Array.isArray(row.children)) {
					fail(`${path}/table[${i}]`, 'tableRow.children must be an array')
				}
				row.children.forEach((cell: MdTableCell, j: number) => {
					if (cell.type !== 'tableCell') {
						fail(`${path}/table[${i}][${j}]`, 'tableRow children must be tableCell nodes')
					}
					if (!Array.isArray(cell.children)) {
						fail(`${path}/table[${i}][${j}]`, 'tableCell.children must be an array')
					}
					cell.children.forEach((k: MdInline, c: number) =>
						checkInline(k, `${path}/table[${i}][${j}][${c}]`),
					)
				})
			})
			return
		}
		case 'thematicBreak':
			return
		case 'image':
			if (typeof n.url !== 'string') fail(path, 'image.url must be a string')
			if (typeof n.alt !== 'string') fail(path, 'image.alt must be a string')
			return
		case 'extension':
			checkExtension(node as MdExtension, path, 'block')
			return
		default:
			fail(path, `unknown block node type ${JSON.stringify((n as MdNode).type)}`)
	}
}

/**
 * Validate an externally-supplied document: correct kind, supported version,
 * and recursively well-formed nodes. Throws `TypeError` naming the failing
 * path. Old (v1) and foreign documents fail predictably instead of
 * misrendering.
 */
export function assertMdDoc(value: unknown): asserts value is MdDoc {
	if (typeof value !== 'object' || value === null) {
		fail('$', 'document must be an object')
	}
	const doc = value as MdDoc
	if (doc.kind !== MD_DOC_KIND) {
		fail('$', `kind must be ${JSON.stringify(MD_DOC_KIND)}`)
	}
	if (doc.v !== MD_DOC_VERSION) {
		fail(
			'$',
			`unsupported version ${JSON.stringify((doc as { v?: unknown }).v)} — expected ${MD_DOC_VERSION}`,
		)
	}
	if (!Array.isArray(doc.children)) {
		fail('$', 'children must be an array')
	}
	doc.children.forEach((node: MdNode, i: number) => checkBlock(node, `$/children[${i}]`))
}

// ---------------------------------------------------------------------------
// Text projection
// ---------------------------------------------------------------------------

/**
 * Visible text of an inline run — the same projection Outline and heading
 * labels use (`markdownAstText` upstream). Images project their alt text;
 * citations and breaks contribute nothing; extension nodes defer to
 * `extensionText` (their `source` text by default).
 */
export function mdInlineText(
	nodes: readonly MdInline[] | undefined,
	extensionText: (node: MdExtension & { readonly display: 'inline' }) => string = (node) =>
		node.source ?? '',
): string {
	let text = ''
	for (const node of nodes ?? []) {
		switch (node.type) {
			case 'text':
			case 'inlineCode':
			case 'inlineMath':
				text += node.value
				break
			case 'strong':
			case 'emphasis':
			case 'delete':
			case 'link':
				text += mdInlineText(node.children, extensionText)
				break
			case 'image':
				text += node.alt
				break
			case 'citation':
			case 'break':
				break
			case 'extension':
				text += extensionText(node)
				break
			default:
				node satisfies never
		}
	}
	return text
}

/** Rendered length of an inline run — `mdInlineText` without allocating. */
export function mdInlineLen(nodes: readonly MdInline[] | undefined): number {
	let n = 0
	for (const node of nodes ?? []) {
		switch (node.type) {
			case 'text':
			case 'inlineCode':
			case 'inlineMath':
				n += node.value.length
				break
			case 'strong':
			case 'emphasis':
			case 'delete':
			case 'link':
				n += mdInlineLen(node.children)
				break
			case 'image':
				n += node.alt.length
				break
			case 'extension':
				n += (node.source ?? '').length
				break
			default:
				break
		}
	}
	return n
}

/** Visible text of one block — recursive text projection used by text-length
 *  accounting and outline labels. */
export function mdNodeText(node: MdNode): string {
	switch (node.type) {
		case 'heading':
		case 'paragraph':
			return mdInlineText(node.children)
		case 'code':
		case 'math':
			return node.value
		case 'blockquote':
			return node.children.map(mdNodeText).join('')
		case 'list':
			return node.children.map((item) => item.children.map(mdNodeText).join('')).join('')
		case 'table':
			return node.children
				.map((row) => row.children.map((cell) => mdInlineText(cell.children)).join(''))
				.join('')
		case 'image':
			return node.alt
		case 'extension':
			return node.source ?? ''
		default:
			return ''
	}
}
