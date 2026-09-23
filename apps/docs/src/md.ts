// Minimal block-level markdown → render model. Paragraph-inline styling is
// split into spans (mono/bold); block kinds map to our primitives in md.tsrx.
export type Span = { text: string; mono?: boolean; bold?: boolean };
export type Block =
	| { kind: 'h'; level: number; text: string }
	| { kind: 'p'; spans: Span[] }
	| { kind: 'code'; text: string }
	| { kind: 'li'; spans: Span[]; depth: number }
	| { kind: 'quote'; spans: Span[] }
	| { kind: 'table'; rows: string[][] }
	| { kind: 'hr' };

export function inlineSpans(text: string): Span[] {
	const spans: Span[] = [];
	for (const seg of text.split(/(`[^`]*`)/g)) {
		if (!seg) continue;
		if (seg.startsWith('`') && seg.endsWith('`')) {
			spans.push({ text: seg.slice(1, -1), mono: true });
			continue;
		}
		for (const sub of seg.split(/(\*\*[^*]+\*\*)/g)) {
			if (!sub) continue;
			spans.push(sub.startsWith('**') && sub.endsWith('**')
				? { text: sub.slice(2, -2), bold: true }
				: { text: sub });
		}
	}
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
