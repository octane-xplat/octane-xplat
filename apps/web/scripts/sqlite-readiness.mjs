import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { chromium, firefox, webkit } from 'playwright'
import { createServer } from 'vite'

const webRoot = fileURLToPath(new URL('..', import.meta.url))
const browserName = process.env.XPLAT_WEB_BROWSER ?? 'chromium'
const browserType = { chromium, firefox, webkit }[browserName]
if (!browserType) {
	throw new Error(`Unsupported XPLAT_WEB_BROWSER: ${browserName}`)
}

const server = await createServer({
	root: webRoot,
	server: { port: 0, host: '127.0.0.1', strictPort: true },
	plugins: [
		{
			name: 'sqlite-readiness-fixture',
			configureServer(server) {
				server.middlewares.use('/__sqlite_readiness', async (_req, res) => {
					res.setHeader('Content-Type', 'text/html')
					res.end(
						await server.transformIndexHtml(
							'/__sqlite_readiness',
							'<div id="root"></div><script type="module" src="/test/sqlite-readiness.web.ts"></script>',
						),
					)
				},
				)
			},
		},
	],
})

let browser
const errors = []

try {
	await server.listen()
	browser = await browserType.launch({ headless: true })
	const page = await browser.newPage()
	page.setDefaultTimeout(30000)
	page.on('pageerror', (error) => errors.push(error.message))
	page.on('console', (message) => message.type() === 'error' && errors.push(message.text()))

	const base = `http://127.0.0.1:${server.httpServer.address().port}/__sqlite_readiness`
	const caseId = randomUUID()
	await page.goto(`${base}?phase=write&case=${caseId}`)
	await page.waitForFunction(() => document.documentElement.dataset.sqliteReadiness != null)
	assert.equal(
		await page.evaluate(() => document.documentElement.dataset.sqliteReadiness),
		'ok',
		await page.locator('#sqlite-readiness-result').textContent(),
	)

	const writeResult = await page.locator('#sqlite-readiness-result').textContent()

	await page.goto(`${base}?phase=read&case=${caseId}`)
	await page.waitForFunction(() => document.documentElement.dataset.sqliteReadiness != null)
	assert.equal(
		await page.evaluate(() => document.documentElement.dataset.sqliteReadiness),
		'ok',
		await page.locator('#sqlite-readiness-result').textContent(),
	)

	const reloadResult = await page.locator('#sqlite-readiness-result').textContent()

	const failedWorkerPage = await browser.newPage()
	let workerRequestIntercepted = false
	await failedWorkerPage.route(/worker\.web\.ts/, async (route) => {
		workerRequestIntercepted = true
		await route.fulfill({
			status: 200,
			contentType: 'text/javascript',
			body: 'this is not valid JavaScript (',
		})
	})

	await failedWorkerPage.goto(`${base}?phase=worker-error&case=${randomUUID()}`)
	await failedWorkerPage.waitForFunction(
		() => document.documentElement.dataset.sqliteReadiness != null,
		null,
		{ timeout: 10000 },
	)

	assert(workerRequestIntercepted, 'the worker failure route must intercept the module worker')
	assert.equal(
		await failedWorkerPage.evaluate(() => document.documentElement.dataset.sqliteReadiness),
		'ok',
		await failedWorkerPage.locator('#sqlite-readiness-result').textContent(),
	)

	const workerFailureResult = await failedWorkerPage.locator('#sqlite-readiness-result').textContent()

	assert.deepEqual(errors, [])
	console.log(
		`SQLite Web runtime (${browserName}): ${writeResult}; ${reloadResult}; ${workerFailureResult}`,
	)
} catch (error) {
	console.error('SQLite Web runtime readiness failed', error)
	process.exitCode = 1
} finally {
	try {
		await browser?.close()
	} finally {
		await server.close()
	}
}
