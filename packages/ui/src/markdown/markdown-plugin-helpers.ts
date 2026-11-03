// Markdown plugin helpers — the first-party transform factories and plugins
// built on the extension protocol. Ported from Meta Platforms' Astryx
// Markdown helpers, MIT license (github.com/facebook/astryx —
// packages/core/src/Markdown/plugins/{textTransform,semanticFence,
// sourceDecoration,frontmatter,softBreaks,sourceLines,headingLinks}.ts at
// tag v0.7.4, revision 704757fd827c6fa00a71af80b06d5da99d155e45).

import { mdInlineText } from './markdown-ast.ts'
import { sanitizeUrl } from '../routing/safe-url'
import {
	adoptMarkdownHelperNode,
	adoptMarkdownHelperNodes,
	createMarkdownPlugin,
	createMarkdownSourceLinesEntry,
	freezeMarkdownPluginData,
	getMarkdownHelperOwnership,
	getMarkdownPluginDefinition,
	isMarkdownPluginData,
	markdownExtensionText,
	markMarkdownTransformClaim,
	markMarkdownTransformTrusted,
	type MarkdownExtensionNode,
	type MarkdownHelperOwnership,
	type MarkdownPluginData,
	type MarkdownPluginEntry,
	type MarkdownTransform,
	type MarkdownTransformContext,
	type PreparedMarkdownPlugins,
} from './markdown-plugins.ts'

import type {
	MdCode,
	MdDataValue,
	MdDoc,
	MdExtension,
	MdHeading,
	MdInline,
	MdListItem,
	MdNode,
	MdPosition,
	MdTableCell,
	MdTableRow,
} from './markdown-ast.ts'

import type { MdNodeBase } from './markdown-ast.ts'

type AnyExtension = MarkdownExtensionNode
type Phrasing = Exclude<MdInline, MdExtension> | (AnyExtension & { readonly display: 'inline' })
type Block = Exclude<MdNode, MdExtension> | (AnyExtension & { readonly display: 'block' })

// ---------------------------------------------------------------------------
// createMarkdownTextTransform (plugins/textTransform.ts)
// ---------------------------------------------------------------------------

/**
 * Ownership for a transform invoked outside Core's pipeline. It owns no
 * plugin name and no renderer, so a callback's extension node is rejected
 * while ordinary phrasing still works.
 */
const UNOWNED: MarkdownHelperOwnership = Object.freeze({
	pluginName: '\0unowned',
	hasRenderer: () => false,
	sourceUnchanged: false,
})

export interface MarkdownTextTransformContext {
	readonly parentType: 'heading' | 'paragraph' | 'strong' | 'emphasis' | 'delete' | 'tableCell'
}

export interface MarkdownTextTransformOptions<Node extends MarkdownExtensionNode = never> {
	/** Global expression matched against eligible built-in prose only. */
	readonly pattern: RegExp
	/**
	 * Literal substrings such that source containing an eligible match contains
	 * at least one. Core uses them to skip the transform without walking the AST
	 * when none are present. Omit this optimization when no conservative literal
	 * exists; the helper will inspect eligible prose on every run. This fast path
	 * is also disabled for case-insensitive patterns so JavaScript case folding
	 * remains exact.
	 */
	readonly requiredSubstrings?: readonly [string, ...string[]]
	/** Optionally decline or extend a regex claim. */
	readonly getEndIndex?: (text: string, match: RegExpExecArray) => number | false
	replace(
		match: RegExpExecArray,
		context: MarkdownTextTransformContext,
	): Phrasing | ReadonlyArray<Phrasing>
}

/**
 * Replacement nodes already placed in a document by this helper.
 *
 * A callback that builds a node per match hands over a fresh object, and
 * that object can go straight into the tree — copying it would allocate a
 * second one for nothing, and it is validated and frozen on the way in
 * either way. A callback that returns the SAME object for several matches
 * is the case that needs a copy: one object cannot occupy two positions in
 * a tree, and a node already frozen into an earlier position must not be
 * reused for a later one. Weak, so remembering a node never keeps it alive.
 */
const adoptedReplacements = new WeakSet<object>()

/** One reusable expression per transform invocation. */
interface Scanner {
	readonly pattern: RegExp
	busy: boolean
}

/**
 * Copies a caller's node away from them. The cycle-tracking map is allocated
 * only once a nested object actually appears: the overwhelmingly common
 * replacement is a flat node of primitives, and this runs once per match.
 */
function cloneReplacement<T>(value: T, seen?: Map<object, unknown>): T {
	if (value == null || typeof value !== 'object') {
		return value
	}
	const cached = seen?.get(value)
	if (cached != null) {
		return cached as T
	}
	if (Array.isArray(value)) {
		const clone: unknown[] = []
		seen ??= new Map<object, unknown>()
		seen.set(value, clone)
		for (const item of value) {
			clone.push(cloneReplacement(item, seen))
		}

		return clone as T
	}
	if (Object.getPrototypeOf(value) !== Object.prototype) {
		return value
	}
	const clone: Record<string, unknown> = {}
	let tracked = seen
	for (const key in value) {
		const nested = (value as Record<string, unknown>)[key]
		if (nested != null && typeof nested === 'object') {
			if (tracked === undefined) {
				tracked = new Map<object, unknown>()
				tracked.set(value, clone)
			}

			clone[key] = cloneReplacement(nested, tracked)
		} else {
			clone[key] = nested
		}
	}
	return clone as T
}

function advanceStringIndex(value: string, index: number, unicode: boolean): number {
	if (!unicode || index >= value.length) {
		return index + 1
	}
	const first = value.charCodeAt(index)
	if (first < 0xd800 || first > 0xdbff || index + 1 >= value.length) {
		return index + 1
	}
	const second = value.charCodeAt(index + 1)
	return second >= 0xdc00 && second <= 0xdfff ? index + 2 : index + 1
}

function replaceTextNode(
	value: string,
	options: MarkdownTextTransformOptions<MarkdownExtensionNode>,
	parentType: MarkdownTextTransformContext['parentType'],
	ownership: MarkdownHelperOwnership,
	scanner: Scanner,
): ReadonlyArray<Phrasing> | null {
	// The conservative substring hint decides per text node, not just per
	// document: source without one cannot contain an eligible match, so most
	// prose is skipped before any scanning happens.
	// Disabled for case-insensitive patterns, exactly as the document-level
	// claim is, so JavaScript case folding stays the only authority.
	const required = options.pattern.ignoreCase ? undefined : options.requiredSubstrings
	if (required != null && !required.some((hint) => value.includes(hint))) {
		return null
	}
	// One expression per transform invocation rather than one per text node.
	// A `replace` callback that re-enters this helper gets its own, so a
	// nested scan can never disturb the outer one's `lastIndex`.
	const pattern = scanner.busy
		? new RegExp(options.pattern.source, options.pattern.flags)
		: scanner.pattern
	const reentrant = pattern !== scanner.pattern
	if (!reentrant) {
		scanner.busy = true
	}
	pattern.lastIndex = 0
	const output: Phrasing[] = []
	let cursor = 0
	let changed = false
	let match: RegExpExecArray | null

	while ((match = pattern.exec(value)) != null) {
		const start = match.index
		const defaultEnd = start + match[0].length
		const resolvedEnd = options.getEndIndex?.(value, match) ?? defaultEnd
		if (resolvedEnd === false) {
			if (match[0].length === 0) {
				pattern.lastIndex = advanceStringIndex(
					value,
					pattern.lastIndex,
					pattern.unicode || pattern.flags.includes('v'),
				)
			}

			continue
		}

		if (
			!Number.isInteger(resolvedEnd) ||
			resolvedEnd < defaultEnd ||
			resolvedEnd < start ||
			resolvedEnd > value.length
		) {
			throw new TypeError('Markdown text transform returned an invalid end index')
		}

		if (start < cursor) {
			continue
		}

		if (start > cursor) {
			output.push({ type: 'text', value: value.slice(cursor, start) })
		}

		const replacement = options.replace(match, { parentType })
		// The callback's nodes are the only untrusted structure this helper can
		// introduce. Each one is checked here under the same rules Core applies
		// to newly-introduced nodes — representable data, no authored
		// provenance, no foreign extension ownership, no cycles — and frozen,
		// so the tree this transform returns needs no further checking. A node
		// the callback has handed over before is copied first; a fresh one is
		// adopted as it stands.
		if (Array.isArray(replacement)) {
			const adopted: Phrasing[] = []
			for (const replacementNode of replacement) {
				adopted.push(
					adoptedReplacements.has(replacementNode)
						? cloneReplacement(replacementNode)
						: replacementNode,
				)
			}

			adoptMarkdownHelperNodes(adopted, ownership)
			for (const node of adopted) {
				adoptedReplacements.add(node)
			}

			output.push(...adopted)
		} else {
			const single = replacement as Phrasing
			const adopted = adoptedReplacements.has(single) ? cloneReplacement(single) : single
			adoptMarkdownHelperNode(adopted, ownership)
			adoptedReplacements.add(adopted)
			output.push(adopted)
		}

		cursor = resolvedEnd
		pattern.lastIndex =
			resolvedEnd === start
				? advanceStringIndex(
						value,
						pattern.lastIndex,
						pattern.unicode || pattern.flags.includes('v'),
					)
				: Math.max(pattern.lastIndex, resolvedEnd)

		changed = true
	}

	if (!reentrant) {
		scanner.busy = false
	}
	if (!changed) {
		return null
	}
	if (cursor < value.length) {
		output.push({ type: 'text', value: value.slice(cursor) })
	}
	return output
}

function transformPhrasing(
	children: ReadonlyArray<MdInline>,
	options: MarkdownTextTransformOptions<MarkdownExtensionNode>,
	parentType: MarkdownTextTransformContext['parentType'],
	ownership: MarkdownHelperOwnership,
	scanner: Scanner,
): ReadonlyArray<MdInline> {
	// Lazy rebuild: unchanged phrasing is returned as-is, so prose with no
	// match costs one walk and no allocation. Only the first change copies.
	let next: MdInline[] | undefined
	for (let index = 0; index < children.length; index++) {
		const node = children[index]
		if (node.type === 'text') {
			const replaced = replaceTextNode(node.value, options, parentType, ownership, scanner)
			if (replaced == null) {
				next?.push(node)
				continue
			}

			next ??= children.slice(0, index)
			for (const replacement of replaced) {
				next.push(replacement)
			}

			continue
		}

		if (node.type === 'strong' || node.type === 'emphasis' || node.type === 'delete') {
			const nested = transformPhrasing(node.children, options, node.type, ownership, scanner)
			if (nested === node.children) {
				next?.push(node)
				continue
			}

			next ??= children.slice(0, index)
			next.push({ ...node, children: nested })
			continue
		}

		// Links, images, code, math, citations, breaks, and accepted extension
		// syntax are protected contexts owned by their existing semantics.
		next?.push(node)
	}
	return next ?? children
}

function blockMayContainRequiredSource(
	block: MdNode,
	source: string | undefined,
	options: MarkdownTextTransformOptions<MarkdownExtensionNode>,
): boolean {
	const required = options.requiredSubstrings
	if (source === undefined || required === undefined) {
		return true
	}
	const start = block.position?.start.offset
	const end = block.position?.end.offset
	if (typeof start !== 'number' || typeof end !== 'number') {
		return true
	}
	for (const hint of required) {
		const match = source.indexOf(hint, start)
		if (match >= 0 && match < end) {
			return true
		}
	}
	return false
}

function transformBlocks(
	blocks: ReadonlyArray<MdNode>,
	options: MarkdownTextTransformOptions<MarkdownExtensionNode>,
	ownership: MarkdownHelperOwnership,
	scanner: Scanner,
	source: string | undefined,
): ReadonlyArray<MdNode> {
	// Lazy rebuild, matching transformPhrasing: a block list with no match is
	// returned unchanged and allocates nothing.
	let next: MdNode[] | undefined
	for (let index = 0; index < blocks.length; index++) {
		const block = blocks[index]
		if (!blockMayContainRequiredSource(block, source, options)) {
			next?.push(block)
			continue
		}

		let replacement: MdNode
		switch (block.type) {
			case 'heading':
			case 'paragraph': {
				const children = transformPhrasing(block.children, options, block.type, ownership, scanner)
				replacement = children === block.children ? block : { ...block, children }
				break
			}
			case 'blockquote': {
				const children = transformBlocks(block.children, options, ownership, scanner, source)
				replacement = children === block.children ? block : { ...block, children }
				break
			}
			case 'list': {
				let items: MdListItem[] | undefined
				for (let itemIndex = 0; itemIndex < block.children.length; itemIndex++) {
					const item = block.children[itemIndex]
					const itemChildren = transformBlocks(item.children, options, ownership, scanner, source)
					if (itemChildren === item.children) {
						items?.push(item)
						continue
					}

					items ??= block.children.slice(0, itemIndex)
					items.push({ ...item, children: itemChildren })
				}

				replacement = items == null ? block : { ...block, children: items }
				break
			}
			case 'table': {
				let rows: MdTableRow[] | undefined
				for (let rowIndex = 0; rowIndex < block.children.length; rowIndex++) {
					const row = block.children[rowIndex]
					let cells: MdTableCell[] | undefined
					for (let cellIndex = 0; cellIndex < row.children.length; cellIndex++) {
						const cell = row.children[cellIndex]
						const cellChildren = transformPhrasing(
							cell.children,
							options,
							'tableCell',
							ownership,
							scanner,
						)

						if (cellChildren === cell.children) {
							cells?.push(cell)
							continue
						}

						cells ??= row.children.slice(0, cellIndex)
						cells.push({ ...cell, children: cellChildren })
					}

					if (cells == null) {
						rows?.push(row)
						continue
					}

					rows ??= block.children.slice(0, rowIndex)
					rows.push({ ...row, children: cells })
				}

				replacement = rows == null ? block : { ...block, children: rows }
				break
			}
			case 'code':
			case 'math':
			case 'image':
			case 'thematicBreak':
			case 'extension':
				replacement = block
				break
		}

		if (next === undefined && replacement !== block) {
			next = blocks.slice(0, index)
		}

		next?.push(replacement)
	}
	return next ?? blocks
}

export function createMarkdownTextTransform(
	options: MarkdownTextTransformOptions<never>,
): MarkdownTransform<never>

export function createMarkdownTextTransform<Node extends MarkdownExtensionNode>(
	options: MarkdownTextTransformOptions<Node>,
): MarkdownTransform<Node>

export function createMarkdownTextTransform(
	options: MarkdownTextTransformOptions<MarkdownExtensionNode>,
): MarkdownTransform<MarkdownExtensionNode> {
	if (!options.pattern.global) {
		throw new TypeError('Markdown text transform patterns must use the global flag')
	}
	if (
		options.requiredSubstrings != null &&
		(!Array.isArray(options.requiredSubstrings) ||
			options.requiredSubstrings.length === 0 ||
			options.requiredSubstrings.some((value) => typeof value !== 'string' || value === ''))
	) {
		throw new TypeError('Markdown text transform requiredSubstrings must be non-empty strings')
	}
	const requiredSubstrings =
		options.requiredSubstrings == null
			? undefined
			: (Object.freeze([...options.requiredSubstrings]) as readonly [string, ...string[]])
	const normalizedOptions: MarkdownTextTransformOptions<MarkdownExtensionNode> = Object.freeze({
		pattern: new RegExp(options.pattern.source, options.pattern.flags),
		requiredSubstrings,
		getEndIndex: options.getEndIndex,
		replace: options.replace,
	})
	const transform: MarkdownTransform<MarkdownExtensionNode> = (root, context) => {
		const ownership = getMarkdownHelperOwnership(context) ?? UNOWNED
		const children = transformBlocks(
			root.children,
			normalizedOptions,
			ownership,
			{
				pattern: new RegExp(normalizedOptions.pattern.source, normalizedOptions.pattern.flags),
				busy: false,
			},
			ownership.sourceUnchanged &&
				requiredSubstrings != null &&
				!normalizedOptions.pattern.ignoreCase
				? context.source
				: undefined,
		)
		return children === root.children ? root : { ...root, children }
	}
	// Every node this helper returns is either one Core already validated or
	// one `replaceTextNode` just validated against the same rules, so Core may
	// run it on the trusted path.
	const trusted = markMarkdownTransformTrusted(
		transform as MarkdownTransform<never>,
	) as MarkdownTransform<MarkdownExtensionNode>
	if (requiredSubstrings == null || options.pattern.ignoreCase) {
		return trusted
	}
	return markMarkdownTransformClaim(trusted, (source) =>
		requiredSubstrings.some((required) => source.includes(required)),
	)
}

// ---------------------------------------------------------------------------
// createMarkdownFenceTransform (plugins/semanticFence.ts)
// ---------------------------------------------------------------------------

export interface MarkdownFenceContext<Language extends string> {
	readonly code: string
	readonly language: Language
	readonly meta?: string
}

export type MarkdownFenceNode<Node extends MarkdownExtensionNode> = Node & {
	readonly type: 'extension'
	readonly display: 'block'
	readonly position?: never
	readonly source?: never
}

export interface MarkdownFenceTransformOptions<
	Languages extends readonly [string, ...string[]],
	Node extends MarkdownExtensionNode<string, string, MarkdownPluginData, 'block'>,
> {
	/** Exact, case-sensitive fenced-code language identifiers this helper owns. */
	readonly languages: Languages
	/**
	 * Creates typed semantic data for an eligible fence. Return null or undefined
	 * to retain Markdown's ordinary CodeBlock rendering.
	 */
	readonly createNode: (
		context: MarkdownFenceContext<Languages[number]>,
	) => MarkdownFenceNode<Node> | null | undefined
}

interface MarkdownFenceProposal {
	readonly node: MarkdownExtensionNode<string, string, MarkdownPluginData, 'block'>
}

const markdownFenceProposal = Symbol('MarkdownFenceProposal')

type FenceCode = MdCode & {
	readonly [markdownFenceProposal]?: MarkdownFenceProposal
}

/** @internal Returns the first transform-owned proposal attached to a code node. */
export function getMarkdownFenceProposal(node: MdCode): MarkdownFenceProposal | undefined {
	return (node as FenceCode)[markdownFenceProposal]
}

function cloneNestedPluginData(
	value: unknown,
	parent: object,
	ancestors: ReadonlySet<object> | undefined,
): MarkdownPluginData {
	if (value == null || typeof value !== 'object') {
		return clonePluginData(value, ancestors)
	}
	const nestedAncestors = new Set(ancestors)
	nestedAncestors.add(parent)
	return clonePluginData(value, nestedAncestors)
}

function clonePluginData(value: unknown, ancestors?: ReadonlySet<object>): MarkdownPluginData {
	if (value == null || typeof value === 'boolean' || typeof value === 'string') {
		return value as MarkdownPluginData
	}
	if (typeof value === 'number') {
		if (!Number.isFinite(value)) {
			throw new TypeError('invalid plugin data')
		}

		return value
	}
	if (
		typeof value !== 'object' ||
		ancestors?.has(value) === true ||
		(!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype)
	) {
		throw new TypeError('invalid plugin data')
	}
	let clone: MarkdownPluginData
	if (Array.isArray(value)) {
		const items = new Array<MarkdownPluginData>(value.length)
		for (let index = 0; index < value.length; index++) {
			if (index in value) {
				items[index] = cloneNestedPluginData(value[index], value, ancestors)
			}
		}

		clone = Object.freeze(items)
	} else {
		const record: Record<string, MarkdownPluginData> = {}
		for (const key in value) {
			const nested = cloneNestedPluginData(
				(value as Record<string, unknown>)[key],
				value,
				ancestors,
			)

			if (key === '__proto__') {
				Object.defineProperty(record, key, {
					configurable: true,
					enumerable: true,
					value: nested,
					writable: true,
				})
			} else {
				record[key] = nested
			}
		}

		clone = Object.freeze(record)
	}
	return clone
}

function createProposal(
	node: MarkdownFenceNode<MarkdownExtensionNode<string, string, MarkdownPluginData, 'block'>>,
	pluginName: string,
	hasRenderer: (nodeName: string) => boolean,
	sourceLines: MdPosition | undefined,
): MarkdownFenceProposal {
	if (
		node == null ||
		typeof node !== 'object' ||
		node.type !== 'extension' ||
		node.plugin !== pluginName ||
		typeof node.name !== 'string' ||
		node.name.trim() === '' ||
		// Every extension node must have a renderer and a text projection
		// (FR14). Checking it here is what lets Core run this helper on its
		// trusted path: the node is fully validated before it is inserted.
		!hasRenderer(node.name) ||
		node.display !== 'block' ||
		'source' in node ||
		'position' in node
	) {
		throw new TypeError(
			'Markdown fence createNode must return an owned block extension node with finite data and a registered renderer',
		)
	}

	let data: MarkdownPluginData
	try {
		data = clonePluginData(node.data)
	} catch {
		throw new TypeError(
			'Markdown fence createNode must return an owned block extension node with finite data and a registered renderer',
		)
	}
	return Object.freeze({
		node: Object.freeze({
			type: 'extension' as const,
			plugin: node.plugin,
			name: node.name,
			display: 'block' as const,
			data,
			// The fence's Core-authored source lines, recorded only while the
			// source-lines plugin is installed (module:Markdown/sourceLines FR5).
			...(sourceLines == null ? null : { position: sourceLines }),
		}),
	})
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
	return (
		value != null &&
		typeof value === 'object' &&
		'then' in value &&
		typeof value.then === 'function'
	)
}

function consumeInvalidAsyncNode(
	value: PromiseLike<unknown>,
	report: (message: string) => void,
): void {
	void Promise.resolve(value).then(
		() => report('Markdown fence createNode returned a Promise'),
		() => report('Markdown fence createNode Promise rejected'),
	)
}

function annotateCode(
	node: MdCode,
	languages: ReadonlySet<string>,
	pluginName: string,
	hasRenderer: (nodeName: string) => boolean,
	createNode: (
		context: MarkdownFenceContext<string>,
	) =>
		| MarkdownFenceNode<MarkdownExtensionNode<string, string, MarkdownPluginData, 'block'>>
		| null
		| undefined,
	report: (message: string) => void,
): MdCode {
	if (node.lang == null || !languages.has(node.lang) || getMarkdownFenceProposal(node) != null) {
		return node
	}

	const proposalNode = createNode(
		Object.freeze({
			code: node.value,
			language: node.lang,
			...(node.meta == null ? {} : { meta: node.meta }),
		}),
	)
	if (isPromiseLike(proposalNode)) {
		consumeInvalidAsyncNode(proposalNode, report)
		throw new TypeError('Markdown fence createNode must be synchronous')
	}
	if (proposalNode == null) {
		return node
	}

	const annotated = { ...node }
	Object.defineProperty(annotated, markdownFenceProposal, {
		configurable: false,
		enumerable: true,
		value: createProposal(
			proposalNode,
			pluginName,
			hasRenderer,
			node.position?.start.line == null ? undefined : node.position,
		),
		writable: false,
	})
	return annotated
}

function fenceTransformBlocks(
	blocks: ReadonlyArray<MdNode>,
	languages: ReadonlySet<string>,
	pluginName: string,
	hasRenderer: (nodeName: string) => boolean,
	createNode: (
		context: MarkdownFenceContext<string>,
	) =>
		| MarkdownFenceNode<MarkdownExtensionNode<string, string, MarkdownPluginData, 'block'>>
		| null
		| undefined,
	report: (message: string) => void,
): ReadonlyArray<MdNode> {
	let next: MdNode[] | undefined
	for (let index = 0; index < blocks.length; index++) {
		const block = blocks[index]
		let replacement: MdNode
		switch (block.type) {
			case 'code':
				replacement = annotateCode(block, languages, pluginName, hasRenderer, createNode, report)
				break
			case 'blockquote': {
				const children = fenceTransformBlocks(
					block.children,
					languages,
					pluginName,
					hasRenderer,
					createNode,
					report,
				)

				replacement = children === block.children ? block : { ...block, children }
				break
			}
			case 'list': {
				let items: MdListItem[] | undefined
				for (let itemIndex = 0; itemIndex < block.children.length; itemIndex++) {
					const item = block.children[itemIndex]
					const itemChildren = fenceTransformBlocks(
						item.children,
						languages,
						pluginName,
						hasRenderer,
						createNode,
						report,
					)

					if (itemChildren === item.children) {
						items?.push(item)
						continue
					}

					items ??= block.children.slice(0, itemIndex)
					items.push({ ...item, children: itemChildren })
				}

				replacement = items == null ? block : { ...block, children: items }
				break
			}
			case 'heading':
			case 'paragraph':
			case 'math':
			case 'table':
			case 'thematicBreak':
			case 'image':
			case 'extension':
				replacement = block
				break
		}

		if (next === undefined && replacement !== block) {
			next = blocks.slice(0, index)
		}

		next?.push(replacement)
	}
	return next ?? blocks
}

export function createMarkdownFenceTransform<
	const Languages extends readonly [string, ...string[]],
	const Node extends MarkdownExtensionNode<string, string, MarkdownPluginData, 'block'>,
>(options: MarkdownFenceTransformOptions<Languages, Node>): MarkdownTransform<Node> {
	if (
		!Array.isArray(options.languages) ||
		options.languages.length === 0 ||
		options.languages.some((language) => typeof language !== 'string' || language.trim() === '')
	) {
		throw new TypeError('Markdown fence languages must be non-empty strings')
	}
	if (new Set(options.languages).size !== options.languages.length) {
		throw new TypeError('Markdown fence languages must be unique')
	}
	if (typeof options.createNode !== 'function') {
		throw new TypeError('Markdown fence createNode must be a function')
	}

	const declaredLanguages = Object.freeze([...options.languages])
	const languages = new Set<string>(declaredLanguages)
	const sourceNeedles = Object.freeze(
		declaredLanguages.flatMap((language) => [`\`\`\`${language}`, `~~~${language}`]),
	)
	const createNode = options.createNode as (
		context: MarkdownFenceContext<string>,
	) =>
		| MarkdownFenceNode<MarkdownExtensionNode<string, string, MarkdownPluginData, 'block'>>
		| null
		| undefined
	const transform: MarkdownTransform<Node> = (root, context: MarkdownTransformContext) => {
		const ownership = getMarkdownHelperOwnership(context)
		if (ownership == null) {
			throw new TypeError('Markdown fence transforms must run through createMarkdownPlugin')
		}
		const children = fenceTransformBlocks(
			root.children,
			languages,
			ownership.pluginName,
			ownership.hasRenderer,
			createNode,
			context.report,
		)
		return children === root.children ? root : { ...root, children }
	}

	// Every node this helper inserts is validated above against the same
	// rules Core applies to plugin-authored output — owned plugin name,
	// registered renderer, representable frozen data, no authored provenance
	// — and nothing else in the tree is touched. Core may therefore skip
	// revalidating the whole document after it runs.
	return markMarkdownTransformTrusted(
		markMarkdownTransformClaim(transform, (source) =>
			sourceNeedles.some((needle) => source.includes(needle)),
		) as MarkdownTransform<never>,
	)
}

// ---------------------------------------------------------------------------
// createMarkdownSourceDecoration (plugins/sourceDecoration.ts)
// ---------------------------------------------------------------------------

/**
 * Reserved node-data key and brand of the Core-owned decoration envelope.
 * Decorations are only ever read from, and merged into, a value carrying all
 * three: an arbitrary payload that happens to sit at this key is foreign data
 * and is left untouched.
 */
const ENVELOPE_KEY = 'astryx:sourceDecorations'
const ENVELOPE_BRAND = 'astryx.markdown.sourceDecorations'
const ENVELOPE_VERSION = 1

/** One decoration recorded on an annotated node. */
export interface MarkdownSourceDecoration {
	/** Stable decoration name supplied by the helper's caller. */
	readonly name: string
	/** Optional finite JSON-like payload copied from the matching range. */
	readonly data?: MarkdownPluginData
}

export interface MarkdownSourceDecorationRange {
	/** Inclusive UTF-16 offset into the parsed source. */
	readonly start: number
	/** Exclusive UTF-16 offset into the parsed source. */
	readonly end: number
	/** Optional finite JSON-like payload recorded with this range. */
	readonly data?: MarkdownPluginData
}

export interface MarkdownSourceDecorationOptions {
	/** Stable decoration name identifying every entry this helper records. */
	readonly name: string
	/**
	 * Source ranges to decorate, as UTF-16 offsets into the same string the
	 * parser received. Order does not matter: entries are recorded in a fixed
	 * start, end, payload order so overlapping and duplicate ranges resolve the
	 * same way on every run. An empty list is a valid no-op.
	 */
	readonly ranges: ReadonlyArray<MarkdownSourceDecorationRange>
}

/** A decoration entry as stored: plain, frozen, JSON-like node data. */
type DecorationEntry = { readonly [key: string]: MdDataValue }

interface NormalizedRange {
	readonly start: number
	readonly end: number
	readonly entry: DecorationEntry
}

/**
 * Every AST node shares an optional `position` and `data`; decoration is node
 * kind agnostic, so the walk below reads only those two fields plus children.
 */
type DecoratableNode = MdNodeBase & {
	readonly type: string
	readonly children?: ReadonlyArray<DecoratableNode>
}

interface RunState {
	readonly report: (message: string) => void
	hasReported: boolean
}

const NO_DECORATIONS: ReadonlyArray<MarkdownSourceDecoration> = Object.freeze([])

function isPlainObject(
	value: MdDataValue | undefined,
): value is { readonly [key: string]: MdDataValue } {
	return value != null && typeof value === 'object' && !Array.isArray(value)
}

function cloneDecorationData<Data extends MarkdownPluginData>(value: Data): Data {
	if (value == null || typeof value !== 'object') {
		return value
	}
	if (Array.isArray(value)) {
		return Object.freeze(value.map(cloneDecorationData)) as Data
	}
	const clone: Record<string, MdDataValue> = {}
	for (const [key, nested] of Object.entries(value)) {
		clone[key] = cloneDecorationData(nested)
	}
	return Object.freeze(clone) as Data
}

function decorationFail(message: string): never {
	throw new TypeError(`Markdown source decoration: ${message}`)
}

function normalizeRanges(
	name: string,
	ranges: ReadonlyArray<MarkdownSourceDecorationRange>,
): ReadonlyArray<NormalizedRange> {
	const normalized: (NormalizedRange & { readonly key: string })[] = []
	const seen = new Set<string>()
	for (const range of ranges) {
		if (
			!Number.isInteger(range.start) ||
			!Number.isInteger(range.end) ||
			range.start < 0 ||
			range.end <= range.start
		) {
			decorationFail('ranges must be ordered, non-empty, non-negative UTF-16 offsets')
		}

		if (range.data !== undefined && !isMarkdownPluginData(range.data)) {
			decorationFail('range data must be finite JSON-like plugin data')
		}

		const data = range.data === undefined ? undefined : cloneDecorationData(range.data)
		const key = `${range.start}\0${range.end}\0${data === undefined ? '' : JSON.stringify(data)}`
		if (seen.has(key)) {
			continue
		}

		seen.add(key)
		normalized.push({
			start: range.start,
			end: range.end,
			entry: Object.freeze(data === undefined ? { name } : { name, data }) as DecorationEntry,
			key,
		})
	}
	// Sorted by start, then end, then payload: the sweep below needs start
	// order, and the tail of the comparison makes overlapping and duplicate
	// ranges resolve identically on every run.
	normalized.sort(
		(left, right) =>
			left.start - right.start ||
			left.end - right.end ||
			(left.key < right.key ? -1 : left.key > right.key ? 1 : 0),
	)
	return Object.freeze(
		normalized.map(({ start, end, entry }) => Object.freeze({ start, end, entry })),
	)
}

/**
 * A node's Core-authored span, or `undefined` when it has no usable one.
 * Read into two numbers rather than an object: this runs once per node of
 * every decorated document.
 */
function spanStart(position: MdPosition | undefined): number {
	if (position === undefined) {
		return -1
	}
	const start = position.start.offset
	const end = position.end.offset
	return typeof start === 'number' && typeof end === 'number' && start >= 0 && end >= start
		? start
		: -1
}

/**
 * Reads the decoration entries already on a node. `null` means the node
 * carries data this helper does not own, so it must be left alone.
 */
function existingEntries(
	data: MdDataValue | undefined,
): ReadonlyArray<MdDataValue> | undefined | null {
	if (data === undefined) {
		return undefined
	}
	if (!isPlainObject(data)) {
		return null
	}
	const envelope = data[ENVELOPE_KEY]
	if (envelope === undefined) {
		return undefined
	}
	if (
		!isPlainObject(envelope) ||
		envelope.kind !== ENVELOPE_BRAND ||
		envelope.version !== ENVELOPE_VERSION ||
		!Array.isArray(envelope.entries) ||
		!envelope.entries.every(isDecorationEntry)
	) {
		return null
	}
	return envelope.entries
}

function isDecorationEntry(value: MdDataValue): boolean {
	return isPlainObject(value) && typeof value.name === 'string'
}

function envelope(entries: ReadonlyArray<MdDataValue>): MdDataValue {
	return {
		kind: ENVELOPE_BRAND,
		version: ENVELOPE_VERSION,
		entries,
	}
}

function reportSkip(state: RunState): void {
	if (state.hasReported) {
		return
	}
	state.hasReported = true
	state.report('skipped a node whose data is not a Core-owned source-decoration envelope')
}

/**
 * Records `entries` in the node's decoration envelope, or returns `undefined`
 * when the node carries data this helper does not own. Skipping keeps a
 * foreign payload intact instead of overwriting or extending it.
 */
function mergeDecorations(
	node: DecoratableNode,
	entries: ReadonlyArray<DecorationEntry>,
	state: RunState,
): MdDataValue | undefined {
	const current = existingEntries(node.data)
	if (current === null) {
		reportSkip(state)
		return undefined
	}
	const merged = envelope(current === undefined ? entries : [...current, ...entries])
	return node.data === undefined
		? { [ENVELOPE_KEY]: merged }
		: { ...(node.data as object), [ENVELOPE_KEY]: merged }
}

/**
 * Whether the positioned children already sit in ascending span order, and
 * the span-ordered index list when they do not. An earlier transform may
 * reorder, drop, or interleave blocks, so document order is never assumed —
 * but the ordinary case is detected in one pass and needs no index list at
 * all.
 */
function spanOrder(children: ReadonlyArray<DecoratableNode>): ReadonlyArray<number> | undefined {
	let previous = -1
	for (let index = 0; index < children.length; index++) {
		const start = spanStart(children[index].position)
		if (start < 0) {
			continue
		}

		if (start < previous) {
			const indices: number[] = []
			for (let scan = 0; scan < children.length; scan++) {
				if (spanStart(children[scan].position) >= 0) {
					indices.push(scan)
				}
			}

			indices.sort(
				(left, right) =>
					spanStart(children[left].position) - spanStart(children[right].position) || left - right,
			)

			return indices
		}

		previous = start
	}
	return undefined
}

/**
 * The first slot whose node can overlap `offset` — that is, the first one
 * ending after it. Spans ascend, so the blocks a range touches are one
 * contiguous run and a search finds its start without walking the document.
 * Decorating a known range therefore costs the blocks it actually covers,
 * not the length of the document it sits in.
 */
function firstSlotEndingAfter(
	children: ReadonlyArray<DecoratableNode>,
	order: ReadonlyArray<number> | undefined,
	length: number,
	offset: number,
): number {
	let low = 0
	let high = length
	while (low < high) {
		const middle = (low + high) >>> 1
		const node = children[order?.[middle] ?? middle]
		const end = node.position?.end.offset
		if (typeof end === 'number' && end <= offset) {
			low = middle + 1
		} else {
			high = middle
		}
	}
	return low
}

/**
 * Sweeps the start-sorted ranges across the span-ordered children, keeping
 * the ranges that can still overlap in an active window. Each range is
 * admitted and retired at most once, so the pass costs the blocks the ranges
 * reach plus the matches — never the whole document per range.
 */
function decorateChildren(
	children: ReadonlyArray<DecoratableNode>,
	ranges: ReadonlyArray<NormalizedRange>,
	state: RunState,
): ReadonlyArray<DecoratableNode> {
	const order = spanOrder(children)
	const length = order?.length ?? children.length
	let next: DecoratableNode[] | undefined
	let cursor = 0
	const active: NormalizedRange[] = []

	// Skip straight to the first block the earliest range can reach. Unordered
	// trees fall back to a full sweep, since a sorted index list makes the
	// search valid only over positioned nodes.
	let slot =
		order === undefined ? firstSlotEndingAfter(children, order, length, ranges[0].start) : 0

	for (; slot < length; slot++) {
		// Once every range has been admitted and retired, no later span can
		// match: the rest of the document is left untouched.
		if (cursor >= ranges.length && active.length === 0) {
			break
		}

		const index = order?.[slot] ?? slot
		const child = children[index]
		const start = spanStart(child.position)
		if (start < 0) {
			continue
		}

		const end = child.position?.end.offset as number
		while (cursor < ranges.length && ranges[cursor].start < end) {
			active.push(ranges[cursor++])
		}

		// Retire in place: spans are visited in ascending start order, so a range
		// that ended before this one starts cannot match any later span either.
		let kept = 0
		for (let activeSlot = 0; activeSlot < active.length; activeSlot++) {
			if (active[activeSlot].end > start) {
				active[kept++] = active[activeSlot]
			}
		}

		active.length = kept
		if (kept === 0) {
			// No range reaches this block. When the next range starts beyond this
			// block, jump to the first block it can reach rather than walking the
			// gap between; when it starts inside this one the next block is
			// already the answer and searching for it would cost more than
			// stepping to it.
			if (order === undefined && cursor < ranges.length && ranges[cursor].start > end) {
				const jump = firstSlotEndingAfter(children, order, length, ranges[cursor].start)
				if (jump > slot) {
					slot = jump - 1
				}
			}

			continue
		}

		const decorated = decorateNode(child, active, state)
		if (decorated === child) {
			continue
		}

		next ??= children.slice()
		next[index] = decorated
	}
	return next ?? children
}

/**
 * Decorates one node every range in `ranges` already overlaps. Decoration
 * stops at the outermost positioned node, so a range never records itself
 * twice down one branch.
 */
function decorateNode(
	node: DecoratableNode,
	ranges: ReadonlyArray<NormalizedRange>,
	state: RunState,
): DecoratableNode {
	// Extension nodes belong to the plugin that produced them; their data is
	// part of their identity, so decoration never touches them.
	if (node.type === 'extension') {
		return node
	}
	const data = mergeDecorations(
		node,
		ranges.map((range) => range.entry),
		state,
	)
	return data === undefined ? node : { ...node, data }
}

/**
 * Compiles validated source ranges into an immutable transform that records
 * non-semantic presentation metadata on the Core-authored nodes those ranges
 * overlap.
 */
export function createMarkdownSourceDecoration(
	options: MarkdownSourceDecorationOptions,
): MarkdownTransform<never> {
	if (typeof options.name !== 'string' || options.name.trim() === '') {
		decorationFail('name must be a non-empty string')
	}
	if (!Array.isArray(options.ranges)) {
		decorationFail('ranges must be an array')
	}
	const ranges = normalizeRanges(options.name, options.ranges)
	const smallestStart = ranges.length === 0 ? -1 : ranges[0].start

	const transform: MarkdownTransform<never> = (document, context) => {
		// Decorations describe settled source. While a document streams, the
		// block a range falls in can still be re-parsed, re-split, merged into a
		// table or list, or withheld entirely, so a range's covering block is not
		// stable and a decoration computed from it could appear, vanish, and
		// reappear across chunks. Waiting for the settled snapshot makes exposure
		// monotone by construction: absent while the source can still change,
		// then present once it cannot.
		if (!context.isFinal || ranges.length === 0) {
			return document
		}
		// A range starting at or past the end of the source overlaps nothing.
		const usable =
			ranges[ranges.length - 1].start < context.source.length
				? ranges
				: ranges.filter((range) => range.start < context.source.length)
		if (usable.length === 0) {
			return document
		}
		const root = document as unknown as DecoratableNode
		if (root.children == null) {
			return document
		}
		const state: RunState = {
			report: (message) => context.report(message),
			hasReported: false,
		}
		const children = decorateChildren(root.children, usable, state)
		return children === root.children ? document : ({ ...document, children } as unknown as MdDoc)
	}

	// Every node this helper emits is built here, from ranges validated above:
	// it inserts no caller-supplied node and changes no existing node's meaning,
	// provenance, or ownership. Core may therefore skip the validation and
	// freezing it applies to plugin-authored output.
	return markMarkdownTransformTrusted(
		markMarkdownTransformClaim(
			transform,
			(source) => smallestStart >= 0 && source.length > smallestStart,
		),
	)
}

/**
 * Reads the decorations a source-decoration helper recorded on a node.
 * Returns an empty list for undecorated nodes and for any value that is not
 * a current Core-owned decoration envelope.
 */
export function getMarkdownSourceDecorations(
	node: MdNodeBase,
): ReadonlyArray<MarkdownSourceDecoration> {
	const entries = existingEntries(node.data)
	return entries == null || entries.length === 0
		? NO_DECORATIONS
		: (entries as unknown as ReadonlyArray<MarkdownSourceDecoration>)
}

// ---------------------------------------------------------------------------
// createMarkdownFrontmatter (plugins/frontmatter.ts)
// ---------------------------------------------------------------------------

const FRONTMATTER_ENVELOPE_KEY = 'astryx:frontmatter'
const FRONTMATTER_ENVELOPE_BRAND = 'astryx.markdown.frontmatter'
const FRONTMATTER_ENVELOPE_VERSION = 1

type FrontmatterRecord = Readonly<Record<string, string>>
type FrontmatterEnvelope = {
	readonly brand: typeof FRONTMATTER_ENVELOPE_BRAND
	readonly version: typeof FRONTMATTER_ENVELOPE_VERSION
	readonly values: Readonly<Record<string, MarkdownPluginData>>
}

export interface MarkdownFrontmatterOptions<Metadata extends MarkdownPluginData> {
	/** Stable plugin and metadata namespace. */
	readonly name: string
	/** Converts validated key/value fields into typed document metadata. */
	readonly parse: (fields: FrontmatterRecord) => Metadata
}

export type MarkdownFrontmatterParseResult<Metadata extends MarkdownPluginData> =
	| { readonly status: 'none' }
	| { readonly status: 'defer' }
	| {
			readonly status: 'match'
			readonly contentStart: number
			readonly metadata: Metadata
	  }

export interface MarkdownFrontmatter<Metadata extends MarkdownPluginData> {
	readonly plugin: MarkdownPluginEntry<never>
	parse(source: string, isFinal?: boolean): MarkdownFrontmatterParseResult<Metadata>
	getMetadata(document: MdDoc): Metadata | undefined
}

type DataRecord = Readonly<Record<string, MarkdownPluginData>>

function asDataRecord(value: MarkdownPluginData | undefined): DataRecord {
	return value != null && typeof value === 'object' && !Array.isArray(value)
		? (value as DataRecord)
		: {}
}

function parseFrontmatterEnvelope(value: unknown): FrontmatterEnvelope | undefined {
	if (value == null || typeof value !== 'object' || Array.isArray(value)) {
		return
	}
	const candidate = value as Partial<FrontmatterEnvelope>
	return candidate.brand === FRONTMATTER_ENVELOPE_BRAND &&
		candidate.version === FRONTMATTER_ENVELOPE_VERSION &&
		candidate.values != null &&
		typeof candidate.values === 'object' &&
		!Array.isArray(candidate.values)
		? (candidate as FrontmatterEnvelope)
		: undefined
}

function readFrontmatter(source: string):
	| { readonly status: 'none' }
	| { readonly status: 'defer' }
	| {
			readonly status: 'match'
			readonly end: number
			readonly fields: FrontmatterRecord
	  } {
	const openingLength = source.startsWith('---\r\n') ? 5 : source.startsWith('---\n') ? 4 : 0
	if (openingLength === 0) {
		return { status: 'none' }
	}
	const body = source.slice(openingLength)
	const close = /(?:^|\r?\n)---(?=\r?\n|$)/.exec(body)
	if (close == null) {
		return { status: 'defer' }
	}
	const entries = new Map<string, string>()
	for (const line of body.slice(0, close.index).split(/\r?\n/)) {
		if (line.trim() === '') {
			continue
		}

		const separator = line.indexOf(':')
		const key = line.slice(0, separator).trim()
		if (separator <= 0 || key === '' || entries.has(key)) {
			return { status: 'none' }
		}

		entries.set(key, line.slice(separator + 1).trim())
	}
	// A plain object, so a parser that returns the record unchanged passes the
	// JSON-like metadata check. `fromEntries` defines every key as an own data
	// property, so a field named `__proto__` stays a field.
	const fields: Record<string, string> = Object.fromEntries(entries)
	let end = openingLength + close.index + close[0].length
	if (source.startsWith('\r\n', end)) {
		end += 2
	} else if (source[end] === '\n') {
		end += 1
	}
	return { status: 'match', end, fields: Object.freeze(fields) }
}

export function createMarkdownFrontmatter<Metadata extends MarkdownPluginData>(
	options: MarkdownFrontmatterOptions<Metadata>,
): MarkdownFrontmatter<Metadata> {
	if (options.name.trim() === '') {
		throw new TypeError('Markdown frontmatter name must be non-empty')
	}
	const name = options.name
	const parse = (source: string, isFinal = true): MarkdownFrontmatterParseResult<Metadata> => {
		const parsed = readFrontmatter(source)
		if (parsed.status === 'defer') {
			return isFinal ? { status: 'none' } : parsed
		}
		if (parsed.status === 'none') {
			return parsed
		}
		const metadata = options.parse(parsed.fields)
		if (!isMarkdownPluginData(metadata)) {
			throw new TypeError('Markdown frontmatter metadata must be finite JSON-like data')
		}
		return {
			status: 'match',
			contentStart: parsed.end,
			metadata: freezeMarkdownPluginData(metadata),
		}
	}
	const transform: MarkdownTransform<never> = (document, context) => {
		const parsed = parse(context.source, context.isFinal)
		if (parsed.status === 'none') {
			return document
		}
		if (parsed.status === 'defer') {
			return { ...document, children: [] }
		}
		const documentData = asDataRecord(document.data)
		const prior = parseFrontmatterEnvelope(documentData[FRONTMATTER_ENVELOPE_KEY])
		const envelope: FrontmatterEnvelope = Object.freeze({
			brand: FRONTMATTER_ENVELOPE_BRAND,
			version: FRONTMATTER_ENVELOPE_VERSION,
			values: Object.freeze({
				...prior?.values,
				[name]: parsed.metadata,
			}),
		})
		return {
			...document,
			data: Object.freeze({ ...documentData, [FRONTMATTER_ENVELOPE_KEY]: envelope }),
			children: document.children.filter(
				(node) => (node.position?.end.offset ?? Infinity) > parsed.contentStart,
			),
		}
	}
	const plugin = createMarkdownPlugin({
		name,
		apiVersion: 1,
		transform: markMarkdownTransformTrusted(transform),
	})
	return Object.freeze({
		plugin,
		parse,
		getMetadata(document: MdDoc) {
			const data = asDataRecord(document.data)
			return parseFrontmatterEnvelope(data[FRONTMATTER_ENVELOPE_KEY])?.values[name] as
				| Metadata
				| undefined
		},
	})
}

// ---------------------------------------------------------------------------
// markdownSoftBreaksPlugin (plugins/softBreaks.ts)
// ---------------------------------------------------------------------------

function replaceLineEndings(value: string): ReadonlyArray<Phrasing> | null {
	const pattern = /\r?\n|\r/g
	let match = pattern.exec(value)
	if (match == null) {
		return null
	}
	const output: Phrasing[] = []
	let cursor = 0
	do {
		if (match.index > cursor) {
			output.push({ type: 'text', value: value.slice(cursor, match.index) })
		}

		output.push({ type: 'break' })
		cursor = match.index + match[0].length
		match = pattern.exec(value)
	} while (match != null)
	if (cursor < value.length) {
		output.push({ type: 'text', value: value.slice(cursor) })
	}
	return output
}

function softTransformPhrasing(children: ReadonlyArray<MdInline>): ReadonlyArray<MdInline> {
	let next: MdInline[] | undefined
	for (let index = 0; index < children.length; index++) {
		const node = children[index]
		if (node.type === 'text') {
			const replacement = replaceLineEndings(node.value)
			if (replacement == null) {
				next?.push(node)
			} else {
				next ??= children.slice(0, index)
				next.push(...replacement)
			}

			continue
		}

		if (
			node.type === 'strong' ||
			node.type === 'emphasis' ||
			node.type === 'delete' ||
			node.type === 'link'
		) {
			const nested = softTransformPhrasing(node.children)
			if (nested !== node.children) {
				next ??= children.slice(0, index)
				next.push({ ...node, children: nested })
			} else {
				next?.push(node)
			}

			continue
		}

		next?.push(node)
	}
	return next ?? children
}

function softTransformTableCell(cell: MdTableCell) {
	const children = softTransformPhrasing(cell.children)
	return children === cell.children ? cell : { ...cell, children }
}

function softTransformTableRow(row: MdTableRow) {
	const children = row.children.map(softTransformTableCell)
	return children.every((child, index) => child === row.children[index])
		? row
		: { ...row, children }
}

function softTransformListItem(item: MdListItem) {
	const children = softTransformBlocks(item.children)
	return children === item.children ? item : { ...item, children }
}

function softTransformBlocks(children: ReadonlyArray<MdNode>): ReadonlyArray<MdNode> {
	let next: MdNode[] | undefined
	for (let index = 0; index < children.length; index++) {
		const node = children[index]
		let transformed: MdNode = node
		switch (node.type) {
			case 'heading':
			case 'paragraph': {
				const nested = softTransformPhrasing(node.children)
				if (nested !== node.children) {
					transformed = { ...node, children: nested }
				}

				break
			}
			case 'blockquote': {
				const nested = softTransformBlocks(node.children)
				if (nested !== node.children) {
					transformed = { ...node, children: nested }
				}

				break
			}
			case 'list': {
				const nested = node.children.map(softTransformListItem)
				if (nested.some((child, childIndex) => child !== node.children[childIndex])) {
					transformed = { ...node, children: nested }
				}

				break
			}
			case 'table': {
				const nested = node.children.map(softTransformTableRow)
				if (nested.some((child, childIndex) => child !== node.children[childIndex])) {
					transformed = { ...node, children: nested }
				}

				break
			}
			case 'code':
			case 'math':
			case 'thematicBreak':
			case 'image':
			case 'extension':
				break
			default:
				node satisfies never
		}

		if (transformed !== node) {
			next ??= children.slice(0, index)
		}

		next?.push(transformed)
	}
	return next ?? children
}

const transformSoftBreaks: MarkdownTransform<never> = (document) => {
	const children = softTransformBlocks(document.children)
	return children === document.children ? document : { ...document, children }
}

/** Converts soft line endings in Markdown phrasing content to hard breaks. */
export const markdownSoftBreaksPlugin: MarkdownPluginEntry<never> = createMarkdownPlugin({
	name: 'soft-breaks',
	apiVersion: 1,
	transform: transformSoftBreaks,
})

// ---------------------------------------------------------------------------
// markdownSourceLinesPlugin (plugins/sourceLines.ts)
// ---------------------------------------------------------------------------

/**
 * Records the 1-based, inclusive source lines of every block Markdown renders,
 * nested blocks included. Rendered blocks carry them as `data-source-line` and
 * `data-source-line-end`, `components` block renderers receive them as
 * `sourceLines`, and canonical block nodes carry them as `position` lines.
 * The lines come from the parse Markdown already runs; without this plugin
 * no line work happens.
 */
export const markdownSourceLinesPlugin: MarkdownPluginEntry<never> =
	createMarkdownSourceLinesEntry('source-lines')

// ---------------------------------------------------------------------------
// createMarkdownHeadingLinks (plugins/headingLinks.ts)
// ---------------------------------------------------------------------------

const HEADING_LINKS_PLUGIN_NAME = 'heading-links'
const PORTABLE_CONFIG_KIND = '@octane-xplat/ui/MarkdownHeadingLinksConfig'
const portableConfigKey = Symbol.for(PORTABLE_CONFIG_KIND)
type Heading = MdHeading

export interface MarkdownHeadingLinksOptions {
	/**
	 * Stable caller-owned namespace for generated heading ids. Use the same
	 * value for the Markdown root `id` when each document needs its own fragment
	 * namespace. Omit it to keep unprefixed fragments for a single document.
	 */
	readonly headingIdPrefix?: string
	/**
	 * Optional caller-owned URL before the generated `#fragment`. Omit it to copy
	 * an absolute URL for the current document. Any existing fragment is replaced.
	 */
	readonly permalinkBaseUrl?: string
}

interface PortableMarkdownHeadingLinksConfig {
	readonly kind: typeof PORTABLE_CONFIG_KIND
	readonly apiVersion: 1
	readonly headingIdPrefix?: string
	readonly permalinkBaseUrl: string
}

/** @internal Module-owned projection consumed by Markdown and Outline. */
export interface MarkdownHeadingLinksProjection {
	readonly ids: ReadonlyMap<Heading, string>
	readonly labels: ReadonlyMap<Heading, string>
	readonly permalinkUrls: ReadonlyMap<Heading, string>
}

const identityTransform = markMarkdownTransformTrusted((root) => root)

function headingLinksFail(message: string): never {
	throw new TypeError(`Markdown heading links: ${message}`)
}

const NON_SLUG_CHARACTERS = new RegExp('[^\\p{Letter}\\p{Number}]+', 'gu')

function headingSlug(value: string): string {
	return value
		.normalize('NFKC')
		.trim()
		.toLowerCase()
		.replace(/['"]/gu, '')
		.replace(NON_SLUG_CHARACTERS, '-')
		.replace(/^-+|-+$/gu, '')
}

function uniqueHeadingSlug(baseSlug: string, counts: Map<string, number>): string {
	const fallbackSlug = baseSlug || 'section'
	let count = counts.get(fallbackSlug) ?? 0
	let candidate = count === 0 ? fallbackSlug : `${fallbackSlug}-${count}`
	while (counts.has(candidate)) {
		count++
		candidate = `${fallbackSlug}-${count}`
	}
	counts.set(fallbackSlug, count + 1)
	counts.set(candidate, 0)
	return candidate
}

function createPortableConfig(
	headingIdPrefix: string | undefined,
	permalinkBaseUrl: string,
): PortableMarkdownHeadingLinksConfig {
	return Object.freeze({
		kind: PORTABLE_CONFIG_KIND,
		apiVersion: 1 as const,
		headingIdPrefix,
		permalinkBaseUrl,
	})
}

const PERMALINK_VALIDATION_BASE = 'https://octane.invalid/'

function isParsablePermalinkBaseUrl(url: string): boolean {
	try {
		new URL(url, PERMALINK_VALIDATION_BASE)
		return true
	} catch {
		return false
	}
}

function readPortableConfig(
	entry: MarkdownPluginEntry,
): PortableMarkdownHeadingLinksConfig | undefined {
	const definition = getMarkdownPluginDefinition(entry)
	if (definition.name !== HEADING_LINKS_PLUGIN_NAME) {
		return undefined
	}

	const config = (definition as unknown as Record<PropertyKey, unknown>)[portableConfigKey] as
		| Partial<PortableMarkdownHeadingLinksConfig>
		| undefined
	if (
		config == null ||
		typeof config !== 'object' ||
		Object.getPrototypeOf(config) !== Object.prototype ||
		Reflect.ownKeys(config).length !== 4 ||
		!Object.isFrozen(config) ||
		config.kind !== PORTABLE_CONFIG_KIND ||
		config.apiVersion !== 1 ||
		(config.headingIdPrefix !== undefined && typeof config.headingIdPrefix !== 'string') ||
		typeof config.permalinkBaseUrl !== 'string' ||
		config.permalinkBaseUrl.includes('#') ||
		!isParsablePermalinkBaseUrl(config.permalinkBaseUrl) ||
		(config.permalinkBaseUrl !== '' &&
			sanitizeUrl(config.permalinkBaseUrl) !== config.permalinkBaseUrl)
	) {
		return undefined
	}
	return config as PortableMarkdownHeadingLinksConfig
}

/**
 * Create the opt-in plugin that gives every rendered h1–h6 a stable identity
 * and an inline sibling copy button for each built-in heading. The entry is safe
 * to share between Markdown and Markdown-derived Outline.
 */
export function createMarkdownHeadingLinks(
	options: MarkdownHeadingLinksOptions = {},
): MarkdownPluginEntry<never> {
	if (options.headingIdPrefix !== undefined && typeof options.headingIdPrefix !== 'string') {
		headingLinksFail('headingIdPrefix must be a string')
	}
	if (options.permalinkBaseUrl !== undefined && typeof options.permalinkBaseUrl !== 'string') {
		headingLinksFail('permalinkBaseUrl must be a string')
	}

	const rawBaseUrl = options.permalinkBaseUrl ?? ''
	const sanitizedBaseUrl = rawBaseUrl === '' ? '' : sanitizeUrl(rawBaseUrl)
	if (sanitizedBaseUrl == null || !isParsablePermalinkBaseUrl(sanitizedBaseUrl)) {
		headingLinksFail('permalinkBaseUrl must be a safe, parseable navigation URL')
	}
	const permalinkBaseUrl = sanitizedBaseUrl.replace(/#.*$/u, '')

	const definition = {
		name: HEADING_LINKS_PLUGIN_NAME,
		apiVersion: 1 as const,
		transform: identityTransform,
	}
	Object.defineProperty(definition, portableConfigKey, {
		configurable: false,
		enumerable: false,
		value: createPortableConfig(options.headingIdPrefix, permalinkBaseUrl),
		writable: false,
	})
	return createMarkdownPlugin(definition)
}

function getHeadingLinksConfig(
	plugins: PreparedMarkdownPlugins | undefined,
): PortableMarkdownHeadingLinksConfig | undefined {
	if (plugins == null) {
		return undefined
	}
	for (const entry of plugins.entries) {
		const config = readPortableConfig(entry)
		if (config != null) {
			return config
		}
	}
	return undefined
}

function visitHeadings(root: MdDoc, visit: (heading: Heading) => void): void {
	const walk = (node: MdNode): void => {
		if (node.type === 'heading') {
			visit(node)
		}
		switch (node.type) {
			case 'blockquote':
				for (const child of node.children) {
					walk(child)
				}

				break
			case 'list':
				for (const item of node.children) {
					for (const child of item.children) {
						walk(child)
					}
				}

				break
			default:
				break
		}
	}
	for (const child of root.children) {
		walk(child)
	}
}

/** @internal Project the module's all-depth identity after transforms run. */
export function projectMarkdownHeadingLinks(
	root: MdDoc,
	preparedPlugins?: PreparedMarkdownPlugins,
): MarkdownHeadingLinksProjection | undefined {
	const config = getHeadingLinksConfig(preparedPlugins)
	if (config == null) {
		return undefined
	}

	const ids = new Map<Heading, string>()
	const labels = new Map<Heading, string>()
	const permalinkUrls = new Map<Heading, string>()
	const counts = new Map<string, number>()

	visitHeadings(root, (heading) => {
		const label = mdInlineText(heading.children, (node) =>
			markdownExtensionText(preparedPlugins, node),
		).trim()
		const slug = uniqueHeadingSlug(headingSlug(label), counts)
		const id =
			config.headingIdPrefix != null && config.headingIdPrefix !== ''
				? `${config.headingIdPrefix}--${slug}`
				: slug
		ids.set(heading, id)
		labels.set(heading, label)
		permalinkUrls.set(heading, `${config.permalinkBaseUrl}#${id}`)
	})

	return { ids, labels, permalinkUrls }
}
