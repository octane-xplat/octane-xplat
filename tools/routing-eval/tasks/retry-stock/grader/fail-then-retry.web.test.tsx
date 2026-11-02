import { expect, it } from 'vitest'
import { failNextLoads } from '../stock.ts'
import { click, pageText, renderApp, wait } from './dom.tsx'

it('keeps the home screen on failure and opens the stock after retry', async () => {
	failNextLoads(1)
	const app = await renderApp('/')
	try {
		await wait(() => expect(pageText()).toContain('Check coat stock'))
		click('Check coat stock')
		await wait(() => expect(pageText()).toContain('Could not load stock'))
		expect(window.location.pathname).toBe('/')
		expect(pageText()).toContain('Check coat stock')
		click('Try again')
		await wait(() => expect(pageText()).toContain('In stock: 4'))
		expect(window.location.pathname).toBe('/stock/coat')
		expect(pageText()).not.toContain('Could not load stock')
	} finally {
		app.unmount()
	}
})
