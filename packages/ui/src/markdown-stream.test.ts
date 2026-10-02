import { describe, expect, it } from 'vitest'
import { parseMdNodes } from './markdown-parse'
import {
	computeBoundaries,
	computeSegments,
	createMarkdownIncrementalState,
	parseMarkdownIncremental,
	trimStreamingArtifacts,
} from './markdown-stream'

import type { MdNode } from './props'

const DOC = [
	'# Release notes',
	'',
	'Intro **bold** and `code` and [a link](https://x.dev).',
	'',
	'- one',
	'- two',
	'',
	'```ts',
	'const x = 1',
	'```',
	'',
	'> quote line',
	'',
	'---',
	'',
	'Tail para with *em* text.',
].join('\n')

/** Feed `doc` to the incremental parser one character at a time; return the
 *  array of per-chunk outputs. */
function streamByChar(doc: string) {
	const state = createMarkdownIncrementalState()
	const outputs: MdNode[][] = []
	for (let i = 1; i <= doc.length; i++) {
		outputs.push(parseMarkdownIncremental(doc.slice(0, i), state))
	}

	return outputs
}

const text = (nodes: MdNode[]): string =>
	nodes
		.map((n) => {
			switch (n.t) {
				case 'code':
					return n.text
				case 'list':
					return n.items.map((i) => i.map((s) => ('text' in s ? s.text : '')).join('')).join('|')
				default:
					return n.children.map((s) => ('text' in s ? s.text : '')).join('')
			}
		})
		.join('\n')

describe('parseMdNodes', () => {
	it('parses the block grammar into the codegen AST shape', () => {
		expect(parseMdNodes(DOC)).toEqual([
			{ t: 'h', depth: 1, children: [{ t: 'text', text: 'Release notes' }] },
			{
				t: 'p',
				children: [
					{ t: 'text', text: 'Intro ' },
					{ t: 'bold', children: [{ t: 'text', text: 'bold' }] },
					{ t: 'text', text: ' and ' },
					{ t: 'code', text: 'code' },
					{ t: 'text', text: ' and ' },
					{ t: 'link', text: 'a link', href: 'https://x.dev' },
					{ t: 'text', text: '.' },
				],
			},
			{
				t: 'list',
				ordered: false,
				items: [[{ t: 'text', text: 'one' }], [{ t: 'text', text: 'two' }]],
			},
			{ t: 'code', lang: 'ts', text: 'const x = 1' },
			{ t: 'quote', children: [{ t: 'text', text: 'quote line' }] },
			{ t: 'hr' },
			{
				t: 'p',
				children: [
					{ t: 'text', text: 'Tail para with ' },
					{ t: 'em', children: [{ t: 'text', text: 'em' }] },
					{ t: 'text', text: ' text.' },
				],
			},
		])
	})

	it('merges blank-separated items of the same mark into one loose list', () => {
		expect(parseMdNodes('- a\n\n- b')).toEqual([
			{
				t: 'list',
				ordered: false,
				items: [[{ t: 'text', text: 'a' }], [{ t: 'text', text: 'b' }]],
			},
		])

		expect(parseMdNodes('1. a\n\n2. b')[0]).toMatchObject({
			t: 'list',
			ordered: true,
			items: expect.arrayContaining([expect.anything(), expect.anything()]),
		})

		// different bullet starts a new list
		expect(parseMdNodes('- a\n\n+ b').map((n) => n.t)).toEqual(['list', 'list'])
	})

	it('treats a setext underline as a heading and an unclosed fence as running to EOF', () => {
		expect(parseMdNodes('foo\n---')).toEqual([
			{ t: 'h', depth: 2, children: [{ t: 'text', text: 'foo' }] },
		])

		expect(parseMdNodes('```js\nx()')).toEqual([{ t: 'code', lang: 'js', text: 'x()' }])
	})
})

describe('parseMarkdownIncremental', () => {
	it('converges to the full parse when the doc stops growing', () => {
		const outputs = streamByChar(DOC)
		const last = outputs[outputs.length - 1]
		expect(last).toEqual(parseMdNodes(DOC))
	})

	it('converges for a doc ending in constructs that stream mid-token', () => {
		for (const tail of [
			'**bold',
			'`cod',
			'[a](https://x',
			'- item',
			'```ts\ncode',
			'> quote',
			'1. item',
			'text\n---',
		]) {
			const doc = 'Settled para.\n\n' + tail
			const outputs = streamByChar(doc)
			// A trailing incomplete construct is withheld while streaming, so
			// compare against the trimmed input's full parse.
			expect(outputs[outputs.length - 1], `doc tail ${JSON.stringify(tail)}`).toEqual(
				parseMdNodes(trimStreamingArtifacts(doc)),
			)
		}
	})

	it('never reparses settled blocks — references stay identical across calls', () => {
		const state = createMarkdownIncrementalState()
		const first = parseMarkdownIncremental('# Title\n\nfirst para\n\n', state)
		const para = first.find((n) => n.t === 'p')
		const second = parseMarkdownIncremental('# Title\n\nfirst para\n\nsecond para\n\n', state)
		const third = parseMarkdownIncremental('# Title\n\nfirst para\n\nsecond para\n\nthird', state)
		expect(second[1]).toBe(para)
		expect(third[1]).toBe(para)
		expect(third[0]).toBe(first[0])
	})

	it('returns the same array for an identical snapshot', () => {
		const state = createMarkdownIncrementalState()
		const a = parseMarkdownIncremental('hello **wor', state)
		expect(parseMarkdownIncremental('hello **wor', state)).toBe(a)
	})

	it('resets when input is replaced rather than appended', () => {
		const state = createMarkdownIncrementalState()
		parseMarkdownIncremental('aaa\n\nbbb\n\n', state)
		const out = parseMarkdownIncremental('zzz different\n\n', state)
		expect(out).toEqual(parseMdNodes('zzz different\n\n'))
	})

	it('withholds a bare list marker until item text arrives', () => {
		const state = createMarkdownIncrementalState()
		expect(parseMarkdownIncremental('intro\n\n- ', state).map((n) => n.t)).toEqual(['p'])
		expect(parseMarkdownIncremental('intro\n\n- item', state).map((n) => n.t)).toEqual([
			'p',
			'list',
		])
	})

	it('withholds a half-typed link instead of flashing literal brackets', () => {
		const state = createMarkdownIncrementalState()
		const mid = parseMarkdownIncremental('see [the doc', state)
		expect(text(mid)).not.toContain('[')
		const done = parseMarkdownIncremental('see [the doc](https://x.dev)', state)
		expect(done[0]).toMatchObject({ t: 'p' })
		expect(JSON.stringify(done)).toContain('"t":"link"')
	})

	it('auto-closes mid-line emphasis so it formats while streaming', () => {
		const state = createMarkdownIncrementalState()
		const mid = parseMarkdownIncremental('a **bo', state)
		expect(mid[0]).toMatchObject({
			t: 'p',
			children: [{ t: 'text', text: 'a ' }, { t: 'bold' }],
		})
	})

	it('shows an open code fence as a growing code block, not literal backticks', () => {
		const state = createMarkdownIncrementalState()
		expect(parseMarkdownIncremental('before\n\n```ts\ncons', state).map((n) => n.t)).toEqual([
			'p',
			'code',
		])

		const later = parseMarkdownIncremental('before\n\n```ts\nconst x = 1\n```', state)
		expect(later[1]).toMatchObject({ t: 'code', lang: 'ts', text: 'const x = 1' })
	})

	it('merges a loose list split across the settled boundary', () => {
		const state = createMarkdownIncrementalState()
		parseMarkdownIncremental('- a\n\n', state)
		const out = parseMarkdownIncremental('- a\n\n- b\n\n', state)
		expect(out).toEqual(parseMdNodes('- a\n\n- b\n\n'))
		expect(out).toHaveLength(1)
		expect((out[0] as { items: unknown[] }).items).toHaveLength(2)
	})
})

describe('trimStreamingArtifacts', () => {
	it('trims an unclosed link opener on the last line only', () => {
		expect(trimStreamingArtifacts('done [ok](x)\nopen [part')).toBe('done [ok](x)\nopen ')
		expect(trimStreamingArtifacts('done [ok](x)')).toBe('done [ok](x)')
	})

	it('trims a trailing unclosed backtick run', () => {
		expect(trimStreamingArtifacts('plain text `')).toBe('plain text ')
		// Whole-line fence opener being typed is withheld entirely.
		expect(trimStreamingArtifacts('para\n```')).toBe('para\n')
	})

	it('auto-closes unpaired emphasis with content', () => {
		expect(trimStreamingArtifacts('a **bo')).toBe('a **bo**')
		expect(trimStreamingArtifacts('a *b')).toBe('a *b*')
	})

	it('trims a lone trailing emphasis marker', () => {
		expect(trimStreamingArtifacts('a **')).toBe('a ')
	})
})

describe('computeBoundaries/computeSegments', () => {
	it('pushes the previous length only when output grew', () => {
		let b = computeBoundaries([], 0, 4)
		expect(b).toEqual([0])
		const b2 = computeBoundaries(b, 10, 4)
		expect(b2).toEqual([0, 10])
		expect(computeBoundaries(b2, 10, 4)).toBe(b2)
		expect(computeBoundaries(b2, 40, 4)).toEqual([0, 10, 40])
	})

	it('caps the ring and settles evicted spans', () => {
		let b: number[] = []
		for (const len of [0, 3, 6, 9, 12]) {
			b = computeBoundaries(b, len, 3)
		}
		expect(b).toEqual([6, 9, 12])
	})

	it('splits a text run at the boundaries it crosses', () => {
		const segs = computeSegments('hello world', 5, [5, 8], 3)
		expect(segs).toEqual([
			{ key: 'fade-3-b5', text: 'hel', fading: true },
			{ key: 'fade-3-b8', text: 'lo world', fading: true },
		])

		// Fully settled text returns null.
		expect(computeSegments('old', 0, [5, 8], 0)).toBeNull()
		// Text straddling the oldest boundary splits settled/fading.
		const mixed = computeSegments('abcdef', 0, [3], 1)
		expect(mixed).toEqual([
			{ key: 'settled-1', text: 'abc', fading: false },
			{ key: 'fade-1-b3', text: 'def', fading: true },
		])
	})
})
