import { expect, it } from 'vitest'
import { click, pageText, renderApp, wait } from './dom.tsx'

it('opens a guide registered from data', async () => {
	const app = await renderApp('/')
	try {
		await wait(() => expect(pageText()).toContain('Read the setup guide'))
		click('Read the setup guide')
		await wait(() => expect(window.location.pathname).toBe('/guides/setup'))
		await wait(() => expect(pageText()).toContain('Guide: Set up'))
	} finally {
		app.unmount()
	}
})
