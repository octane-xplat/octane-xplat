// Cmd-K palette index — built lazily on first query from the markdown corpus
// docs.ts already bundles (eager import.meta.glob). Reuses parseMd, the same
// pipeline the page renderer uses, so heading anchors and inline-code symbols
// match what's on screen. Three hit kinds: api symbols (mono spans + fenced
// calls), pages (titles + headings), body excerpts.

import { DOCS, type DocPage } from './docs';
import { inlineSpans, parseMd, type Span } from './md';

export interface SearchHit {
	kind: 'api' | 'page' | 'body';
	slug: string;
	/** symbol, page title, or section heading */
	label: string;
	/** "Doc title › Section" trail */
	context?: string;
	anchor?: string;
	snippet?: string;
	score: number;
}

interface Section {
	heading: string;
	anchor?: string;
	text: string;
	lower: string;
}

interface Symbol {
	name: string;
	key: string;
	anchor?: string;
	context: string;
}

interface DocIndex {
	doc: DocPage;
	headings: { text: string; id: string }[];
	symbols: Symbol[];
	sections: Section[];
}

// Inline `code` spans that read as API names: pushRoute, router.get(), signal$.
const IDENT = /^[A-Za-z_$][\w$]*(?:\.[\w$]+)*\(\)?$/;
// Calls inside fenced code: identifier (optionally dotted) followed by `(`.
const CALL = /\b[A-Za-z_$][\w$]*(?:\.[\w$]+)*\(/g;
const KEYWORDS = new Set([
	'if', 'for', 'while', 'switch', 'catch', 'return', 'function', 'import',
	'export', 'new', 'typeof', 'else', 'do', 'await', 'yield', 'delete',
	'void', 'in', 'of', 'instanceof',
]);

const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9$.]/g, '');

function indexDoc(doc: DocPage): DocIndex {
	const headings: DocIndex['headings'] = [];
	const sections: Section[] = [];
	const symbols = new Map<string, Symbol>();

	let heading = doc.title;
	let anchor: string | undefined;
	let parts: string[] = [];

	const flush = () => {
		const text = parts.join(' ').replace(/\s+/g, ' ').trim();
		if (text) {
			sections.push({ heading, anchor, text, lower: text.toLowerCase() });
		}

		parts = [];
	};

	const addSymbol = (name: string) => {
		const k = key(name);
		if (k.length < 2 || KEYWORDS.has(k) || symbols.has(k)) {
			return;
		}

		symbols.set(k, { name, key: k, anchor, context: heading });
	};

	const addSpans = (spans: Span[]) => {
		parts.push(spans.map((s) => s.text).join(' '));
		for (const s of spans) {
			if (s.mono && IDENT.test(s.text)) {
				addSymbol(s.text);
			}
		}
	};

	for (const b of parseMd(doc.md)) {
		if (b.kind === 'h') {
			flush();
			// the h1 restates the page title — the title hit already covers it
			if (b.level > 1) {
				headings.push({ text: b.text, id: b.id });
			}

			heading = b.text;
			anchor = b.id;
		} else if (b.kind === 'code') {
			for (const m of b.text.matchAll(CALL)) {
				addSymbol(m[0].slice(0, -1) + '()');
			}
		} else if (b.kind === 'callout') {
			for (const line of b.lines) {
				addSpans(line);
			}
		} else if (b.kind === 'table') {
			for (const cell of b.rows.flat()) {
				addSpans(inlineSpans(cell));
			}
		} else if (b.kind === 'p' || b.kind === 'li' || b.kind === 'quote') {
			addSpans(b.spans);
		}
	}

	flush();
	return { doc, headings, symbols: [...symbols.values()], sections };
}

let INDEX: DocIndex[] | null = null;
const index = () => (INDEX ??= DOCS.map(indexDoc));

// Exact → prefix → substring (earlier is better) → all-terms → subsequence.
function textScore(q: string, terms: string[], text: string): number | null {
	const t = text.toLowerCase();
	if (t === q) {
		return 1;
	}

	if (t.startsWith(q)) {
		return 0.85;
	}

	const at = t.indexOf(q);
	if (at !== -1) {
		return 0.7 - Math.min(at / t.length, 1) * 0.1;
	}

	if (terms.length > 1 && terms.every((x) => t.includes(x))) {
		return 0.55;
	}

	return fuzzy(q, t);
}

// Loose subsequence match, scored by how tightly the hits cluster.
function fuzzy(needle: string, hay: string): number | null {
	if (needle.length < 3) {
		return null;
	}

	let i = 0;
	let start = -1;
	let end = 0;
	for (const ch of needle) {
		const j = hay.indexOf(ch, i);
		if (j === -1) {
			return null;
		}

		if (start === -1) {
			start = j;
		}

		end = j;
		i = j + 1;
	}

	return 0.4 * (needle.length / (end - start + 1));
}

function snippet(s: Section, terms: string[]): string {
	let at = s.lower.length;
	for (const t of terms) {
		const i = s.lower.indexOf(t);
		if (i !== -1 && i < at) {
			at = i;
		}
	}

	if (at === s.lower.length) {
		at = 0;
	}

	const start = Math.max(0, at - 35);
	const end = Math.min(s.text.length, at + 85);
	return (start > 0 ? '… ' : '') + s.text.slice(start, end).trim() + (end < s.text.length ? ' …' : '');
}

const trail = (doc: DocPage, heading?: string) =>
	heading && heading !== doc.title ? `${doc.title} › ${heading}` : doc.title;

export function searchDocs(query: string): SearchHit[] {
	const q = query.trim().toLowerCase();
	if (!q) {
		return [];
	}

	const terms = q.split(/\s+/);
	const nq = key(query);

	const api: SearchHit[] = [];
	const pages: SearchHit[] = [];
	const body: SearchHit[] = [];

	for (const d of index()) {
		const { doc } = d;

		for (const s of d.symbols) {
			const sc =
				s.key === nq ? 1 :
				s.key.startsWith(nq) ? 0.85 :
				s.key.includes(nq) ? 0.7 :
				nq.length >= 3 ? fuzzy(nq, s.key) : null;

			if (sc !== null) {
				api.push({ kind: 'api', slug: doc.slug, label: s.name, context: trail(doc, s.context), anchor: s.anchor, score: sc });
			}
		}

		const ts = textScore(q, terms, doc.title);
		if (ts !== null) {
			pages.push({ kind: 'page', slug: doc.slug, label: doc.title, context: doc.group === 'notes' ? 'Note' : 'Guide', score: ts });
		}

		for (const h of d.headings) {
			const sc = textScore(q, terms, h.text);
			if (sc !== null) {
				pages.push({ kind: 'page', slug: doc.slug, label: h.text, context: doc.title, anchor: h.id, score: sc * 0.95 });
			}
		}

		let best: { s: Section; score: number } | null = null;
		for (const s of d.sections) {
			let sc: number | null = null;
			if (s.lower.includes(q)) {
				sc = 0.6;
			} else if (terms.length > 1 && terms.every((t) => s.lower.includes(t))) {
				sc = 0.45;
			}

			if (sc !== null && (best === null || sc > best.score)) {
				best = { s, score: sc };
			}
		}

		if (best) {
			body.push({
				kind: 'body', slug: doc.slug, label: best.s.heading, anchor: best.s.anchor,
				context: best.s.heading === doc.title ? undefined : trail(doc, best.s.heading),
				snippet: snippet(best.s, terms), score: best.score,
			});
		}
	}

	const byScore = (a: SearchHit, b: SearchHit) => b.score - a.score;
	api.sort(byScore);
	pages.sort(byScore);
	body.sort(byScore);
	return [...api.slice(0, 6), ...pages.slice(0, 8), ...body.slice(0, 6)];
}
