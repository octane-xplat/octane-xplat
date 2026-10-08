// Release-dist navigation checks. No dev server, images, or port 5200.
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const mime = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.wasm': 'application/wasm',
	'.json': 'application/json',
	'.svg': 'image/svg+xml',
}

const server = createServer(async (req, res) => {
	try {
		const pathname = new URL(req.url, 'http://localhost').pathname
		const path = resolve(dist, '.' + pathname)
		if (path !== resolve(dist) && !path.startsWith(dist)) {
			res.writeHead(403).end()
			return
		}

		const file = await readFile(path).then(
			(body) => ({ body, ext: extname(path) }),
			() => readFile(resolve(dist, 'index.html')).then((body) => ({ body, ext: '.html' })),
		)

		res.setHeader('Content-Type', mime[file.ext] ?? 'application/octet-stream')
		res.end(file.body)
	} catch (error) {
		res.writeHead(500).end(String(error))
	}
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const base = 'http://127.0.0.1:' + server.address().port
const results = []
const errors = []
const check = (name, pass, detail = '') => {
	results.push({ name, pass, detail })
	console.log('[navigation] ' + name + ': ' + (pass ? 'OK' : 'FAIL') + (detail ? ' ' + detail : ''))
}

const browser = await chromium.launch()
const page = await browser.newPage()
try {
	page.on('pageerror', (error) => errors.push(error.stack ?? error.message))
	await page.goto(base)
	await page.getByRole('tab', { name: 'Apps', exact: true }).click()
	await page.locator('[role="button"]:has-text("Counter")').click()
	await page.getByText('Demo count: 0', { exact: true }).waitFor()
	check('named push with real path', new URL(page.url()).pathname === '/demos/demo/counter')
	check('named push keeps tab strip', await page.locator('.vx-tabbar').isVisible())
	await page.getByText('← Back', { exact: true }).click()
	await page.getByText('Last opened: counter', { exact: true }).waitFor()
	check('pop retains cross-route state', true)
	await page.getByRole('tab', { name: 'Home', exact: true }).click()
	await page.getByRole('link', { name: 'Detail →' }).click()
	await page.getByText('guard: home', { exact: true }).waitFor()
	check('guard context renders', true)
	await page.goBack()
	await page.locator('.vx-tabbar').waitFor()
	await page.goForward()
	await page.getByText('Detail screen', { exact: true }).waitFor()
	check(
		'forward retains guard context',
		(await page.getByText('guard: home', { exact: true }).count()) === 1,
	)

	await page.goBack()
	await page.getByRole('tab', { name: 'Test', exact: true }).click()
	await page.locator('#guarded-btn').click()
	await page.getByText('guard: private', { exact: true }).waitFor()
	check('guard redirect commits destination', true)
	await page.goBack()
	await page.getByRole('link', { name: 'Guides →' }).click()
	await page.getByRole('link', { name: 'Routes from data →' }).click()
	await page.locator('.guide-layout-banner').waitFor()
	check('addRoutes named outlet and layout', new URL(page.url()).pathname === '/test/guides/routes')
	check(
		'programmatic layout applied once',
		(await page.locator('.guide-layout-banner').count()) === 1,
	)

	await page.goto(base + '/test/guides/deploy')
	await page.getByText('guides/deploy', { exact: true }).waitFor()
	check('cold programmatic link', true)
	await page.goto(base + '/about')
	await page.getByText('About (modal route)', { exact: true }).waitFor()
	check(
		'cold modal link overlays shell',
		(await page.locator('.vx-modalroute').count()) === 1 &&
			(await page.locator('.vx-tabbar').count()) === 1,
	)

	await page.goto(base + '/changelog')
	await page.getByText('Changelog (baked)', { exact: true }).waitFor()
	await page.waitForTimeout(100)
	const baked = await page.locator('.changelog').innerText()
	check(
		'cold baked route receives data',
		/entries baked: [1-9]/.test(baked),
		baked.replaceAll('\n', '; '),
	)

	await page.goto(base + '/notes')
	await page.getByText('Release Notes', { exact: true }).waitFor()
	check('cold markdown baked route renders', true)
	await page.goto(base + '/demo/%E0%A4%A')
	await page.locator('#app-tabs').waitFor()
	check(
		'malformed cold link falls back to shell',
		(await page.getByRole('tab', { name: 'Home', exact: true }).count()) === 1,
		(await page.locator('body').innerText()).slice(0, 300),
	)

	check('no browser errors', errors.length === 0, JSON.stringify(errors))
} catch (error) {
	check(
		'suite completed',
		false,
		error.message +
			'; errors=' +
			JSON.stringify(errors) +
			'; text=' +
			(await page.locator('body').innerText()).slice(0, 300),
	)
} finally {
	await browser.close()
	await new Promise((resolve) => server.close(resolve))
}

console.log(JSON.stringify({ target: 'web', results }, null, 2))
if (results.some((result) => !result.pass)) {
	process.exitCode = 1
}
