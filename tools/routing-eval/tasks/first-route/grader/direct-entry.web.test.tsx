import { expect, it } from 'vitest'
import { pageText, renderApp, wait } from './dom.tsx'

it('renders a directly entered detail address', async () => {
	const app = await renderApp('/items/hat')
	try {
		await wait(() => expect(pageText()).toContain('Item: hat'))
	} finally {
		app.unmount()
	}
})
