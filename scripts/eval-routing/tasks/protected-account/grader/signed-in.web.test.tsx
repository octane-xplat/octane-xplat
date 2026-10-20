import { expect, it } from 'vitest'
import { signIn } from '../session.ts'
import { pageText, renderApp, wait } from './dom.tsx'

it('shows the account directly for a signed-in user', async () => {
	signIn('Grace')
	const app = await renderApp('/account')
	try {
		await wait(() => expect(pageText()).toContain('Hello, Grace'))
		expect(window.location.pathname).toBe('/account')
		expect(app.seen.some((text) => text.includes('Please sign in'))).toBe(false)
	} finally {
		app.unmount()
	}
})
