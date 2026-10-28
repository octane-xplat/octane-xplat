import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { chromium } from 'playwright'
import { audioResponse } from './fixture-server.mjs'
const temp = await mkdtemp(join(tmpdir(), 'xplat-audio-browser-'))
let browser
const server = createServer(async (request, response) => {
	if (request.url === '/') {
		response.setHeader('content-type', 'text/html')
		response.end('<button>Start audio check</button><script src="/case.js"></script>')
	} else if (request.url === '/case.js') {
		response.setHeader('content-type', 'text/javascript')
		response.end(await readFile(join(temp, 'case.js')))
	} else {
		audioResponse(request, response)
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
				entry: fileURLToPath(new URL('browser-entry.mjs', import.meta.url)),
				formats: ['iife'],
				name: 'AudioFixture',
				fileName: () => 'case.js',
			},
		},
	})

	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
	browser = await chromium.launch({ headless: true })
	const page = await browser.newPage()
	await page.goto(`http://127.0.0.1:${server.address().port}`)
	await page.getByRole('button', { name: 'Start audio check' }).click()
	await page.waitForFunction(() => globalThis.audioResult !== null, null, { timeout: 45000 })
	const result = await page.evaluate(() => globalThis.audioResult)
	assert.equal(result.error, undefined, result.error)
	assert.equal(result.assertions.length, 9)
	console.log(
		`Chromium trusted-click audio: ${result.assertions.length} foreground queue/control assertions; silent source, no physical output evidence.`,
	)
} finally {
	await browser?.close()
	server.closeAllConnections()
	if (server.listening) {
		await new Promise((resolve) => server.close(resolve))
	}

	await rm(temp, { recursive: true, force: true })
}
