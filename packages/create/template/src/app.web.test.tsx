/** @jsxImportSource @octane-xplat/jsx/dom */
import { expect, it, vi } from 'vitest'
import { createRoot } from 'octane'
import { App } from './App.tsrx'

it('updates the counter when its button is pressed', async () => {
	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	try {
		root.render(<App />)
		const value = () => container.querySelector('[data-testid="counter.value"]')?.textContent
		await vi.waitFor(() => expect(value()).toBe('0'))
		container.querySelector<HTMLElement>('[data-testid="counter.increment"]')!.click()
		await vi.waitFor(() => expect(value()).toBe('1'))
	} finally {
		root.unmount()
		container.remove()
	}
})
