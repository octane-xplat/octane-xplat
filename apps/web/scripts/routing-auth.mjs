// Production browser qualification with a controlled sign-in SDK; no images.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, preview } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../tests/fixtures/routing-auth/', import.meta.url))
const output = await mkdtemp(join(tmpdir(), 'xplat-routing-auth-'))
const checks = []
const errors = []
const check = (name, actual, expected) => {
	assert.deepEqual(actual, expected, name)
	checks.push(name)
}

let server, browser
try {
	const checked = spawnSync(
		'pnpm',
		['exec', 'tsrx-tsc', '--noEmit', '-p', 'tests/fixtures/routing-auth/tsconfig.json'],
		{ cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf8', timeout: 60000 },
	)

	assert.equal(checked.status, 0, (checked.stdout ?? '') + (checked.stderr ?? ''))
	const configuration = {
		configFile: false,
		root,
		logLevel: 'warn',
		plugins: [...octane()],
		resolve: { conditions: ['web'], extensions: ['.web.tsrx', '.tsrx', '.web.ts', '.ts', '.js'] },
		build: { outDir: output, emptyOutDir: false },
	}

	await build(configuration)
	server = await preview({ ...configuration, preview: { host: '127.0.0.1', port: 0 } })
	browser = await chromium.launch({ headless: true })
	const page = await browser.newPage()
	page.on('pageerror', (error) => errors.push(error.message))
	await page.goto(new URL('private/coat', server.resolvedUrls.local[0]).href)
	await page.waitForFunction(() => window.__routingAuth?.ready)
	check(
		'cold private link redirects before protected loading or rendering',
		await page.evaluate(() => ({
			...window.__routingAuth.state,
			path: location.pathname,
			returnTo: new URL(location.href).searchParams.get('returnTo'),
			private: !!document.getElementById('private-item'),
		})),
		{
			account: null,
			outcomes: [],
			returned: [],
			cancelled: [],
			loads: 0,
			route: '/login',
			path: '/login',
			returnTo: '/private/coat',
			private: false,
		},
	)

	const initialHistory = await page.evaluate(() => history.length)
	await page.getByRole('button', { name: 'Sign in', exact: true }).click()
	await page.evaluate(() => window.__routingAuth.complete(0, { kind: 'expired' }))
	await page.locator('#sign-in-status').filter({ hasText: 'expired' }).waitFor()
	check(
		'expired sign-in retains the login screen without starting its loader',
		await page.evaluate(() => ({
			account: window.__routingAuth.state.account,
			loads: window.__routingAuth.state.loads,
			route: window.__routingAuth.state.route,
		})),
		{ account: null, loads: 0, route: '/login' },
	)

	await page.getByRole('button', { name: 'Sign in', exact: true }).click()
	await page.evaluate(() =>
		window.__routingAuth.complete(1, { kind: 'success', account: { id: 'account-a' } }),
	)

	await page.waitForFunction(() => window.__routingAuth.state.returned.length === 1)
	check(
		'retry returns from the replacement owner with one fresh private load',
		await page.evaluate(() => ({
			state: window.__routingAuth.state,
			text: document.getElementById('private-item')?.textContent,
			path: location.pathname,
			history: history.length,
		})),
		{
			state: {
				account: { id: 'account-a' },
				outcomes: ['expired', 'success'],
				returned: ['committed'],
				cancelled: [],
				loads: 1,
				route: '/private/:id',
			},
			text: 'account-a:coat',
			path: '/private/coat',
			history: initialHistory,
		},
	)

	await page.evaluate(() => window.__routingAuth.open('boots'))
	check(
		'warm link prepares against the current account',
		await page.locator('#private-item').textContent(),
		'account-a:boots',
	)

	const oldPrivate = await page.locator('#private-item').elementHandle()
	const expired = await page.evaluate(() => window.__routingAuth.expire())
	check(
		'account expiry removes the previous private DOM',
		await oldPrivate.evaluate((node) => node.isConnected),
		false,
	)

	check(
		'current URL is rechecked and redirected without another private load',
		await page.evaluate(
			(result) => ({
				result: result.status,
				state: window.__routingAuth.state,
				path: location.pathname,
				private: !!document.getElementById('private-item'),
			}),
			expired,
		),
		{
			result: 'committed',
			state: {
				account: null,
				outcomes: ['expired', 'success'],
				returned: ['committed'],
				cancelled: [],
				loads: 2,
				route: '/login',
			},
			path: '/login',
			private: false,
		},
	)

	await page.goBack()
	await page.waitForFunction(
		() =>
			window.__routingAuth.state.route === '/login' &&
			new URL(location.href).searchParams.get('returnTo') === '/private/coat',
	)

	check(
		'browser restoration reauthorizes the older private URL',
		await page.evaluate(() => ({
			loads: window.__routingAuth.state.loads,
			private: !!document.getElementById('private-item'),
			account: window.__routingAuth.state.account,
		})),
		{ loads: 2, private: false, account: null },
	)

	await page.evaluate(() => window.__routingAuth.reset('/', { id: 'account-a' }))
	await page.evaluate(() => window.__routingAuth.open('coat'))
	await page.evaluate(() => window.__routingAuth.open('boots'))
	const previousAccount = await page.locator('#private-item').elementHandle()
	await page.evaluate(() => window.__routingAuth.switchAccount('account-b'))
	check(
		'switching accounts disposes the prior account screen',
		await previousAccount.evaluate((node) => node.isConnected),
		false,
	)

	await page.goBack()
	await page.waitForFunction(
		() => document.getElementById('private-item')?.textContent === 'account-b:coat',
	)

	check(
		'Back after an account switch loads current-account data',
		await page.evaluate(() => ({
			account: window.__routingAuth.state.account,
			loads: window.__routingAuth.state.loads,
		})),
		{ account: { id: 'account-b' }, loads: 3 },
	)

	await page.goForward()
	await page.waitForFunction(
		() => document.getElementById('private-item')?.textContent === 'account-b:boots',
	)

	check(
		'Forward cannot resurrect the other account DTO',
		await page.evaluate(() => ({
			text: document.getElementById('private-item')?.textContent,
			loads: window.__routingAuth.state.loads,
		})),
		{ text: 'account-b:boots', loads: 4 },
	)

	await page.goBack()
	await page.waitForFunction(
		() => document.getElementById('private-item')?.textContent === 'account-b:coat',
	)

	await page.evaluate(() => window.__routingAuth.expire())
	await page.goForward()
	await page.waitForFunction(
		() =>
			window.__routingAuth.state.route === '/login' &&
			new URL(location.href).searchParams.get('returnTo') === '/private/boots',
	)

	check(
		'Forward after expiry reruns authorization before private loading',
		await page.evaluate(() => ({
			account: window.__routingAuth.state.account,
			loads: window.__routingAuth.state.loads,
			private: !!document.getElementById('private-item'),
		})),
		{ account: null, loads: 5, private: false },
	)

	await page.evaluate(() => window.__routingAuth.reset('/'))
	await page.evaluate(() => window.__routingAuth.modal('/private/coat'))
	await page.getByRole('button', { name: 'Sign in', exact: true }).click()
	await page.getByRole('button', { name: 'Cancel sign-in', exact: true }).click()
	await page.waitForFunction(
		() =>
			window.__routingAuth.state.cancelled.length === 1 &&
			!document.querySelector('[role="dialog"]'),
	)

	await page.evaluate(() =>
		window.__routingAuth.complete(0, { kind: 'success', account: { id: 'account-a' } }),
	)

	check(
		'late SDK completion after modal cancellation cannot restore authority or content',
		await page.evaluate(() => window.__routingAuth.state),
		{
			account: null,
			outcomes: ['cancelled'],
			returned: [],
			cancelled: ['committed'],
			loads: 0,
			route: '/',
		},
	)

	await page.evaluate(() => window.__routingAuth.reset('/'))
	await page.evaluate(() => window.__routingAuth.modal('/private/coat'))
	await page.getByRole('button', { name: 'Sign in', exact: true }).click()
	await page.evaluate(() =>
		window.__routingAuth.complete(0, { kind: 'success', account: { id: 'account-a' } }),
	)

	await page.waitForFunction(() => window.__routingAuth.state.returned.length === 1)
	check(
		'modal success transfers its return to the replacement owner',
		await page.evaluate(() => ({
			state: window.__routingAuth.state,
			dialog: !!document.querySelector('[role="dialog"]'),
			text: document.getElementById('private-item')?.textContent,
		})),
		{
			state: {
				account: { id: 'account-a' },
				outcomes: ['success'],
				returned: ['committed'],
				cancelled: [],
				loads: 1,
				route: '/private/:id',
			},
			dialog: false,
			text: 'account-a:coat',
		},
	)

	await page.evaluate(() => window.__routingAuth.reset('/login'))
	const retired = await page.evaluate(() => window.__routingAuth.returnFromOldOwner())
	check('a return from the retiring owner is cancelled', retired.status, 'cancelled')
	check(
		'a retired navigator cannot revive protected DOM',
		await page.evaluate(() => ({
			route: window.__routingAuth.state.route,
			private: !!document.getElementById('private-item'),
		})),
		{ route: null, private: false },
	)

	check(
		'the replacement owner can prepare a deliberate return',
		(await page.evaluate(() => window.__routingAuth.returnUrl('/private/coat'))).status,
		'committed',
	)

	await page.evaluate(() => window.__routingAuth.reset('/login'))
	const invalid = await page.evaluate(() => window.__routingAuth.returnUrl('/private/%ZZ'))
	check(
		'a malformed return preserves the login route',
		await page.evaluate(
			(status) => ({
				status,
				route: window.__routingAuth.state.route,
				loads: window.__routingAuth.state.loads,
			}),
			invalid.status,
		),
		{ status: 'invalid-input', route: '/login', loads: 0 },
	)

	const external = await page.evaluate(() =>
		window.__routingAuth.returnUrl('https://untrusted.invalid/private/coat'),
	)

	check('an untrusted return origin is rejected', external.status, 'invalid-input')
	await page.evaluate(() => window.__routingAuth.dispose())
	check(
		'all authentication owners are removed on disposal',
		await page.locator('#login, #private-item, [role="dialog"]').count(),
		0,
	)

	check('no uncaught authentication errors', errors, [])
	console.log(
		JSON.stringify({
			target: 'chromium',
			productionBuild: true,
			controlledSdk: true,
			screenshots: false,
			passed: checks.length,
			checks,
		}),
	)
} finally {
	await browser?.close()
	await new Promise((resolve) => (server ? server.httpServer.close(resolve) : resolve()))
	await rm(output, { recursive: true, force: true })
}
