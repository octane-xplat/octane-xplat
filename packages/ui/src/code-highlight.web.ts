// CSS Custom Highlight API plumbing for CodeBlock's 'ranges' highlight mode.
// Web-only: DOM Range/Highlight objects have no native analog — native leaves
// always render styled spans. Ported from Astryx's highlightRanges.ts +
// highlightStyles.ts with the vx- token class names.
import type { SyntaxToken, TokenLine } from './props'
import { TOKEN_TYPES } from './code-tokenizer'

interface ContentVisibilityAutoStateChangeEvent extends Event {
	readonly skipped: boolean
}

interface CheckVisibilityOptions {
	checkVisibilityCSS?: boolean
	contentVisibilityAuto?: boolean
}

interface RangeEntry {
	range: Range
	highlight: Highlight
}

/** Whether the CSS Custom Highlight API is usable in this engine. */
export function hasHighlightAPI(): boolean {
	return (
		typeof CSS !== 'undefined' &&
		'highlights' in CSS &&
		typeof Highlight !== 'undefined'
	)
}

/**
 * Safari exposes the Highlight API objects but has rendering issues with
 * ::highlight() in code blocks — detect WebKit-without-Chrome so callers can
 * fall back to spans.
 */
export function isWebKitOnly(): boolean {
	if (typeof navigator === 'undefined') {
		return false
	}

	const ua = navigator.userAgent
	return ua.includes('AppleWebKit') && !ua.includes('Chrome')
}

// ---------------------------------------------------------------------------
// Dynamic ::highlight() style injection
// ---------------------------------------------------------------------------

const registeredHighlightTypes = new Set<string>(TOKEN_TYPES)
let dynamicStyleSheet: CSSStyleSheet | null = null

function ensureDynamicHighlightType(tokenType: string): void {
	if (registeredHighlightTypes.has(tokenType)) {
		return
	}

	registeredHighlightTypes.add(tokenType)

	if (typeof document === 'undefined') {
		return
	}

	if (!dynamicStyleSheet) {
		const style = document.createElement('style')
		style.setAttribute('data-xplat-highlight-dynamic', '')
		document.head.appendChild(style)
		dynamicStyleSheet = style.sheet ?? null
		if (!dynamicStyleSheet) {
			return
		}
	}

	const name = CSS.escape(`xplat-${tokenType}`)
	const colorVar = `var(${CSS.escape(`--color-syntax-${tokenType}`)}, currentColor)`
	try {
		dynamicStyleSheet.insertRule(
			`.vx-codeblock code::highlight(${name}) { color: ${colorVar}; }`,
		)
	} catch {
		// An engine that refuses the rule costs that type its colour — never
		// the whole code block.
	}
}

function createHighlightResolver(): (tokenType: string) => Highlight {
	const cache = new Map<string, Highlight>()
	return (tokenType: string): Highlight => {
		let highlight = cache.get(tokenType)
		if (highlight) {
			return highlight
		}

		ensureDynamicHighlightType(tokenType)

		const name = `xplat-${tokenType}`
		highlight = CSS.highlights.get(name) ?? new Highlight()
		if (!CSS.highlights.has(name)) {
			CSS.highlights.set(name, highlight)
		}

		cache.set(tokenType, highlight)
		return highlight
	}
}

// ---------------------------------------------------------------------------
// Range application — line-based
// ---------------------------------------------------------------------------

/**
 * Apply highlight ranges for a single line's tokens. The line element is
 * expected to contain a single text node as its first child (or a zero-width
 * space placeholder for empty lines).
 */
function applyLineRanges(
	lineEl: Element,
	tokens: SyntaxToken[],
	results: RangeEntry[],
	resolve: (tokenType: string) => Highlight,
): void {
	if (tokens.length === 0) {
		return
	}

	const textNode = lineEl.firstChild
	if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
		return
	}

	const textLength = (textNode as Text).length

	for (const token of tokens) {
		if (token.start >= textLength || token.end <= 0) {
			continue
		}

		const start = Math.min(token.start, textLength)
		const end = Math.min(token.end, textLength)
		const highlight = resolve(token.type)

		try {
			const range = new Range()
			range.setStart(textNode, start)
			range.setEnd(textNode, end)
			highlight.add(range)
			results.push({ range, highlight })
		} catch {
			// Skip invalid ranges
		}
	}
}

function cleanupRanges(ranges: RangeEntry[]): void {
	for (const { range, highlight } of ranges) {
		highlight.delete(range)
	}
}

function applyRangesToContainer(
	container: Element,
	tokenLines: TokenLine[],
	globalLineOffset: number,
	resolve: (tokenType: string) => Highlight,
): RangeEntry[] {
	const results: RangeEntry[] = []
	const lineEls = container.querySelectorAll('[data-line]')
	for (let i = 0; i < lineEls.length; i++) {
		const tokens = tokenLines[globalLineOffset + i]
		if (tokens && tokens.length > 0) {
			applyLineRanges(lineEls[i], tokens, results, resolve)
		}
	}

	return results
}

/**
 * Apply CSS Custom Highlight ranges lazily as content-visibility chunks
 * scroll into view. Small files (lines directly inside <code>) apply
 * immediately. Returns a cleanup removing all ranges and listeners.
 */
export function applyHighlightRangesChunked(
	codeEl: HTMLElement,
	tokenLines: TokenLine[],
): () => void {
	const resolve = createHighlightResolver()

	const chunkWrappers: Element[] = []
	const chunkLineOffsets: number[] = []
	let lineCount = 0

	for (let i = 0; i < codeEl.children.length; i++) {
		const child = codeEl.children[i]
		const lineEls = child.querySelectorAll('[data-line]')
		if (lineEls.length > 0 && child.tagName === 'DIV' && !child.hasAttribute('data-line')) {
			chunkWrappers.push(child)
			chunkLineOffsets.push(lineCount)
			lineCount += lineEls.length
		}
	}

	if (chunkWrappers.length === 0) {
		const allRanges = applyRangesToContainer(codeEl, tokenLines, 0, resolve)
		return () => cleanupRanges(allRanges)
	}

	const chunkRanges = new Map<Element, RangeEntry[]>()
	const listeners = new Map<Element, EventListener>()

	const applyChunk = (wrapper: Element, index: number) => {
		if (chunkRanges.has(wrapper)) {
			return
		}

		chunkRanges.set(
			wrapper,
			applyRangesToContainer(wrapper, tokenLines, chunkLineOffsets[index], resolve),
		)
	}

	const removeChunk = (wrapper: Element) => {
		const ranges = chunkRanges.get(wrapper)
		if (ranges) {
			cleanupRanges(ranges)
			chunkRanges.delete(wrapper)
		}
	}

	for (let i = 0; i < chunkWrappers.length; i++) {
		const wrapper = chunkWrappers[i]

		const handler = (e: Event) => {
			const skipped = (e as ContentVisibilityAutoStateChangeEvent).skipped
			if (skipped) {
				removeChunk(wrapper)
			} else {
				applyChunk(wrapper, i)
			}
		}

		wrapper.addEventListener('contentvisibilityautostatechange', handler)
		listeners.set(wrapper, handler)

		const el = wrapper as HTMLElement & {
			checkVisibility?: (opts?: CheckVisibilityOptions) => boolean
		}

		if (typeof el.checkVisibility === 'function') {
			if (el.checkVisibility({ checkVisibilityCSS: true, contentVisibilityAuto: true })) {
				applyChunk(wrapper, i)
			}
		} else if (i < 5) {
			applyChunk(wrapper, i)
		}
	}

	return () => {
		for (const [wrapper, handler] of listeners) {
			wrapper.removeEventListener('contentvisibilityautostatechange', handler)
		}

		listeners.clear()
		for (const ranges of chunkRanges.values()) {
			cleanupRanges(ranges)
		}

		chunkRanges.clear()
	}
}

/**
 * Apply highlight ranges for a batch of lines starting at `startLine` — used
 * by the streaming tokenizer to apply highlights progressively.
 */
export function applyHighlightRangesBatch(
	codeEl: HTMLElement,
	tokenLines: TokenLine[],
	startLine: number,
): RangeEntry[] {
	const resolve = createHighlightResolver()
	const lineEls = codeEl.querySelectorAll('[data-line]')
	const results: RangeEntry[] = []

	for (let i = 0; i < tokenLines.length; i++) {
		const divIndex = startLine + i
		if (divIndex >= lineEls.length) {
			break
		}

		const tokens = tokenLines[i]
		if (tokens && tokens.length > 0) {
			applyLineRanges(lineEls[divIndex], tokens, results, resolve)
		}
	}

	return results
}

/**
 * Apply ranges to a flat element (no [data-line] structure), e.g. a
 * contentEditable code surface where all text is Text nodes with newlines.
 */
export function applyHighlightRangesFlat(
	el: HTMLElement,
	tokenLines: TokenLine[],
): () => void {
	const resolve = createHighlightResolver()
	const myRanges: RangeEntry[] = []

	const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
	const textNodes: { node: Text; start: number; length: number }[] = []
	let totalOffset = 0
	let current = walker.nextNode()
	while (current) {
		const text = current as Text
		textNodes.push({ node: text, start: totalOffset, length: text.length })
		totalOffset += text.length
		current = walker.nextNode()
	}

	if (textNodes.length === 0) {
		return () => cleanupRanges(myRanges)
	}

	const resolveOffset = (absOffset: number) => {
		for (const entry of textNodes) {
			const end = entry.start + entry.length
			if (absOffset >= entry.start && absOffset <= end) {
				return { node: entry.node, offset: absOffset - entry.start }
			}
		}

		return null
	}

	const fullText = el.textContent ?? ''
	let lineOffset = 0
	for (const lineTokens of tokenLines) {
		if (lineTokens) {
			for (const token of lineTokens) {
				const startPos = resolveOffset(lineOffset + token.start)
				const endPos = resolveOffset(lineOffset + token.end)
				if (!startPos || !endPos) {
					continue
				}

				const highlight = resolve(token.type)
				try {
					const range = new Range()
					range.setStart(startPos.node, startPos.offset)
					range.setEnd(endPos.node, endPos.offset)
					highlight.add(range)
					myRanges.push({ range, highlight })
				} catch {
					// Skip invalid ranges
				}
			}
		}

		const nlPos = fullText.indexOf('\n', lineOffset)
		lineOffset = nlPos === -1 ? fullText.length : nlPos + 1
	}

	return () => cleanupRanges(myRanges)
}

export { cleanupRanges }
