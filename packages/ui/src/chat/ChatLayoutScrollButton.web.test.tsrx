/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { ChatLayoutScrollButton } from './ChatLayoutScrollButton.web'

it('removes hidden buttons from interaction and supports visibility changes', () => {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	const press = vi.fn()
	try {
		act(() => root.render(<ChatLayoutScrollButton isVisible={false} onPress={press} />))
		expect(el.querySelector<HTMLElement>('[role="button"]')).toBeNull()
		act(() =>
			root.render(<ChatLayoutScrollButton isVisible label="New messages" onPress={press} />),
		)

		expect(el.querySelector<HTMLElement>('[role="button"]')?.getAttribute('aria-label')).toBe(
			'New messages',
		)

		act(() => el.querySelector<HTMLElement>('[role="button"]')?.click())
		expect(press).toHaveBeenCalledTimes(1)
		act(() => root.render(<ChatLayoutScrollButton isVisible={false} onPress={press} />))
		expect(el.querySelector<HTMLElement>('[role="button"]')).toBeNull()
	} finally {
		act(() => root.unmount())
		el.remove()
	}
})
