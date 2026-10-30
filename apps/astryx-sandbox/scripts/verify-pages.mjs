// Production Chromium checks for unit 12 composed page templates. No
// screenshots or visual assertions. The owned preview server and browser
// always stop before this command exits. `--only=name,name` filters the run.
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

const onlyArg = process.argv.find((arg) => arg.startsWith('--only='))
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',')) : null

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

/** Route → distinctive upstream strings + image count (0 = don't check). */
const PAGES = [
	['blank', ['New Page'], 0],
	['centered-hero', ['Little joys, everywhere you go', 'Get started', 'Learn more'], 1],
	['gallery-hero', ['Little joys, everywhere you go', 'Get started'], 3],
	['side-gallery', ['Make every day a little more delightful', '12k+', '350+', '8yrs'], 9],
	['product-gallery', ['Going places', 'Meeting people', '$80.00', '$60.00'], 6],
	['classic-gallery', ['Make every day a little more delightful', 'Scenery'], 10],
	['mixed-gallery', ['Make every day a little more delightful'], 5],
	['login', ['Sign in', 'Product Inc.', 'Enter your credentials to continue'], 0],
	['login-card', ['Welcome back', 'Login with Apple', 'Login with Google'], 0],
	['login-split', ['Product Inc.', 'By clicking continue'], 3],
	['login-sso', ['Welcome back', 'Continue with SSO'], 0],
	['shell-top-nav', ['Lumen', 'Checkout', 'Sale', 'Service'], 0],
	['shell-side-nav', ['AI Assistant', 'StyleX migration notes', 'Sarah Chen'], 0],
	['shell-nav', ['AppShell.tsx', 'Share', 'README.md'], 0],
	['detail-page', ['All orders', '#1001'], 0],
	['product-detail', ['Solstice Mug & Plate Set', 'Add to Cart'], 0],
	['contact-form', ['Let\'s work together', 'Submit'], 0],
	['file-explorer', ['Chrome Apps', 'Applications'], 0],
	['messaging-shell', ['Jump to'], 0],
	['ide', ['Search'], 0],
	['form-two-column', ['Let\'s work together', 'Full name'], 0],
	['settings', ['Settings'], 0],
	['documentation', ['Breadcrumbs', 'Typeahead'], 0],
	['dashboard', ['Active users', 'Traffic channels'], 0],
	['dashboard-scorecard', ['Weekly Business Review', 'Net revenue'], 0],
	['dashboard-composition', ['My Portfolio', 'Top Assets'], 0],
	['dashboard-cohort-funnel', ['Funnel & cohort analytics'], 0],
	['dashboard-progress', ['Aurora Launch'], 0],
	['dashboard-alert-rail', ['Service Health Monitor', 'Deployments'], 0],
	['dashboard-comparison', ['Data Dashboard'], 0],
	['form-wizard', ['Create workspace', 'Workspace details'], 0],
	['form-wizard-dialog', ['Schedule a report', 'Sections to include'], 0],
	['form-wizard-inline', ['Set up continuous integration'], 0],
	['form-wizard-vertical', ['Alder Press', 'Author profile'], 0],
	['checkout-wizard', ['Review your cart'], 0],
	['payment-form', ['Payment Request'], 0],
	['incident-console', ['Incidents', 'Timeline'], 0],
	['kanban-board', ['Sprint Board'], 0],
	['library', ['RadioList', 'TreeList'], 0],
	['editor', ['Layers'], 0],
	['work-item-detail', ['Personalize the first-run onboarding flow'], 0],
	['ai-chat', ['JWT Token Refresh', 'Updated just now'], 0],
	['ai-chat-landing', ['Ask anything'], 0],
	['documentation-design', ['Usage', 'Best practices'], 0],
	['settings-sidebar', ['Account settings'], 0],
	['settings-dialog', ['Search settings'], 0],
	['theme-showcase', ['Studio AI'], 0],
	['canvas-editor', ['Layers'], 0],
]

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
	page.setDefaultTimeout(8000)
	const errors = []
	page.on('pageerror', (error) => errors.push(error.message))
	const go = async (name) => {
		await page.goto(`${base}/templates/${name}/?embed=1`, { waitUntil: 'networkidle' })
	}

	const has = async (text) => {
		const body = await page.locator('body').innerText()
		assert.ok(body.includes(text), `missing ${text}: ${body.slice(-1600)}`)
	}

	for (const [name, strings, imgCount] of PAGES) {
		if (only && !only.has(name)) {continue}
		await test(`${name}: rendered content`, async () => {
			await go(name)
			for (const text of strings) {await has(text)}
			assert.equal(await page.locator('.sb-pending').count(), 0, 'still pending')
			if (imgCount > 0) {
				assert.equal(await page.locator('img').count(), imgCount, 'image count')
			}
		})
	}

	const want = (name, fn) => (!only || only.has(name.split(':')[0]) ? test(name, fn) : Promise.resolve())

	// ── Behavior checks (real pointer/keyboard) ──

	await want('centered-hero: CTA buttons press without error', async () => {
		await go('centered-hero')
		await page.getByRole('button', { name: 'Get started', exact: true }).click()
		await page.getByRole('button', { name: 'Learn more', exact: true }).click()
	})

	await want('gallery-hero: CTA buttons press without error', async () => {
		await go('gallery-hero')
		await page.getByRole('button', { name: 'Get started', exact: true }).click()
	})

	await want('side-gallery: Explore presses without error', async () => {
		await go('side-gallery')
		await page.getByRole('button', { name: 'Explore', exact: true }).click()
	})

	await want('product-gallery: Get started presses without error', async () => {
		await go('product-gallery')
		await page.getByRole('button', { name: 'Get started', exact: true }).click()
	})

	await want('classic-gallery: tab filter narrows and restores the grid', async () => {
		await go('classic-gallery')
		const imgs = page.locator('img')
		assert.equal(await imgs.count(), 10)
		// Tabs without href render <button> (nav pattern, no role="tablist").
		await page.getByRole('button', { name: 'Scenery', exact: true }).click()
		assert.equal(await imgs.count(), 4, 'scenery filter')
		await page.getByRole('button', { name: 'Home', exact: true }).click()
		assert.equal(await imgs.count(), 3, 'home filter')
		await page.getByRole('button', { name: 'All', exact: true }).click()
		assert.equal(await imgs.count(), 10)
	})

	await want('login: empty submit shows the error banner; filled submit clears it', async () => {
		await go('login')
		await page.getByRole('button', { name: 'Sign in', exact: true }).click()
		await has('Please enter both email and password.')
		await page.getByLabel('Email').fill('you@example.com')
		await page.getByLabel('Password').fill('hunter2')
		await page.getByRole('button', { name: 'Sign in', exact: true }).click()
		const body = await page.locator('body').innerText()
		assert.ok(!body.includes('Please enter both'), 'error banner should clear')
	})

	await want('login-card: failed login reveals status and forgot-password link', async () => {
		await go('login-card')
		await page.getByRole('button', { name: 'Login', exact: true }).click()
		await has('Incorrect password. Try again.')
		await page.getByRole('link', { name: 'Forgot password?', exact: true }).waitFor()
	})

	await want('login-split: filled login reaches the signed-in state', async () => {
		await go('login-split')
		await page.getByLabel('Email').fill('name@company.com')
		await page.getByLabel('Password').fill('hunter2')
		await page.getByRole('button', { name: 'Login', exact: true }).click()
		await page.getByText("You're signed in", { exact: true }).waitFor()
		await has('Redirecting to your dashboard')
	})

	await want('login-sso: provider branch, back, fallback branch, failed sign-in', async () => {
		await go('login-sso')
		await page.getByLabel('Work email').fill('a@google.com')
		await page.getByRole('button', { name: 'Continue with SSO', exact: true }).click()
		await has('Sign in with Google Workspace')
		await page.getByRole('button', { name: 'Use a different email', exact: true }).click()
		await page.getByLabel('Work email').fill('a@unknown.dev')
		await page.getByRole('button', { name: 'Sign in', exact: true }).click()
		await has('a@unknown.dev')
		await page.getByRole('button', { name: 'Sign in', exact: true }).click()
		await has('Incorrect password. Try again.')
	})

	await want('shell-top-nav: Shop mega menu opens on hover and dismisses', async () => {
		await go('shell-top-nav')
		await page.getByRole('button', { name: 'Shop', exact: true }).first().hover()
		await page.waitForSelector('[role="menu"], .vx-popover-panel', { state: 'visible' })
		await has('The Autumn Edit')
		await page.keyboard.press('Escape')
		assert.equal(await page.locator('[role="menu"]:visible').count(), 0)
	})

	await want('shell-side-nav: rail collapse toggle and hover MoreMenu', async () => {
		await go('shell-side-nav')
		const collapse = page.getByRole('button', { name: 'Collapse sidebar', exact: true })
		await collapse.click()
		await page.getByRole('button', { name: 'Expand sidebar', exact: true }).waitFor()
		await page.getByRole('button', { name: 'Expand sidebar', exact: true }).click()
		await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).waitFor()
		// Hover a conversation row → the StatusDot swaps to the MoreMenu trigger.
		await page.getByText('Weekend trip planning', { exact: true }).hover()
		await page.getByRole('button', { name: 'Conversation options', exact: true }).click()
		await page.getByRole('menuitem', { name: 'Pin', exact: true }).waitFor()
		await has('Rename')
		await has('Archive')
		await has('Delete')
		await page.keyboard.press('Escape')
	})

	await want('shell-nav: File menu, ⌘K palette, query selection', async () => {
		await go('shell-nav')
		await page.getByRole('button', { name: 'File', exact: true }).click()
		await page.getByRole('menuitem', { name: /New File/ }).waitFor()
		await page.keyboard.press('Escape')
		await page.getByRole('menu').waitFor({ state: 'hidden' })
		await page.keyboard.press('Control+k')
		const paletteInput = page.getByRole('dialog').getByRole('combobox').first()
		await paletteInput.waitFor()
		await paletteInput.fill('save')
		await page.getByText('Save All', { exact: true }).waitFor()
		await page.getByText('Save All', { exact: true }).click()
		await paletteInput.waitFor({ state: 'hidden' })
	})

	if (!only) {
		await test('no uncaught browser errors on ported page routes', async () =>
			assert.deepEqual(errors, []))
	}

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
