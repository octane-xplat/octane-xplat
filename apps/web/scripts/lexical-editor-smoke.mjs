import { chromium } from 'playwright'
import { createServer } from 'vite'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url))
const fixtureRoot = path.join(repoRoot, 'packages/lexical/tests/browser')
const server = await createServer({
	configFile: path.join(repoRoot, 'packages/lexical/vite.config.ts'),
	root: fixtureRoot,
	server: { host: '127.0.0.1', port: 0, strictPort: false },
	appType: 'mpa',
})

const browser = await chromium.launch()

try {
	await server.listen()
	const address = server.httpServer.address()
	if (!address || typeof address === 'string') {
		throw new Error('Vite did not expose a TCP port')
	}

	const page = await browser.newPage()
	const pageErrors = []
	page.on('pageerror', (error) => pageErrors.push(error.message))
	await page.goto(`http://127.0.0.1:${address.port}/`)
	await page.waitForFunction(() => window.__lexicalSmoke?.ready === 1, { timeout: 30000 })
	await page.waitForFunction(() => window.__lexicalSmoke?.jsonReady.length === 1)
	const input = page.locator('#lexical-input')
	if ((await input.getAttribute('contenteditable')) !== 'true') {
		throw new Error('Editor did not mount editable')
	}

	await input.press('End')
	await input.press('!')
	await page.waitForFunction(() => window.__lexicalSmoke.changes.some((html) => html.includes('!')))
	await page.locator('#undo').click()
	await page.waitForFunction(() => !document.querySelector('#lexical-input')?.textContent?.includes('!'))
	await page.locator('#redo').click()
	await page.waitForFunction(() => document.querySelector('#lexical-input')?.textContent?.includes('!'))

	await input.focus()
	await input.evaluate((element) => element.blur())
	await page.waitForFunction(() => window.__lexicalSmoke.focus > 0 && window.__lexicalSmoke.blur > 0)
	await page.locator('#roundtrip').click()
	await page.waitForFunction(() => JSON.stringify(window.__lexicalSmoke.json).includes('"type":"badge"'))
	await page.waitForFunction(() => window.__lexicalSmoke.roundTripHTML.includes('data-badge'))

	await page.locator('#external-update').click()
	await page.waitForFunction(() => document.querySelector('#lexical-input')?.textContent === 'External update')
	await page.locator('#toggle-readonly').click()
	await page.waitForFunction(() => document.querySelector('#lexical-input')?.getAttribute('contenteditable') === 'false')
	if ((await input.getAttribute('contenteditable')) !== 'false') {
		throw new Error('Read-only update was not applied')
	}

	await input.press('x')
	if ((await input.textContent()) !== 'External update') {
		throw new Error('Read-only editor accepted keyboard input')
	}

	await page.locator('#toggle-mount').click()
	await input.waitFor({ state: 'detached' })
	await page.locator('#toggle-mount').click()
	await page.waitForFunction(() => window.__lexicalSmoke.ready === 2 && window.__lexicalSmoke.jsonReady.length === 2)
	if (pageErrors.length) {
		throw new Error(`Browser errors: ${pageErrors.join('\n')}`)
	}

	console.log('[lexical] Chromium PASS: mount, keyboard edit, controlled update, read-only, undo/redo, focus/blur, custom-node JSON/HTML round-trip, and remount')
} finally {
	await browser.close()
	await server.close()
}
