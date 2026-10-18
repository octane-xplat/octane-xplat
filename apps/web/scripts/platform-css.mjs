import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'
import { xplatCss } from '@octane-xplat/cli/vite'
import { chromium } from 'playwright'
const root = mkdtempSync(join(tmpdir(), 'xplat-css-browser-'))
writeFileSync(
	join(root, 'index.html'),
	'<div class="card">Platform card</div><script type="module" src="/main.js"></script>',
)
writeFileSync(join(root, 'main.js'), "import './card.css'")
writeFileSync(join(root, 'card.css'), '.card{color:rgb(255,0,0)}')
writeFileSync(
	join(root, 'card.web.css'),
	'.card{color:rgb(0,0,255)} @platform web {.card{padding:11px}} @platform ios {.card{color:red;padding:99px}}',
)
const server = await createServer({
	configFile: false,
	root,
	logLevel: 'silent',
	plugins: [xplatCss('web')],
	server: { host: '127.0.0.1', port: 0 },
})
let browser
try {
	await server.listen()
	browser = await chromium.launch({ headless: true })
	const page = await browser.newPage()
	await page.goto(server.resolvedUrls.local[0])
	await page.waitForFunction(
		() => getComputedStyle(document.querySelector('.card')).paddingTop === '11px',
	)
	const result = await page.locator('.card').evaluate((el) => ({
		color: getComputedStyle(el).color,
		padding: getComputedStyle(el).paddingTop,
	}))
	assert.deepEqual(result, { color: 'rgb(0, 0, 255)', padding: '11px' })
	console.log(JSON.stringify(result))
} finally {
	await browser?.close()
	await server.close()
	rmSync(root, { recursive: true, force: true })
}
