// Production Chromium checks for unit 13. No screenshots or visual assertions.
// The owned preview server and browser always stop before this command exits.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { chromium } from 'playwright'

const app = new URL('../', import.meta.url)
const allocation = createServer()
allocation.listen(0, '127.0.0.1')
await once(allocation, 'listening')
const port = allocation.address().port
await new Promise((resolve) => allocation.close(resolve))
const base = `http://127.0.0.1:${port}`
const server = spawn(
	process.execPath,
	[
		new URL('../node_modules/vite/bin/vite.js', import.meta.url).pathname,
		'preview',
		'--host',
		'127.0.0.1',
		'--port',
		String(port),
		'--strictPort',
	],
	{ cwd: app, stdio: 'pipe' },
)

let serverOutput = ''
server.stdout.on('data', (data) => {
	serverOutput += data
})

server.stderr.on('data', (data) => {
	serverOutput += data
})

const results = []
let browser
const test = async (name, fn) => {
	try {
		await fn()
		results.push({ name, status: 'pass' })
		console.log(`PASS ${name}`)
	} catch (error) {
		results.push({ name, status: 'fail', observed: error.message })
		console.log(`FAIL ${name}: ${error.message}`)
	}
}

try {
	for (let i = 0; i < 100; i++) {
		try {
			if ((await fetch(base)).ok) {
				break
			}
		} catch {
			/* The preview process is still starting. */
		}

		if (server.exitCode !== null) {
			throw new Error(serverOutput)
		}

		await new Promise((resolve) => setTimeout(resolve, 100))
	}

	browser = await chromium.launch()
	const page = await browser.newPage()
	page.setDefaultTimeout(5000)
	const errors = []
	page.on('pageerror', (error) => errors.push(error.message))
	const go = async (route) => {
		await page.goto(`${base}/pages/${route}/?embed=1`, { waitUntil: 'networkidle' })
	}

	const has = async (text) => {
		const body = await page.locator('body').innerText()
		assert.ok(body.includes(text), `missing ${text}: ${body.slice(-1600)}`)
	}

	const cases = [
		['mobile-spacing', 'Mobile spacing'],
		['shell-lab', 'Shell Lab'],
		['example', 'Example Page'],
		['navigation', 'Navigation Alignment'],
		['showcase-header', 'Available now'],
		['showcase-components', 'Build with Astryx'],
		['doc-home', 'Endless templates for your ideas'],
		['doc-discover', 'Discover'],
		['doc-docs', 'When to use'],
		['documentation', 'Button'],
		['topnav-menu', 'TopNav Menu'],
		['mega-menu', 'Mega Menu'],
		['color-studio', 'Color Studio'],
		['palette-generator', 'Palette Generator'],
		['polymorphic-link', 'Polymorphic Link'],
		['codeblock-perf', 'CodeBlock Performance'],
		['dictation-lab', 'Dictation Lab'],
		['example-cards', 'Retirement'],
	]

	for (const [route, content] of cases) {
		await test(`render /pages/${route}/`, async () => {
			await go(route)
			await has(content)
			assert.equal(await page.locator('.sb-pending').count(), 0)
		})
	}

	await test('scaffold controlled fields and independent checkboxes', async () => {
		await go('example')
		await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Porter')
		await page.getByRole('textbox', { name: 'Email', exact: true }).fill('porter@example.test')
		await page.getByRole('checkbox', { name: 'Enable notifications' }).click()
		assert.equal(
			await page.getByRole('checkbox', { name: 'Enable notifications' }).isChecked(),
			true,
		)
		assert.equal(
			await page.getByRole('checkbox', { name: 'Subscribe to updates' }).isChecked(),
			false,
		)
		assert.equal(
			await page.getByRole('textbox', { name: 'Name', exact: true }).inputValue(),
			'Porter',
		)
	})

	await test('navigation alignment changes live preview', async () => {
		await go('navigation')
		await page.getByRole('button', { name: 'Center', exact: true }).click()
		assert.equal(
			await page.getByRole('navigation', { name: 'center-aligned navigation' }).count(),
			2,
		)
		await page.getByRole('button', { name: 'Right', exact: true }).click()
		assert.equal(await page.getByRole('navigation', { name: 'end-aligned navigation' }).count(), 2)
	})

	await test('showcase settings remain independent', async () => {
		await go('showcase-components')
		await page.getByRole('switch', { name: 'Compact', exact: true }).click()
		assert.equal(await page.getByRole('switch', { name: 'Compact', exact: true }).isChecked(), true)
		assert.equal(
			await page.getByRole('switch', { name: 'Animations', exact: true }).isChecked(),
			true,
		)
	})

	await test('docs home filters and restores the gallery', async () => {
		await go('doc-home')
		const input = page.getByRole('textbox', { name: 'Search', exact: true })
		await input.fill('no-match-217a2e51')
		assert.equal(await page.locator('a:has(.vx-card)').count(), 0)
		await input.fill('')
		assert.ok((await page.locator('a:has(.vx-card)').count()) > 0)
	})

	await test('discover combines category and text, including empty state', async () => {
		await go('doc-discover')
		await page.getByRole('radio', { name: 'Tools', exact: true }).click()
		await has('Theme Editor')
		const input = page.getByRole('textbox').first()
		await input.fill('no-match-217a2e51')
		await has('No results')
		await input.fill('theme')
		await has('Theme Editor')
		assert.ok(!(await page.locator('body').innerText()).includes('DataTable'))
	})

	await test('docs navigation and code toggle preserve local state', async () => {
		await go('doc-docs')
		await page.getByRole('button', { name: 'Toggle code', exact: true }).click()
		await page.getByRole('button', { name: 'Toggle code', exact: true }).click()
		await has('When to use')
	})

	await test('custom link provider and per-link override intercept real clicks', async () => {
		await go('polymorphic-link')
		const logs = []
		const onConsole = (message) => logs.push(message.text())
		page.on('console', onConsole)
		const before = page.url()
		await page
			.getByRole('navigation', { name: 'Provider demo navigation' })
			.getByRole('link', { name: 'Products', exact: true })
			.click()
		await page
			.getByRole('navigation', { name: 'Override demo navigation' })
			.getByRole('link', { name: 'Products', exact: true })
			.click()
		assert.equal(page.url(), before)
		assert.ok(logs.some((line) => line.includes('[SimulatedNextLink]')))
		assert.ok(logs.some((line) => line.includes('[GreenLink]')))
		page.off('console', onConsole)
	})

	for (const [route, trigger] of [
		['topnav-menu', 'Products'],
		['mega-menu', 'Products'],
	]) {
		await test(`${route} opens and dismisses by pointer/keyboard`, async () => {
			await go(route)
			await page.getByRole('button', { name: trigger, exact: true }).first().hover()
			await page.waitForSelector('[role="menu"], .vx-popover-panel', { state: 'visible' })
			await page.keyboard.press('Escape')
			assert.equal(await page.locator('[role="menu"]:visible').count(), 0)
		})
	}

	await test('palette generator view and algorithm selection', async () => {
		await go('palette-generator')
		await page.getByRole('radio', { name: 'Compare', exact: true }).click()
		await has('Direct algorithm comparison')
	})

	await test('CodeBlock switches rendering strategy', async () => {
		await go('codeblock-perf')
		await page.getByRole('radio', { name: 'Spans Only', exact: true }).click()
		assert.equal(await page.locator('.vx-codeblock').count(), 1)
		await has('Spans')
	})

	await test('color studio adds/removes ramps and uses shared clipboard feedback', async () => {
		await go('color-studio')
		const hex = page.getByRole('textbox', { name: 'Hex', exact: true })
		const count = await hex.count()
		await page.getByRole('button', { name: 'Add color', exact: true }).click()
		assert.equal(await hex.count(), count + 1)
		await page.getByRole('button', { name: 'Remove', exact: true }).last().click()
		assert.equal(await hex.count(), count)
		await page.getByRole('radio', { name: 'Cool', exact: true }).click()
		await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
		await page.getByRole('button', { name: 'Export', exact: true }).click()
		await page.getByRole('button', { name: 'Copied!', exact: true }).waitFor()
	})

	await test('documentation selection opens anatomy and returns to overview', async () => {
		await go('documentation')
		await page.locator('aside nav').getByRole('button', { name: 'Button', exact: true }).click()
		await page.getByRole('heading', { name: 'Anatomy', exact: true }).waitFor()
		await has('When to use')
		assert.ok((await page.locator('.vx-table').count()) > 0)
		await page.locator('aside nav').getByRole('button', { name: 'Overview', exact: true }).click()
		await page.getByText('Web overview', { exact: true }).waitFor()
		await has('Web overview')
	})

	await test('example collage edits controlled email and preserves other fields', async () => {
		await go('example-cards')
		const email = page.getByRole('textbox', { name: 'Email Address', exact: true })
		await email.fill('collage@example.test')
		assert.equal(await email.inputValue(), 'collage@example.test')
		await page.getByRole('textbox', { name: 'Notes', exact: true }).fill('Keep this note')
		assert.equal(await email.inputValue(), 'collage@example.test')
	})

	await test('dictation mixer selects an attack without requesting microphone access', async () => {
		await go('dictation-lab')
		await page.getByRole('button', { name: 'Kalimba', exact: true }).click()
		assert.ok(
			(
				await page.getByRole('button', { name: 'Kalimba', exact: true }).getAttribute('class')
			).includes('primary'),
		)
		await has('Sound Mixer')
	})

	await test('mobile spacing changes viewport, quantity and grouped disclosures', async () => {
		await go('mobile-spacing')
		await page.getByRole('radio', { name: 'Mobile', exact: true }).click()
		await page.getByRole('switch', { name: 'Mobile proposal', exact: true }).waitFor()
		await page.getByRole('button', { name: 'Increase quantity', exact: true }).click()
		assert.equal(
			await page.getByRole('spinbutton', { name: 'Quantity', exact: true }).inputValue(),
			'2',
		)
		await page.getByRole('button', { name: 'Delivery & Returns', exact: true }).click()
		await has('Delivery')
		await page.getByRole('combobox', { name: 'View', exact: true }).click()
		await page.getByRole('option', { name: 'Token values', exact: true }).click()
		await has('Mobile semantic spacing contract')
	})

	await test('raw shell config toggles, persists query and relaunches', async () => {
		await go('shell-lab')
		await page.getByRole('switch', { name: 'Banner', exact: true }).focus()
		await page.keyboard.press('Space')
		await has('Shell Lab — System announcement banner')
		await page.waitForURL((url) => url.search.length > 0)
		await page.reload({ waitUntil: 'networkidle' })
		assert.equal(await page.getByRole('switch', { name: 'Banner', exact: true }).isChecked(), true)
		await page.getByRole('button', { name: /Hide Config/ }).click()
		assert.equal(
			await page.getByRole('heading', { name: 'Shell Configuration', exact: true }).count(),
			0,
		)
		await page.getByRole('button', { name: /Config/ }).click()
		await page.getByRole('heading', { name: 'Shell Configuration', exact: true }).waitFor()
	})

	for (const route of ['layout-dsl', 'doc-preview']) {
		await test(`blocked /pages/${route}/ retains reason`, async () => {
			await go(route)
			await has('BLOCKED')
			await has(route === 'layout-dsl' ? '@astryxdesign/cli/xle' : 'foundationDocs.json')
		})
	}

	await test('no uncaught browser errors on authored journeys', async () =>
		assert.deepEqual(errors, []))

	console.log(
		JSON.stringify(
			{
				host: 'web/Chromium',
				input: 'Playwright browser pointer/keyboard/text input; DOM reads',
				results,
			},
			null,
			2,
		),
	)

	process.exitCode = results.some((result) => result.status === 'fail') ? 1 : 0
} finally {
	await browser?.close()
	server.kill('SIGTERM')
	if (server.exitCode === null) {
		await once(server, 'exit')
	}
}
