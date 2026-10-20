import { expect, it } from 'vitest'
import { renderApp } from './dom.tsx'

it('never displays an unsupported sort value', async () => {
	const app = await renderApp('/items?sort=color')
	try {
		await new Promise((resolve) => setTimeout(resolve, 500))
		expect(app.seen.some((text) => text.includes('Sorted by: color'))).toBe(false)
	} finally {
		app.unmount()
	}
})
