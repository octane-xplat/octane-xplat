// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { expect, it } from 'vitest'
import { LexicalEditor } from '../../lexical/src/LexicalEditor.web.tsrx'
import type { LexicalEditorHandle } from '../../lexical/src/types'

it('imports top-level inline HTML into the live Lexical editor', () => {
	const host = document.createElement('div')
	document.body.append(host)
	const errors: unknown[] = []
	let handle: LexicalEditorHandle | null = null
	const root = createRoot(host, { onUncaughtError: (error) => errors.push(error) })
	try {
		act(() =>
			root.render(LexicalEditor, {
				value: '<span>Hello</span>',
				ref: (value: LexicalEditorHandle | null) => {
					handle = value
				},
			}),
		)

		expect(errors).toEqual([])
		expect(handle).not.toBeNull()
		expect((handle as LexicalEditorHandle | null)?.getHTML()).toContain('Hello')
	} finally {
		act(() => root.unmount())
		host.remove()
	}
})

for (const mode of ['initial', 'controlled', 'imperative'] as const) {
	it(`preserves mixed inline and block HTML through ${mode} import`, () => {
		const host = document.createElement('div')
		document.body.append(host)
		const root = createRoot(host)
		let handle: LexicalEditorHandle | null = null
		const ref = (value: LexicalEditorHandle | null) => {
			handle = value
		}
		const html = '<span>Before</span><p>Middle</p><em>After</em>'
		try {
			act(() =>
				root.render(LexicalEditor, { value: mode === 'initial' ? html : '<p>Original</p>', ref }),
			)

			if (mode === 'controlled') {
				act(() => root.render(LexicalEditor, { value: html, ref }))
			} else if (mode === 'imperative') {
				act(() => handle!.setHTML(html))
			}

			const output = new DOMParser().parseFromString(handle!.getHTML(), 'text/html')
			expect(output.body.textContent).toBe('BeforeMiddleAfter')
			expect(output.querySelector('em')?.textContent).toBe('After')
			expect(Array.from(output.body.children, (child) => child.tagName)).toEqual(['P', 'P', 'P'])
		} finally {
			act(() => root.unmount())
			host.remove()
		}
	})
}
