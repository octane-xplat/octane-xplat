import { act, createRoot } from 'octane'
import { expect, it } from 'vitest'
import { LexicalEditor } from '../../lexical/src/LexicalEditor.web.tsrx'
import type { LexicalEditorHandle } from '../../lexical/src/types'

it.fails('imports top-level inline HTML into the live Lexical editor', () => {
	const host = document.createElement('div')
	document.body.append(host)
	const errors: unknown[] = []
	let handle: LexicalEditorHandle | null = null
	const root = createRoot(host, { onUncaughtError: (error) => errors.push(error) })
	try {
		act(() => root.render(LexicalEditor, {
			value: '<span>Hello</span>',
			ref: (value: LexicalEditorHandle | null) => { handle = value },
		}))
		expect(errors).toEqual([])
		expect(handle).not.toBeNull()
		expect((handle as LexicalEditorHandle | null)?.getHTML()).toContain('Hello')
	} finally {
		act(() => root.unmount())
		host.remove()
	}
})
