/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { Thumbnail } from './Thumbnail.web.tsrx'

const roots: ReturnType<typeof createRoot>[] = []
afterEach(() => {
	for (const root of roots.splice(0)) {
		act(() => root.unmount())
	}

	document.body.innerHTML = ''
})

it('keeps preview and remove actions independent for pointer and keyboard input', () => {
	const preview = vi.fn(),
		remove = vi.fn()

	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	act(() =>
		root.render(
			<Thumbnail label="report.pdf" onPress={preview} onRemove={remove} showRemoveOn="always" />,
		),
	)

	const group = el.querySelector('[role="button"]')!
	const button = el.querySelector('button[aria-label="Remove"]')!
	expect(el.querySelector('button button')).toBeNull()
	act(() => button.dispatchEvent(new MouseEvent('click', { bubbles: true })))
	expect(remove).toHaveBeenCalledOnce()
	expect(preview).not.toHaveBeenCalled()
	act(() => button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
	expect(preview).not.toHaveBeenCalled()
	act(() => group.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
	expect(preview).toHaveBeenCalledOnce()
})
