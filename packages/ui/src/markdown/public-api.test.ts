import { describe, expect, it } from 'vitest'
import {
	createMarkdownStreamParser,
	parseMdDoc,
	outlineFromDoc,
	tokenize,
	flatTokensToLines,
} from './shared'

describe('Markdown public parser', () => {
	it('returns readable documents and portable outlines while appending chunks', () => {
		const parser = createMarkdownStreamParser()
		const first = parser.append('# Hello\n\nBody\n\n')
		const next = parser.append('more **bold')
		expect(next.kind).toBe('octane-xplat/md')
		expect(next.v).toBe(1)
		expect(next.children[0]).toBe(first.children[0])
		expect(outlineFromDoc(next)).toEqual([{ id: 'hello', label: 'Hello', level: 1 }])
		expect(parser.append('')).toBe(next)
	})

	it.each(['unfinished [link', 'lone *', '```ts\nconst x = 1', '- a\n\n- b', '# 😀\n\ntext'])(
		'finishes exactly like a full parse: %s',
		(source) => {
			const parser = createMarkdownStreamParser()
			for (const chunk of source) {
				parser.append(chunk)
			}

			const final = parser.finish()
			expect(final).toEqual(parseMdDoc(source))
			expect(parser.finish()).toBe(final)
			expect(() => parser.append('more')).toThrow('reset')
		},
	)

	it('resets after finish and keeps independent streams isolated', () => {
		const a = createMarkdownStreamParser()
		const b = createMarkdownStreamParser()
		a.append('old')
		a.finish()
		expect(a.reset()).toEqual(parseMdDoc(''))
		a.append('new')
		b.append('other')
		expect(a.finish()).toEqual(parseMdDoc('new'))
		expect(b.finish()).toEqual(parseMdDoc('other'))
	})

	it('reports line-relative, half-open UTF-16 syntax offsets', () => {
		const code = '// 😀\nconst value = "😀"'
		const lines = tokenize(code, 'typescript')
		expect(lines[0]).toContainEqual({ type: 'comment', start: 0, end: 5 })
		expect(lines[1]).toContainEqual({ type: 'keyword', start: 0, end: 5 })
		for (const [index, tokens] of lines.entries()) {
			for (const token of tokens) {
				expect(code.split('\n')[index].slice(token.start, token.end)).not.toBe('')
			}
		}
	})
})

it('splits absolute custom tokens across newlines without out-of-line offsets', () => {
	expect(flatTokensToLines([{ type: 'comment', start: 0, end: 9 }], '/* a\nb */')).toEqual([
		[{ type: 'comment', start: 0, end: 4 }],
		[{ type: 'comment', start: 0, end: 4 }],
	])
})

it('clips built-in multiline matches to their current line', () => {
	const lines = tokenize('/* a\nb */', 'typescript')
	expect(lines[0]).toEqual([{ type: 'comment', start: 0, end: 4 }])
})
