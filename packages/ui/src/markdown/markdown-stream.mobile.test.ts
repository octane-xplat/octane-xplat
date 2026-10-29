import { describe, expect, it } from 'vitest'
import { parseMdNodes } from './markdown-parse'
import { createMarkdownIncrementalState, parseMarkdownIncremental } from './markdown-stream'

// Native-renderer smoke for the DOM-free streaming parser — the full
// assertion suite lives in markdown-stream.test.ts (web suite).
describe('markdown streaming (native renderer)', () => {
	it('incremental parse converges to the full parse under the native toolchain', () => {
		const doc = '# T\n\npara **bold**\n\n- a\n- b\n\n```ts\nx()\n```\n'
		const state = createMarkdownIncrementalState()
		let out = []
		for (let i = 1; i <= doc.length; i++) {
			out = parseMarkdownIncremental(doc.slice(0, i), state)
		}

		expect(out).toEqual(parseMdNodes(doc))
	})

	it('withholds incomplete constructs identically under the native toolchain', () => {
		const state = createMarkdownIncrementalState()
		expect(parseMarkdownIncremental('intro\n\n- ', state).map((n) => n.t)).toEqual(['p'])
		expect(parseMarkdownIncremental('intro\n\n- item', state).map((n) => n.t)).toEqual([
			'p',
			'list',
		])
	})
})
