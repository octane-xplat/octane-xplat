// Runtime Markdown parser — emits the same `MdDoc`/`MdNode` AST that
// `xplat routes` codegen bakes from `marked` (packages/cli/src/markdown.mjs).
// The package ships no parser dependency, so this is a hand-written subset
// covering exactly what the AST can express: ATX and Setext headings,
// paragraphs, fenced code, flat ordered/unordered lists, blockquotes, and
// horizontal rules; inline code spans, bold, emphasis, links, and image alt
// text. Tables, HTML blocks, indented code, reference-style links, and
// nested block structure are intentionally not parsed — they fall through to
// literal text, matching the v1 AST's expressiveness.
//
// Line-level behavior matches `marked` on the covered constructs so runtime
// and baked output agree: unclosed fences run to EOF, blank-separated items
// of the same list kind merge into one loose list, and a setext underline
// promotes the preceding paragraph line(s) to a heading.

import type { MdDoc, MdInline, MdNode } from './props'

const FENCE = /^ {0,3}(`{3,}|~{3,})[ \t]*(.*)$/
const FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/
const ATX = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/
const SETEXT_H1 = /^ {0,3}=+[ \t]*$/
const SETEXT_H2 = /^ {0,3}-+[ \t]*$/
const HR = /^ {0,3}(?:\*[ \t]*){3,}$|^ {0,3}(?:-[ \t]*){3,}$|^ {0,3}(?:_[ \t]*){3,}$/
const QUOTE = /^ {0,3}>[ \t]?/
const ITEM = /^ {0,3}([-*+]|\d{1,9}[.)])([ \t]+)(.*)$/
const BLANK = /^\s*$/

/** A list's CommonMark continuation key: bullet character for unordered
 *  (`-`,`*`,`+`), delimiter for ordered (`.`,`)`). Items separated by blank
 *  lines stay in one list only while the mark matches. */
function listMark(m: RegExpMatchArray): string {
	return /^\d/.test(m[1]) ? m[1].slice(-1) : m[1]
}

/** Does this line start a new block? Mirrors the tests in parseBlocks — a
 *  missed case makes the paragraph collector swallow a block opener. */
function isBlockStart(line: string): boolean {
	return FENCE.test(line) || ATX.test(line) || HR.test(line) || QUOTE.test(line) || ITEM.test(line)
}

type ParsedBlocks = {
	nodes: MdNode[]
	/** Per-node list continuation key — set for `list` nodes, undefined for
	 *  the rest. Lets the incremental parser apply the same merge rule as a
	 *  full parse at its settled/delta seam. */
	marks: (string | undefined)[]
}

function parseBlocks(source: string): ParsedBlocks {
	const nodes: MdNode[] = []
	const marks: (string | undefined)[] = []
	const lines = source.split('\n')
	let i = 0

	while (i < lines.length) {
		const line = lines[i]

		if (BLANK.test(line)) {
			i++
			continue
		}

		const fence = line.match(FENCE)
		if (fence) {
			const marker = fence[1]
			const lang = fence[2].trim().split(/\s+/)[0] || undefined
			const buf: string[] = []
			i++
			// Unclosed fence runs to EOF — same as marked.
			while (i < lines.length) {
				const close = lines[i].match(FENCE_CLOSE)
				if (close && close[1][0] === marker[0] && close[1].length >= marker.length) {
					i++
					break
				}

				buf.push(lines[i])
				i++
			}

			nodes.push({ t: 'code', lang, text: buf.join('\n') })
			marks.push(undefined)
			continue
		}

		const heading = line.match(ATX)
		if (heading) {
			const text = (heading[2] ?? '').replace(/[ \t]+#+$/, '')
			nodes.push({
				t: 'h',
				depth: heading[1].length as 1 | 2 | 3 | 4 | 5 | 6,
				children: parseMdInline(text),
			})

			marks.push(undefined)
			i++
			continue
		}

		if (HR.test(line)) {
			nodes.push({ t: 'hr' })
			marks.push(undefined)
			i++
			continue
		}

		const firstItem = line.match(ITEM)
		if (firstItem) {
			const ordered = /^\d/.test(firstItem[1])
			const mark = listMark(firstItem)
			const items: MdInline[][] = []
			while (i < lines.length) {
				const it = lines[i].match(ITEM)
				if (!it || /^\d/.test(it[1]) !== ordered || listMark(it) !== mark) {
					break
				}

				const parts = [it[3]]
				i++
				// Indented continuation lines join the item unless they open a
				// nested construct (own marker, quote, fence) — those end it.
				while (
					i < lines.length &&
					/^ {2,}\S/.test(lines[i]) &&
					!isBlockStart(lines[i].trimStart())
				) {
					parts.push(lines[i].trim())
					i++
				}

				items.push(parseMdInline(parts.join('\n')))
				// A blank-separated item of the same kind continues the loose
				// list; anything else ends it. Rewind when not continuing.
				const save = i
				while (i < lines.length && BLANK.test(lines[i])) {
					i++
				}

				const next = i < lines.length ? lines[i].match(ITEM) : null
				if (!next || /^\d/.test(next[1]) !== ordered || listMark(next) !== mark) {
					i = save
					break
				}
			}

			nodes.push({ t: 'list', ordered, items })
			marks.push(mark)
			continue
		}

		if (QUOTE.test(line)) {
			const buf: string[] = []
			while (i < lines.length && QUOTE.test(lines[i])) {
				buf.push(lines[i].replace(QUOTE, ''))
				i++
			}

			nodes.push({ t: 'quote', children: parseMdInline(buf.join('\n')) })
			marks.push(undefined)
			continue
		}

		// Paragraph — gather until blank or a block opener. A setext underline
		// promotes the gathered line(s) to a heading.
		const buf: string[] = []
		while (i < lines.length && !BLANK.test(lines[i])) {
			const l = lines[i]
			// Setext underline only applies with paragraph text above it; a
			// bare `---`/`===` line on its own is literal paragraph text.
			if (buf.length > 0 && (SETEXT_H1.test(l) || SETEXT_H2.test(l))) {
				nodes.push({
					t: 'h',
					depth: SETEXT_H1.test(l) ? 1 : 2,
					children: parseMdInline(buf.join('\n')),
				})

				marks.push(undefined)
				buf.length = 0
				i++
				break
			}

			if (buf.length > 0 && isBlockStart(l)) {
				break
			}

			buf.push(l)
			i++
		}

		if (buf.length > 0) {
			nodes.push({ t: 'p', children: parseMdInline(buf.join('\n')) })
			marks.push(undefined)
		}
	}

	return { nodes, marks }
}

/** Parse Markdown source into the renderer's block AST. */
export function parseMdNodes(source: string): MdNode[] {
	return parseBlocks(source).nodes
}

/** Parse Markdown source into a `Markdown`-renderable doc — the runtime
 *  counterpart of the codegen's baked `MdDoc`. */
export function parseMdDoc(source: string): MdDoc {
	return { kind: 'octane-xplat/md', v: 1, children: parseMdNodes(source) }
}

/** Same parse as `parseMdNodes` plus per-node list continuation keys.
 *  Internal — the incremental parser needs marks to merge loose lists split
 *  across its settled/delta seam. */
export function parseMdNodesMarked(source: string): {
	nodes: MdNode[]
	listMarks: (string | undefined)[]
} {
	const { nodes, marks } = parseBlocks(source)
	return { nodes, listMarks: marks }
}

// ---------------------------------------------------------------------------
// Inline parsing
// ---------------------------------------------------------------------------

/** Flatten inline nodes to their visible text — the runtime counterpart of
 *  codegen's `inlineText` (link labels drop nested formatting). */
export function mdInlineText(nodes: MdInline[]): string {
	let out = ''
	for (const n of nodes) {
		switch (n.t) {
			case 'bold':
			case 'em':
				out += mdInlineText(n.children)
				break
			case 'link':
				out += n.text
				break
			default:
				out += n.text
		}
	}

	return out
}

/** Rendered length of an inline run — `mdInlineText` without allocating. */
export function mdInlineLen(nodes: MdInline[]): number {
	let n = 0
	for (const node of nodes) {
		switch (node.t) {
			case 'bold':
			case 'em':
				n += mdInlineLen(node.children)
				break
			default:
				n += node.text.length
		}
	}

	return n
}

const ESCAPABLE = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/

/** Unicode letter-or-number test for the intraword `_` rule. Unicode
 *  property escapes (`\\p{L}`, `\\p{N}`) need Unicode tables — a regex
 *  literal on an engine without them throws SyntaxError at parse time and
 *  poisons the whole bundle (this is how NativeScript's embedded V8
 *  ships). check-native-dist scans emitted comments too, so keep the
 *  double-backslash spelling here. Build the pattern dynamically instead:
 *  general categories where full Unicode exists, the spec-required minimal
 *  property set otherwise, ASCII as a last resort. */
export const WORD_CHAR: RegExp = (() => {
	for (const pattern of ['[\\p{L}\\p{N}]', '[\\p{ID_Start}\\p{ID_Continue}]']) {
		try {
			return new RegExp(pattern, 'u')
		} catch {}
	}

	return /[A-Za-z0-9]/
})()

/** Scan a run of `ch` starting at `i`. */
function runLen(text: string, i: number, ch: string): number {
	let n = 0
	while (text[i + n] === ch) {
		n++
	}

	return n
}

/** Find the closing index for a `len`-marker emphasis starting at `from`, or
 *  -1. `_`/`__` additionally refuses intraword matches (an alphanumeric on
 *  both sides), matching CommonMark's flanking rule loosely. */
function findEmClose(text: string, from: number, marker: string): number {
	const idx = text.indexOf(marker, from)
	return idx
}

export function parseMdInline(text: string): MdInline[] {
	const nodes: MdInline[] = []
	let buf = ''
	let i = 0

	const flush = () => {
		if (buf) {
			nodes.push({ t: 'text', text: buf })
			buf = ''
		}
	}

	while (i < text.length) {
		const ch = text[i]

		if (ch === '\\' && i + 1 < text.length && ESCAPABLE.test(text[i + 1])) {
			buf += text[i + 1]
			i += 2
			continue
		}

		if (ch === '`') {
			const n = runLen(text, i, '`')
			const close = text.indexOf('`'.repeat(n), i + n)
			if (close !== -1 && close > i + n) {
				flush()
				nodes.push({ t: 'code', text: text.slice(i + n, close) })
				i = close + n
				continue
			}

			buf += '`'.repeat(n)
			i += n
			continue
		}

		if (ch === '*' || ch === '_') {
			const n = runLen(text, i, ch)
			const marker = ch.repeat(n)
			// Underscore cannot open emphasis intraword (a_b_c stays literal).
			const wordBefore = i > 0 && WORD_CHAR.test(text[i - 1])
			if (ch === '_' && wordBefore) {
				buf += marker
				i += n
				continue
			}

			// Try the longest marker first (`***`/`___` bold+em, `**`/`__` bold,
			// `*`/`_` em), falling back to shorter runs for trailing extras.
			let matched = false
			for (let len = Math.min(n, 3); len >= 1 && !matched; len--) {
				const m = ch.repeat(len)
				const close = findEmClose(text, i + len, m)
				if (close === -1 || close === i + len) {
					continue
				}

				const inner = text.slice(i + len, close)
				flush()
				if (len === 3) {
					nodes.push({ t: 'bold', children: [{ t: 'em', children: parseMdInline(inner) }] })
				} else if (len === 2) {
					nodes.push({ t: 'bold', children: parseMdInline(inner) })
				} else {
					nodes.push({ t: 'em', children: parseMdInline(inner) })
				}

				matched = true
				i = close + len
			}

			if (matched) {
				continue
			}

			buf += marker
			i += n
			continue
		}

		if (ch === '!' && text[i + 1] === '[') {
			const mid = text.indexOf('](', i + 2)
			const close = mid === -1 ? -1 : text.indexOf(')', mid + 2)
			if (close !== -1) {
				flush()
				// Alt text only — the v1 AST has no image node (codegen parity).
				nodes.push({ t: 'text', text: text.slice(i + 2, mid) })
				i = close + 1
				continue
			}

			buf += ch
			i++
			continue
		}

		if (ch === '[') {
			const mid = text.indexOf('](', i + 1)
			const close = mid === -1 ? -1 : text.indexOf(')', mid + 2)
			if (close !== -1) {
				flush()
				nodes.push({
					t: 'link',
					text: mdInlineText(parseMdInline(text.slice(i + 1, mid))),
					href: text.slice(mid + 2, close),
				})

				i = close + 1
				continue
			}

			buf += ch
			i++
			continue
		}

		buf += ch
		i++
	}

	flush()
	return nodes
}
