import { expect, it } from 'vitest'
import { pageText, renderApp, wait } from './dom.tsx'

it('reads a directly entered sort value', async () => {
	const app = await renderApp('/items?sort=price')
	try {
		await wait(() => expect(pageText()).toContain('Sorted by: price'))
	} finally {
		app.unmount()
	}
})
