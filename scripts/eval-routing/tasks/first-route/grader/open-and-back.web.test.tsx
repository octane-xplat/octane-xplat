import { expect, it } from 'vitest'
import { click, pageText, renderApp, wait } from './dom.tsx'

it('opens the typed detail link and returns with Back', async () => {
	const app = await renderApp('/')
	try {
		await wait(() => expect(pageText()).toContain('Open coat'))
		click('Open coat')
		await wait(() => expect(window.location.pathname).toBe('/items/coat'))
		await wait(() => expect(pageText()).toContain('Item: coat'))
		click('Back')
		await wait(() => expect(window.location.pathname).toBe('/'))
	} finally {
		app.unmount()
	}
})
