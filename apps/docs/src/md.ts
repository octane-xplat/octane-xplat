// Minimal block-level markdown → render model. Paragraph-inline styling is
// split into spans (mono/bold); block kinds map to our primitives in md.tsrx.
export type Span = { text: string; mono?: boolean; bold?: boolean; href?: string };
export type Block =
	| { kind: 'h'; level: number; text: string }
	| { kind: 'p'; spans: Span[] }
	| { kind: 'code'; text: string }
	| { kind: 'li'; spans: Span[]; depth: number }
	| { kind: 'quote'; spans: Span[] }
	| { kind: 'table'; rows: string[][] }
	| { kind: 'hr' };

// One pass, earliest token wins: `code`, **bold**, [link](href). Recursing
// into link text lets [`code`](x) render as a mono link; recursing into bold
// lets **[link](x)** stay bold. Code wins at equal index so `[x](y)` inside
// backticks stays literal.
export function inlineSpans(text: string): Span[] {
	const spans: Span[] = [];
	const re = /(`[^`]*`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)\s]+\))/g;
	let last = 0;
	for (const m of text.matchAll(re)) {
		if (m.index > last) spans.push({ text: text.slice(last, m.index) });
		const tok = m[0];
		if (tok.startsWith('`')) {
			spans.push({ text: tok.slice(1, -1), mono: true });
		} else if (tok.startsWith('**')) {
			for (const s of inlineSpans(tok.slice(2, -2))) spans.push({ ...s, bold: true });
		} else {
			const lm = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(tok)!;
			for (const s of inlineSpans(lm[1])) spans.push({ ...s, href: lm[2] });
		}
		last = m.index + m[0].length;
	}
	if (last < text.length) spans.push({ text: text.slice(last) });
	return spans;
}

// A line that starts a block — must mirror the branch tests exactly: a
// false positive here (e.g. `**bold**` at line start matching `[-*]`) starves
// the paragraph collector and loops forever.
const BLOCKSTART = /^#{1,4}\s|^\s*[-*]\s|^\s*\||^\s*>|^\s*```|^\s*(-{3,}|\*{3,})\s*$/;

export function parseMd(md: string): Block[] {
	const blocks: Block[] = [];
	const lines = md.split('\n');
	let i = 0;
	while (i < lines.length) {
		const line = lines[i];

		if (line.trim().startsWith('```')) {
			const buf: string[] = [];
			while (++i < lines.length && !lines[i].trim().startsWith('```')) buf.push(lines[i]);
			i++;
			blocks.push({ kind: 'code', text: buf.join('\n').replace(/\n$/, '') });
			continue;
		}
		if (/^#{1,4}\s/.test(line)) {
			const m = line.match(/^(#+)\s+(.*)/)!;
			blocks.push({ kind: 'h', level: m[1].length, text: m[2].replace(/[`*_]/g, '') });
			i++;
			continue;
		}
		if (/^\s*\|.*\|\s*$/.test(line)) {
			const rows: string[][] = [];
			while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
				if (!/^\s*\|[\s:|-]+\|\s*$/.test(lines[i])) {
					rows.push(lines[i].split('|').slice(1, -1).map((c) => c.trim()));
				}
				i++;
			}
			blocks.push({ kind: 'table', rows });
			continue;
		}
		if (/^\s*[-*]\s/.test(line)) {
			const m = line.match(/^(\s*)[-*]\s+(.*)/)!;
			blocks.push({ kind: 'li', depth: Math.floor(m[1].length / 2), spans: inlineSpans(m[2]) });
			i++;
			continue;
		}
		if (/^\s*>\s?/.test(line)) {
			const buf: string[] = [];
			while (i < lines.length && /^\s*>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ''));
			blocks.push({ kind: 'quote', spans: inlineSpans(buf.join(' ')) });
			i++;
			continue;
		}
		if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { blocks.push({ kind: 'hr' }); i++; continue; }
		if (line.trim() === '') { i++; continue; }

		const buf: string[] = [];
		while (i < lines.length && lines[i].trim() !== '' && !BLOCKSTART.test(lines[i])) {
			buf.push(lines[i]);
			i++;
		}
		if (buf.length) blocks.push({ kind: 'p', spans: inlineSpans(buf.join(' ')) });
	}
	return blocks;
}
