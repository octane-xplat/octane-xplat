import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { chromium } from 'playwright'
import { networkResponse } from './fixture-server.mjs'
const temp = await mkdtemp(join(tmpdir(), 'xplat-network-browser-'))
let browser
const server = createServer(async (request, response) => {
	if (request.url === '/') {
		response.setHeader('content-type', 'text/html; charset=utf-8')
		response.end('<button>Start network check</button><script src="/case.js"></script>')
	} else if (request.url === '/case.js') {
		response.setHeader('content-type', 'text/javascript; charset=utf-8')
		response.end(await readFile(join(temp, 'case.js')))
	} else {
		await networkResponse(request, response)
	}
})

try {
	await build({
		configFile: false,
		logLevel: 'error',
		resolve: { conditions: ['web'], extensions: ['.web.ts', '.ts', '.mjs', '.js'] },
		build: {
			outDir: temp,
			emptyOutDir: false,
			lib: {
				entry: fileURLToPath(new URL('browser-entry.web.mjs', import.meta.url)),
				formats: ['iife'],
				name: 'NetworkFixture',
				fileName: () => 'case.js',
			},
		},
	})

	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
	browser = await chromium.launch({ headless: true })
	const page = await browser.newPage()
	await page.goto(`http://127.0.0.1:${server.address().port}`)
	await page.getByRole('button', { name: 'Start network check' }).click()
	await page.waitForFunction(() => globalThis.networkResult !== null, null, { timeout: 45000 })
	const result = await page.evaluate(() => globalThis.networkResult)
	assert.equal(result.error, undefined, result.error)
	assert.equal(result.assertions.length, 8)
	console.log(
		`Chromium streaming: ${result.assertions.length} transport assertions, including expected HTTP error bodies.`,
	)
} finally {
	await browser?.close()
	server.closeAllConnections()
	if (server.listening) {
		await new Promise((resolve) => server.close(resolve))
	}

	await rm(temp, { recursive: true, force: true })
}
