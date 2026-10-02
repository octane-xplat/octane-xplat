import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { test } from 'node:test'

// Use the web harness's declared browser tooling; UI gains no dependencies.
const requireWeb = createRequire(new URL('../../../apps/web/package.json', import.meta.url))
const { chromium } = requireWeb('playwright')
const { createServer } = await import(requireWeb.resolve('vite'))

test('browser resolves layer offsets in anchor context and releases only owned anchor names', async () => {
	const server = await createServer({
		configFile: false,
		root: new URL('../../..', import.meta.url).pathname,
		server: { port: 0 },
	})

	server.middlewares.use('/layer-test', (_request, response) => {
		response.setHeader('Content-Type', 'text/html')
		response.end('<!doctype html><html><body></body></html>')
	})

	await server.listen()
	const browser = await chromium.launch()
	try {
		const page = await browser.newPage()
		await page.goto(server.resolvedUrls.local[0] + 'layer-test')
		const results = await page.evaluate(async () => {
			const { resolveCSSLayerOffset, ownAnchorName } =
				await import('/packages/ui/src/layer-position.web.ts')

			document.documentElement.style.fontSize = '16px'
			const anchor = document.createElement('button')
			anchor.style.fontSize = '20px'
			anchor.style.setProperty('--gap', '14px')
			document.body.append(anchor)
			const offsets = ['2em', '1rem', 'var(--gap)', 'calc(var(--gap) + 6px)'].map((value) =>
				resolveCSSLayerOffset(value, anchor),
			)

			anchor.style.setProperty('anchor-name', '--consumer')
			const first = ownAnchorName(anchor, '--first'),
				second = ownAnchorName(anchor, '--second')

			first()
			const names = anchor.style.getPropertyValue('anchor-name')
			second()
			return {
				offsets,
				names,
				remaining: anchor.style.getPropertyValue('anchor-name'),
				children: anchor.parentElement.children.length,
			}
		})

		assert.deepEqual(results.offsets, [40, 16, 14, 20], JSON.stringify(results))
		assert.equal(results.names, '--consumer, --second')
		assert.equal(results.remaining, '--consumer')
		assert.equal(results.children, 1, 'temporary measurement elements are removed')
	} finally {
		await browser.close()
		await server.close()
	}
})
