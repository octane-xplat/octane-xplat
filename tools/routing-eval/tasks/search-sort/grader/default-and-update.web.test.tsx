import { expect, it } from 'vitest'
import { click, pageText, renderApp, wait } from './dom.tsx'

it('defaults the sort and edits it without growing history', async () => {
	const app = await renderApp('/')
	try {
		await wait(() => expect(pageText()).toContain('All items'))
		click('All items')
		await wait(() => expect(window.location.pathname).toBe('/items'))
		await wait(() => expect(pageText()).toContain('Sorted by: name'))
		const entries = window.history.length
		click('Sort by price')
		await wait(() => expect(pageText()).toContain('Sorted by: price'))
		expect(new URLSearchParams(window.location.search).get('sort')).toBe('price')
		expect(window.history.length).toBe(entries)
		click('Sort by name')
		await wait(() => expect(pageText()).toContain('Sorted by: name'))
		expect(window.history.length).toBe(entries)
	} finally {
		app.unmount()
	}
})
