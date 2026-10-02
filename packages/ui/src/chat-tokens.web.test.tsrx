// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { act, createRoot } from 'octane'
import { ChatTokenChip } from './chat-tokens.web.tsrx'

const roots: { root: any; host: HTMLElement }[] = []

function mount(token: { value: string; label: string; variant: 'info' }) {
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	roots.push({ root, host })
	act(() => root.render(<ChatTokenChip token={token} />))
	return host
}

afterEach(() => {
	for (const { root, host } of roots.splice(0)) {
		act(() => root.unmount())
		host.remove()
	}
})

it('uses the shared chip style and retains its variant hook', () => {
	const host = mount({ value: '@octane', label: 'Octane', variant: 'info' })
	const chip = host.firstElementChild

	expect(chip?.classList.contains('vx-chat-token')).toBe(true)
	expect(chip?.classList.contains('vx-chattoken--info')).toBe(true)
	expect(chip?.textContent).toBe('Octane')
})
