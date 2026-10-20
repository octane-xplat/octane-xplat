import { expect, it } from 'vitest'
import { pageText, renderApp, wait } from './dom.tsx'

it('loads the stock count on direct entry', async () => {
	const app = await renderApp('/stock/hat')
	try {
		await wait(() => expect(pageText()).toContain('In stock: 3'))
	} finally {
		app.unmount()
	}
})
