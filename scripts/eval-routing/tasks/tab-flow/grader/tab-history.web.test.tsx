import { expect, it } from 'vitest'
import { click, renderApp, visibleText, wait } from './dom.tsx'

it('keeps each tab history inside its tab', async () => {
	const app = await renderApp('/')
	try {
		await wait(() => expect(visibleText()).toContain('Choose an item'))
		expect(visibleText()).not.toContain('Account settings')
		click('Open coat')
		await wait(() => expect(visibleText()).toContain('Item: coat'))
		expect(visibleText()).toContain('Catalog')
		expect(visibleText()).toContain('Account')
		expect(visibleText()).not.toContain('Choose an item')
		click('Account')
		await wait(() => expect(visibleText()).toContain('Account settings'))
		expect(visibleText()).not.toContain('Item: coat')
		click('Catalog')
		await wait(() => expect(visibleText()).toContain('Item: coat'))
		click('Back')
		await wait(() => expect(visibleText()).toContain('Choose an item'))
		expect(visibleText()).not.toContain('Item: coat')
		expect(visibleText()).toContain('Account')
	} finally {
		app.unmount()
	}
})
