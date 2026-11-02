import { expect, it } from 'vitest'
import { pageText, renderApp, wait } from './dom.tsx'

it('enters a guide directly', async () => {
	const app = await renderApp('/guides/deploy')
	try {
		await wait(() => expect(pageText()).toContain('Guide: Deploy'))
	} finally {
		app.unmount()
	}
})

it('never shows a guide for an unknown slug', async () => {
	const app = await renderApp('/guides/missing')
	try {
		await new Promise((resolve) => setTimeout(resolve, 500))
		expect(app.seen.some((text) => text.includes('Guide:'))).toBe(false)
	} finally {
		app.unmount()
	}
})
