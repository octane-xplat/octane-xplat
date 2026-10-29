import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
const root = fileURLToPath(new URL('..', import.meta.url))
const server = await createServer({
	root,
	configFile: false,
	resolve: { conditions: ['web'], extensions: ['.web.ts', '.ts', '.js'] },
	server: {
		host: '127.0.0.1',
		port: 0,
		fs: { allow: [fileURLToPath(new URL('../../..', import.meta.url))] },
	},
})
let browser
try {
	await server.listen()
	browser = await chromium.launch()
	const page = await browser.newPage()
	await page.goto(`${server.resolvedUrls.local[0]}tests/index.html`)
	const result = await page.evaluate(async () => {
		const { run } = await import('/tests/conformance.ts')
		const assertions = []
		await run({
			assert(name, actual, expected) {
				if (actual !== expected) {
					throw new Error(name)
				}
				assertions.push(name)
			},
			record() {},
		})
		return { count: assertions.length }
	})
	assert.ok(result.count >= 43)
	console.log(`Chromium Web Crypto: ${result.count} real-engine conformance assertions passed.`)
} finally {
	await browser?.close()
	await server.close()
}
