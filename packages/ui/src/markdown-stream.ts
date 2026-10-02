// Incremental Markdown parsing for streaming text — the `text` prop grows in
// chunks (chat/AI output), often ending mid-construct.
//
// Portions adapted from Meta Platforms' Astryx Markdown, MIT license
// (github.com/facebook/astryx — packages/core/src/Markdown/parser.ts and
// streaming.ts): the settled-prefix boundary scan, the incomplete-construct
// trims, the loose-list seam merge, and the fade boundary/segment helpers are
// ports of `findSettledBoundary`, `trimStreamingArtifacts`,
// `trimUnsettledStructural`, `appendSettledBlocks`, `computeBoundaries`, and
// `computeSegments`, narrowed to this package's Markdown grammar and DOM-free.
//
// Design: the input splits at the last "safe" boundary — a blank line that is
// not the final line and not inside an open code fence. Everything before it
// is immutable (no construct in this grammar crosses a blank line except a
// loose list, which merges at the seam), so those blocks parse once and are
// shared by reference across calls. Only the tail reparses per chunk.

import { parseMdNodesMarked, mdInlineLen } from './markdown-parse'
import type { MdNode } from './props'

/** Mutable cache for `parseMarkdownIncremental`. Create per logical doc
 *  (e.g. per message) — a state reused for a wholesale different input
 *  resets itself, but holding one state per stream is cheaper. */
export interface MarkdownIncrementalState {
	/** Last input seen — identical input returns the same output array. */
	input: string
	/** Immutable source prefix: every parsed block here is final. */
	settledSource: string
	/** Blocks parsed from `settledSource`, shared by reference across calls. */
	settled: MdNode[]
	/** List continuation key per settled node (loose-list seam merging). */
	marks: (string | undefined)[]
	/** Last returned node array (identity reuse for identical input). */
	output: MdNode[]
}

export function createMarkdownIncrementalState(): MarkdownIncrementalState {
	return { input: '', settledSource: '', settled: [], marks: [], output: [] }
}

const FENCE_OPEN = /^(`{3,}|~{3,})/

/**
 * Line index of the last blank line that is not inside a fenced code block —
 * the offset where the immutable prefix ends. A trailing blank line does not
 * count: it may be mid-append. An open fence collapses the boundary to the
 * blank line before it opened, since fenced content can't change what came
 * before.
 */
function findSettledBoundary(lines: string[]): { boundary: number; openFence: boolean } {
	let inFence = false
	let fenceMarker = ''
	let lastBoundary = -1
	let boundaryBeforeFence = -1

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const fenceMatch = line.match(FENCE_OPEN)
		if (inFence) {
			if (
				fenceMatch &&
				fenceMatch[1][0] === fenceMarker[0] &&
				fenceMatch[1].length >= fenceMarker.length
			) {
				inFence = false
				fenceMarker = ''
			}

			continue
		}

		if (fenceMatch) {
			inFence = true
			fenceMarker = fenceMatch[1]
			boundaryBeforeFence = lastBoundary
			continue
		}

		if (line.trim() === '' && i > 0 && i < lines.length - 1) {
			lastBoundary = i
		}
	}

	return { boundary: inFence ? boundaryBeforeFence : lastBoundary, openFence: inFence }
}

/**
 * Strip trailing incomplete inline syntax from the last line so half-typed
 * constructs don't render as literal markup: an unclosed `[`/`![` (link or
 * image), a trailing unclosed backtick run, and unpaired `*`/`_` emphasis
 * markers. Mid-line unclosed emphasis is auto-closed instead of trimmed, so
 * `**partial` renders bold immediately rather than flashing raw asterisks.
 */
export function trimStreamingArtifacts(input: string): string {
	const lastNL = input.lastIndexOf('\n')
	const prefix = lastNL === -1 ? '' : input.slice(0, lastNL + 1)
	let tail = lastNL === -1 ? input : input.slice(lastNL + 1)

	// Unclosed link/image opener: `[text` / `[text](href` / `![alt` with no
	// complete `](...)` after it.
	const lastBracket = tail.lastIndexOf('[')
	if (lastBracket !== -1) {
		const after = tail.slice(lastBracket)
		const closed = after.includes('](') && after.includes(')')
		if (!closed) {
			const trimTo =
				lastBracket > 0 && tail[lastBracket - 1] === '!' ? lastBracket - 1 : lastBracket

			tail = tail.slice(0, trimTo)
		}
	}

	// Trailing unclosed backtick run (e.g. "`", "```" while typing a fence or
	// inline code) — hidden until the content or closer arrives. A line of
	// only backticks is an opener being typed and withholds whole.
	let end = tail.length
	while (end > 0 && tail[end - 1] === '`') {
		end--
	}

	if (end === 0 && tail.length > 0) {
		tail = ''
	} else if (end < tail.length) {
		const ticks = tail.length - end
		const opener = tail.lastIndexOf('`'.repeat(ticks), end - 1)
		if (opener === -1) {
			tail = tail.slice(0, end)
		}
	}

	// Unpaired emphasis markers (*, **, *** / _, __, ___): paired markers keep
	// their content; a lone trailing marker is trimmed; an unpaired opener
	// with content after it is auto-closed so it formats while streaming.
	{
		const markers: { pos: number; len: number }[] = []
		let scan = 0
		while (scan < tail.length) {
			const idx1 = tail.indexOf('*', scan)
			const idx2 = tail.indexOf('_', scan)
			const idx = idx1 === -1 ? idx2 : idx2 === -1 ? idx1 : Math.min(idx1, idx2)
			if (idx === -1) {
				break
			}

			const ch = tail[idx]
			let len = 0
			while (tail[idx + len] === ch) {len++}
			scan = idx + len
			if (len > 3) {
				continue
			}

			// Underscore markers adjacent to letters are intraword — literal.
			if (ch === '_' && idx > 0 && /[\p{L}\p{N}]/u.test(tail[idx - 1])) {
				continue
			}

			markers.push({ pos: idx, len })
		}

		// Pair markers of the same kind greedily, left to right.
		const paired = new Set<number>()
		for (let a = 0; a < markers.length; a++) {
			if (paired.has(a)) {
				continue
			}

			for (let b = a + 1; b < markers.length; b++) {
				if (
					!paired.has(b) &&
					markers[b].len === markers[a].len &&
					tail[markers[b].pos] === tail[markers[a].pos]
				) {
					paired.add(a)
					paired.add(b)
					break
				}
			}
		}

		// Close unpaired openers (reverse order so closes nest correctly);
		// a marker at the very end with nothing after it is trimmed instead.
		for (let k = markers.length - 1; k >= 0; k--) {
			if (paired.has(k)) {
				continue
			}

			const m = markers[k]
			if (m.pos + m.len < tail.length) {
				tail += tail[m.pos].repeat(m.len)
			} else {
				tail = tail.slice(0, m.pos)
			}
		}
	}

	return prefix + tail
}

/**
 * Withhold trailing lines in the unsettled zone that look like the start of
 * a block but are incomplete: bare list markers (`- `, `1. `) with no item
 * text and trailing empty lines. Skipped entirely while a code fence is
 * open — inside a fence a `- ` is literal code.
 */
function trimUnsettledStructural(text: string): string {
	const lines = text.split('\n')
	while (lines.length > 0) {
		const last = lines[lines.length - 1]
		if (last.trim() === '') {
			lines.pop()
			continue
		}

		if (/^ {0,9}[-*+] ?$/.test(last) || /^ {0,9}\d+[.)] ?$/.test(last)) {
			lines.pop()
			continue
		}

		// Bare quote/heading markers — the markup precursor, not yet content.
		if (/^ {0,3}> ?$/.test(last) || /^ {0,3}#{1,6} ?$/.test(last)) {
			lines.pop()
			continue
		}

		break
	}

	return lines.join('\n')
}

/**
 * Parse one cumulative snapshot of a streaming Markdown doc. Settled
 * blocks (everything before the last safe blank line) parse once and are
 * shared by reference between calls; only the open tail reparses. Incomplete
 * trailing constructs are withheld or auto-closed, so intermediate output
 * shows no raw markup — and once the input stops growing, the result equals
 * `parseMdNodes` on the final text.
 *
 * Non-append input (a different doc, an edit) resets the cache and
 * reparses whole.
 */
export function parseMarkdownIncremental(input: string, state: MarkdownIncrementalState): MdNode[] {
	if (input === state.input) {
		return state.output
	}

	if (!input.startsWith(state.settledSource)) {
		state.settledSource = ''
		state.settled = []
		state.marks = []
	}

	// Incomplete trailing constructs withheld before boundary detection — the
	// trimmed text is always on the last line, never in the settled prefix.
	const trimmedInput = trimStreamingArtifacts(input)
	const tailRaw = trimmedInput.slice(state.settledSource.length)
	const tailLines = tailRaw.split('\n')
	const { boundary, openFence } = findSettledBoundary(tailLines)

	const settledDelta = boundary >= 0 ? tailLines.slice(0, boundary).join('\n') : ''
	if (settledDelta !== '') {
		const { nodes, listMarks } = parseMdNodesMarked(settledDelta)
		// A loose list split across the boundary merges with the previous
		// settled list — same rule the full parse applies.
		const last = state.settled[state.settled.length - 1]
		const first = nodes[0]
		if (
			last?.t === 'list' &&
			first?.t === 'list' &&
			last.ordered === first.ordered &&
			state.marks[state.marks.length - 1] === listMarks[0]
		) {
			state.settled[state.settled.length - 1] = {
				t: 'list',
				ordered: last.ordered,
				items: [...last.items, ...first.items],
			}

			state.settled.push(...nodes.slice(1))
			state.marks.push(...listMarks.slice(1))
		} else {
			state.settled.push(...nodes)
			state.marks.push(...listMarks)
		}

		state.settledSource += settledDelta
	}

	const unsettledRaw = trimmedInput.slice(state.settledSource.length).trim()
	const unsettled = openFence ? unsettledRaw : trimUnsettledStructural(unsettledRaw)
	const parsed =
		unsettled === ''
			? { nodes: [] as MdNode[], listMarks: [] as (string | undefined)[] }
			: parseMdNodesMarked(unsettled)

	// The tail's first block is a continuation candidate too: a loose list
	// still growing across the settled seam merges in the returned snapshot
	// (without mutating the cached settled array).
	const last = state.settled[state.settled.length - 1]
	const first = parsed.nodes[0]
	if (
		last?.t === 'list' &&
		first?.t === 'list' &&
		last.ordered === first.ordered &&
		state.marks[state.marks.length - 1] === parsed.listMarks[0]
	) {
		state.output = [
			...state.settled.slice(0, -1),
			{ t: 'list', ordered: last.ordered, items: [...last.items, ...first.items] },
			...parsed.nodes.slice(1),
		]
	} else {
		state.output = [...state.settled, ...parsed.nodes]
	}

	state.input = input
	return state.output
}

// ---------------------------------------------------------------------------
// Fade-in segmentation — boundary tracking over rendered text length
// ---------------------------------------------------------------------------

/** One piece of a text run split at stream boundaries. `key` is stable for
 *  the segment's lifetime so the fade span mounts once; `fading` marks
 *  segments that arrived after the oldest tracked boundary. */
export interface MdTextSegment {
	key: string
	text: string
	fading: boolean
}

/**
 * Push the previous rendered length onto the boundary ring when output grew.
 * The ring caps at `maxSpans`; evicted boundaries merge into settled text.
 */
export function computeBoundaries(
	prevBoundaries: number[],
	prevRenderedLen: number,
	maxSpans: number,
): number[] {
	if (prevBoundaries.length === 0 || prevRenderedLen > prevBoundaries[prevBoundaries.length - 1]) {
		const next = [...prevBoundaries, prevRenderedLen]
		while (next.length > maxSpans) {
			next.shift()
		}

		return next
	}

	return prevBoundaries
}

/**
 * Split one text run at the stream boundaries it crosses. Returns null when
 * the whole run is settled (no splitting needed). Segment keys never change
 * once created — `settled-{nodeKey}` for pre-boundary text and
 * `fade-{nodeKey}-b{offset}` per boundary span — so a fading span stays
 * mounted until it merges into the settled segment.
 */
export function computeSegments(
	content: string,
	startOffset: number,
	boundaries: number[],
	nodeKey: string | number,
): MdTextSegment[] | null {
	const endOffset = startOffset + content.length
	if (boundaries.length === 0 || endOffset <= boundaries[0]) {
		return null
	}

	const segments: MdTextSegment[] = []
	let pos = startOffset

	if (pos < boundaries[0]) {
		segments.push({
			key: `settled-${nodeKey}`,
			text: content.slice(0, boundaries[0] - startOffset),
			fading: false,
		})

		pos = boundaries[0]
	}

	for (let i = 0; i < boundaries.length; i++) {
		const bStart = boundaries[i]
		const bEnd = i + 1 < boundaries.length ? boundaries[i + 1] : endOffset
		if (bStart >= endOffset || bEnd <= pos) {
			continue
		}

		const lo = Math.max(bStart, pos)
		const hi = Math.min(bEnd, endOffset)
		if (lo >= hi) {
			continue
		}

		segments.push({
			key: `fade-${nodeKey}-b${bStart}`,
			text: content.slice(lo - startOffset, hi - startOffset),
			fading: true,
		})

		pos = hi
	}

	return segments.length > 0 ? segments : null
}

/** Total rendered text length of a node list — the cursor metric fade
 *  boundaries are computed against. */
export function markdownTextLength(nodes: MdNode[]): number {
	let n = 0
	for (const node of nodes) {
		switch (node.t) {
			case 'h':
			case 'p':
			case 'quote':
				n += mdInlineLen(node.children)
				break
			case 'code':
				n += node.text.length
				break
			case 'list':
				for (const item of node.items) {
					n += mdInlineLen(item)
				}

				break
			default:
				break
		}
	}

	return n
}
