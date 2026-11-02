import { expect, it } from 'vitest'
import { click, pageText, renderApp, wait } from './dom.tsx'

it('redirects signed-out entry to sign-in and returns after signing in', async () => {
	const app = await renderApp('/account')
	try {
		await wait(() => expect(window.location.pathname).toBe('/login'))
		expect(new URLSearchParams(window.location.search).get('returnTo')).toBe('/account')
		await wait(() => expect(pageText()).toContain('Please sign in'))
		const entries = window.history.length
		click('Sign in as Ada')
		await wait(() => expect(window.location.pathname).toBe('/account'))
		await wait(() => expect(pageText()).toContain('Hello, Ada'))
		expect(window.history.length).toBe(entries)
		const before = app.seen.findIndex((text) => text.includes('Please sign in'))
		expect(app.seen.slice(0, before).some((text) => text.includes('Hello,'))).toBe(false)
	} finally {
		app.unmount()
	}
})
