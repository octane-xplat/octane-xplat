// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { useLexicalComposerContext } from '@octanejs/lexical/LexicalComposerContext'
import { LexicalEditor } from './LexicalEditor.web.tsrx'
import type { LexicalEditorHandle } from './types'
import { BadgeNode } from '../tests/browser/BadgeNode'

const roots: any[] = []
function UpdatePlugin() {
	useLexicalComposerContext()
	return <span data-plugin-mounted="true" />
}

function mount(props: any = {}) {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	let handle: LexicalEditorHandle | null = null
	const render = (next: any) =>
		act(() =>
			root.render(
				<LexicalEditor
					{...next}
					ref={(value: LexicalEditorHandle | null) => {
						handle = value
					}}
				/>,
			),
		)
	render(props)
	return { el, root, render, get handle() { return handle } }
}

afterEach(() => {
	for (const root of roots.splice(0)) act(() => root.unmount())
	document.body.innerHTML = ''
	vi.restoreAllMocks()
})

it('reports the live JSON and editor handles once when ready', () => {
	const onJSONReady = vi.fn()
	const onReady = vi.fn()
	const { handle } = mount({ value: '<p>Travel notes</p>', onJSONReady, onReady })

	expect(handle).not.toBeNull()
	expect(handle!.getJSON()).not.toBeNull()
	expect(onJSONReady).toHaveBeenCalledExactlyOnceWith(true)
	expect(onReady).toHaveBeenCalledTimes(1)
})

it('wires focus and blur callbacks from the real editable element', () => {
	const onFocus = vi.fn()
	const onBlur = vi.fn()
	const { el } = mount({ onFocus, onBlur })
	const editable = el.querySelector('[contenteditable]') as HTMLElement

	editable.focus()
	expect(onFocus).toHaveBeenCalledTimes(1)
	editable.blur()
	expect(onBlur).toHaveBeenCalledTimes(1)
})

it('accepts controlled HTML updates and read-only changes', () => {
	const mounted = mount({ value: '<p>First</p>', editable: false })
	const editable = mounted.el.querySelector('[contenteditable]') as HTMLElement
	expect(editable.getAttribute('contenteditable')).toBe('false')

	mounted.render({ value: '<p>Second</p>', editable: true })
	expect(mounted.handle!.getHTML()).toContain('Second')
	expect(
		(mounted.el.querySelector('[contenteditable]') as HTMLElement).getAttribute('contenteditable'),
	).toBe('true')
})

it('adds custom nodes to defaults and round-trips their JSON and HTML', () => {
	const { handle } = mount({
		value: '<p><span data-badge>Voyager</span></p><h1>Default heading</h1>',
		web: { nodes: [BadgeNode] },
	})

	const json = handle!.getJSON()!
	expect(JSON.stringify(json)).toContain('"type":"badge"')
	expect(handle!.getHTML()).toContain('data-badge')
	expect(handle!.getHTML()).toContain('<h1><span')

	handle!.setJSON(json)
	expect(handle!.getHTML()).toContain('Voyager')
	expect(handle!.getHTML()).toContain('data-badge')
})

it('renders custom plugins inside the composer context', () => {
	const { el } = mount({ web: { plugins: <UpdatePlugin /> } })
	expect(el.querySelector('[data-plugin-mounted]')).not.toBeNull()
})

it('can replace the default custom-node registry', () => {
	const { handle } = mount({
		value: '<p><span data-badge>Caller schema</span></p>',
		web: {
			replaceNodes: true,
			nodes: [BadgeNode],
			replacePlugins: true,
			plugins: <UpdatePlugin />,
		},
	})
	expect(handle).not.toBeNull()
	expect((handle!.native as any).getRegisteredNode(BadgeNode)).toBeTruthy()
	expect(handle!.getJSON()!.root).toBeTruthy()
})
