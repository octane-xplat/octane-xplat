// Minimal block-level markdown → render model. Paragraph-inline styling is
// split into spans (mono/bold); block kinds map to our primitives in md.tsrx.
export type Span = {
	text: string
	mono?: boolean
	bold?: boolean
	italic?: boolean
	strike?: boolean
	href?: string
}

export type Block =
	| { kind: 'h'; level: number; text: string }
	| { kind: 'p'; spans: Span[] }
	| { kind: 'code'; text: string; lang: string }
	| { kind: 'li'; spans: Span[]; depth: number; marker: string }
	| { kind: 'quote'; spans: Span[] }
	| { kind: 'callout'; level: string; lines: Span[][] }
	| { kind: 'table'; rows: string[][] }
	| { kind: 'hr' }

// One pass, earliest token wins: `code`, **bold**, *italic*, ~~strike~~,
// [link](href). Recursing into link text lets [`code`](x) render as a mono
// link; recursing into bold lets **[link](x)** stay bold — and lets
// `**a *b* c**` nest italic inside bold. Code wins at equal index so
// `[x](y)` inside backticks stays literal. Bold's interior may carry lone
// `*` (`**x.*.y**`); italic refuses `*` adjacency on both ends and can't
// start with whitespace, so `* ` bullets, `2*` star-columns, and glob `*`
// followed by space stay literal.
export function inlineSpans(text: string): Span[] {
	const spans: Span[] = []
	const re =
		/(`[^`]*`)|(\*\*(?:[^*]|\*[^*])+\*\*)|((?<!\*)\*(?!\*)[^*\s][^*]*\*(?!\*))|(~~[^~\s][^~]*~~)|(\[[^\]]+\]\([^)\s]+\))/g

	let last = 0
	for (const m of text.matchAll(re)) {
		if (m.index > last) {
			spans.push({ text: text.slice(last, m.index) })
		}

		const tok = m[0]
		if (tok.startsWith('`')) {
			spans.push({ text: tok.slice(1, -1), mono: true })
		} else if (tok.startsWith('**')) {
			for (const s of inlineSpans(tok.slice(2, -2))) {
				spans.push({ ...s, bold: true })
			}
		} else if (tok.startsWith('*')) {
			for (const s of inlineSpans(tok.slice(1, -1))) {
				spans.push({ ...s, italic: true })
			}
		} else if (tok.startsWith('~~')) {
			for (const s of inlineSpans(tok.slice(2, -2))) {
				spans.push({ ...s, strike: true })
			}
		} else {
			const lm = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(tok)!
			for (const s of inlineSpans(lm[1])) {
				spans.push({ ...s, href: lm[2] })
			}
		}

		last = m.index + m[0].length
	}

	if (last < text.length) {
		spans.push({ text: text.slice(last) })
	}

	return spans
}

const CALLOUTS = new Set(['note', 'tip', 'important', 'warning', 'caution'])

// The first quote block of each owned-problem doc ends with a status paragraph
// (`**Owns:** #n …`) for contributors. It's process tracking, not reader
// content — the sidebar's notes group owns that layer — so we drop it here.
const METAPARA = /^\*\*(Owns|Status):\*\*/

// A line that starts a block — must mirror the branch tests exactly: a
// false positive (e.g. `**bold**` at line start matching `[-*]`) starves the
// paragraph collector and loops forever.
const BLOCKSTART = /^#{1,4}\s|^\s*(?:[-*]|\d+[.)])\s|^\s*\||^\s*>|^\s*```|^\s*(-{3,}|\*{3,})\s*$/

export function parseMd(md: string): Block[] {
	const blocks: Block[] = []
	const lines = md.split('\n')
	let i = 0
	let seenQuote = false
	while (i < lines.length) {
		const line = lines[i]

		if (line.trim().startsWith('```')) {
			const lang = line.trim().slice(3).trim()
			const buf: string[] = []
			while (++i < lines.length && !lines[i].trim().startsWith('```')) {
				buf.push(lines[i])
			}

			i++
			blocks.push({ kind: 'code', text: buf.join('\n').replace(/\n$/, ''), lang })
			continue
		}

		if (/^#{1,4}\s/.test(line)) {
			const m = line.match(/^(#+)\s+(.*)/)!
			blocks.push({ kind: 'h', level: m[1].length, text: m[2].replace(/[`*_]/g, '') })
			i++
			continue
		}

		if (/^\s*\|.*\|\s*$/.test(line)) {
			const rows: string[][] = []
			while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
				if (!/^\s*\|[\s:|-]+\|\s*$/.test(lines[i])) {
					rows.push(
						lines[i]
							.split('|')
							.slice(1, -1)
							.map((c) => c.trim()),
					)
				}

				i++
			}

			blocks.push({ kind: 'table', rows })
			continue
		}

		if (/^\s*(?:[-*]|\d+[.)])\s+/.test(line)) {
			const m = line.match(/^(\s*)([-*]|\d+[.)])\s+(.*)/)!
			const parts = [m[3]]
			// Soft-wrapped continuation: indented lines that don't start a new
			// block join the item (nested items have their own marker).
			while (i + 1 < lines.length) {
				const nx = lines[i + 1]
				if (!/^\s{2,}\S/.test(nx)) {
					break
				}

				if (/^\s*(?:[-*]|\d+[.)])\s|^\s*[>#]\s|^\s*`{3}|^\s*\|/.test(nx)) {
					break
				}

				parts.push(nx.trim())
				i++
			}

			blocks.push({
				kind: 'li',
				depth: Math.floor(m[1].length / 2),
				marker: /^\d/.test(m[2]) ? m[2] : '•',
				spans: inlineSpans(parts.join(' ')),
			})

			i++
			continue
		}

		if (/^\s*>\s?/.test(line)) {
			const buf: string[] = []
			while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
				buf.push(lines[i++].replace(/^\s*>\s?/, ''))
			}

			const cm = buf[0]?.match(/^\[!(\w+)\]\s*(.*)/)
			if (cm && CALLOUTS.has(cm[1].toLowerCase())) {
				const lines = [cm[2], ...buf.slice(1)]
					.map((l) => l.trim())
					.filter(Boolean)
					.map(inlineSpans)

				blocks.push({ kind: 'callout', level: cm[1].toLowerCase(), lines })
			} else {
				let body = buf
				if (!seenQuote) {
					// paragraphs split on blank `>` lines; drop status-metadata paras
					const paras: string[][] = [[]]
					for (const l of buf) {
						if (l.trim() === '') {
							paras.push([])
						} else {
							paras[paras.length - 1].push(l)
						}
					}

					body = paras.filter((p) => p.length && !METAPARA.test(p[0].trim())).flat()
				}

				blocks.push({ kind: 'quote', spans: inlineSpans(body.join(' ')) })
			}

			seenQuote = true
			i++
			continue
		}

		if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
			blocks.push({ kind: 'hr' })
			i++
			continue
		}

		if (line.trim() === '') {
			i++
			continue
		}

		const buf: string[] = []
		while (i < lines.length && lines[i].trim() !== '' && !BLOCKSTART.test(lines[i])) {
			buf.push(lines[i])
			i++
		}

		if (buf.length) {
			blocks.push({ kind: 'p', spans: inlineSpans(buf.join(' ')) })
		}
	}

	return blocks
}
