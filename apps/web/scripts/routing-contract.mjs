// Production-built CSR navigation. No screenshots or visual analysis.
import { build, preview } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { chromium } from 'playwright'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const root = fileURLToPath(new URL('../tests/fixtures/routing-contract/', import.meta.url))
const workspace = fileURLToPath(new URL('../../../', import.meta.url))
for (const args of [
	['--filter', '@octane-xplat/ui', 'typegen'],
	['--filter', '@octane-xplat/cli', 'build'],
]) {
	const built = spawnSync('pnpm', args, { cwd: workspace, encoding: 'utf8', timeout: 120000 })
	assert.equal(built.status, 0, (built.stdout ?? '') + (built.stderr ?? ''))
}

const { generateRoutes } = await import('../../../packages/cli/dist/commands/routes.js')
await generateRoutes(root, 'app', 'routes.gen', { bake: false })
for (const project of ['tsconfig.json', 'tsconfig.source.json']) {
	const checked = spawnSync(
		'pnpm',
		['exec', 'tsrx-tsc', '--noEmit', '-p', 'tests/fixtures/routing-contract/' + project],
		{
			cwd: fileURLToPath(new URL('../', import.meta.url)),
			encoding: 'utf8',
			timeout: 60000,
		},
	)

	assert.equal(checked.status, 0, (checked.stdout ?? '') + (checked.stderr ?? ''))
}

// Optional retained production artifact for a second engine/desktop host.
const artifactBase = process.env.XPLAT_ROUTING_ARTIFACT_DIR
if (artifactBase) {await mkdir(resolve(artifactBase), { recursive: true })}
const output = await mkdtemp(join(artifactBase ? resolve(artifactBase) : tmpdir(), 'xplat-routing-browser-'))
let server
let browser
const checks = []
const errors = []
const check = (name, actual, expected) => {
	assert.deepEqual(actual, expected, name)
	checks.push(name)
}

try {
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
	await page.goto(server.resolvedUrls.local[0])
	await page.waitForFunction(() => !!window.__routing)
	check(
		'push commits DOM before resolving',
		await page.evaluate(async () => ({
			status: await window.__routing.push('coat'),
			text: document.getElementById('item')?.textContent,
			path: location.pathname,
		})),
		{ status: 'committed', text: 'coat:coat1:0', path: '/items/coat' },
	)

	check(
		'named file callbacks validate search and accumulate guard context',
		await page.evaluate(() => window.__routing.fileContract),
		{ search: { tab: 'details' }, context: { account: 'account-a', owner: 'account-a' } },
	)

	await page.getByRole('button', { name: 'Increment' }).click()
	check(
		'browser pointer input updates screen',
		await page.locator('#item').textContent(),
		'coat:coat1:1',
	)

	await page.evaluate(() => window.__routing.retainButton())
	check(
		'refresh preserves DOM and local state',
		await page.evaluate(async () => ({
			status: await window.__routing.refresh(),
			same: window.__routing.sameButton,
			text: document.getElementById('item')?.textContent,
		})),
		{ status: 'committed', same: true, text: 'coat:coat2:1' },
	)

	check(
		'replace remounts the replacement',
		await page.evaluate(async () => ({
			status: await window.__routing.replace('hat'),
			same: window.__routing.sameButton,
			text: document.getElementById('item')?.textContent,
		})),
		{ status: 'committed', same: false, text: 'hat:hat3:0' },
	)

	check(
		'Back renders the base before resolving',
		await page.evaluate(async () => ({
			status: await window.__routing.back(),
			text: document.getElementById('base')?.textContent,
			path: location.pathname,
		})),
		{ status: 'committed', text: 'Base', path: '/' },
	)

	await page.goForward()
	await page.waitForFunction(() => document.getElementById('item')?.textContent === 'hat:hat4:0')
	check(
		'browser Forward reruns preparation',
		await page.locator('#item').textContent(),
		'hat:hat4:0',
	)

	await page.getByRole('button', { name: 'Increment', exact: true }).focus()
	check('modal opens', await page.evaluate(() => window.__routing.modal()), 'committed')
	check(
		'modal owns focus and makes the background inert',
		await page.evaluate(() => {
			const panel = document.querySelector('[role="dialog"]')
			return {
				focused: document.activeElement === panel,
				modal: panel?.getAttribute('aria-modal'),
				backgroundInert: document.getElementById('app').hasAttribute('inert'),
			}
		}),
		{ focused: true, modal: 'true', backgroundInert: true },
	)

	await page.keyboard.press('Tab')
	check(
		'Tab remains inside a dialog without controls',
		await page.evaluate(() => document.activeElement === document.querySelector('[role="dialog"]')),
		true,
	)

	check(
		'modal owns subsequent navigation',
		await page.evaluate(async () => ({
			status: await window.__routing.modalPush(),
			count: window.__routing.modalCount,
			screens: document.querySelectorAll('#item').length,
		})),
		{ status: 'committed', count: 1, screens: 2 },
	)

	check(
		'modal screen changes keep focus in the same flow',
		await page.evaluate(() =>
			document.querySelector('[role="dialog"]').contains(document.activeElement),
		),
		true,
	)

	check(
		'dismiss removes the whole modal flow',
		await page.evaluate(async () => ({
			status: await window.__routing.dismiss(),
			count: window.__routing.modalCount,
			text: document.getElementById('item')?.textContent,
			path: location.pathname,
		})),
		{ status: 'committed', count: 0, text: 'hat:hat6:0', path: '/items/hat' },
	)

	check(
		'dismissal restores the revalidated opener and background access',
		await page.evaluate(() => ({
			focused: document.activeElement === document.getElementById('item'),
			backgroundInert: document.getElementById('app').hasAttribute('inert'),
		})),
		{ focused: true, backgroundInert: false },
	)

	check(
		'browser reset is explicitly unsupported',
		await page.evaluate(() => window.__routing.reset()),
		'unsupported',
	)

	for (const action of ['push', 'replace', 'modal']) {
		check(
			'failed ' + action + ' retains DOM, state, URL and history',
			await page.evaluate(async (action) => {
				const button = document.getElementById('item')
				const before = {
					href: location.href,
					state: JSON.stringify(history.state),
					length: history.length,
					text: button?.textContent,
				}
				const result = await window.__routing.fail(action)
				return {
					result,
					same: button === document.getElementById('item'),
					sameText: button?.textContent === before.text,
					sameUrl: location.href === before.href,
					sameState: JSON.stringify(history.state) === before.state,
					sameLength: history.length === before.length,
					modalCount: window.__routing.modalCount,
				}
			}, action),
			{
				result: { status: 'failed', phase: 'commit' },
				same: true,
				sameText: true,
				sameUrl: true,
				sameState: true,
				sameLength: true,
				modalCount: 0,
			},
		)
	}

	const cold = await browser.newPage()
	cold.on('pageerror', (error) => errors.push(error.message))
	await cold.goto(new URL('items/cold?tab=activity', server.resolvedUrls.local[0]).href)
	await cold.waitForFunction(() => document.getElementById('item')?.textContent === 'cold:cold1:0')
	check(
		'cold CSR entry uses validated loader data once without pushing history',
		await cold.evaluate(() => ({
			text: document.getElementById('item')?.textContent,
			contract: window.__routing.fileContract,
			loads: window.__routing.loads,
			contextReads: window.__routing.contextReads,
			sameHistoryLength: history.length === window.__routing.initialHistoryLength,
		})),
		{
			text: 'cold:cold1:0',
			contract: {
				search: { tab: 'activity' },
				context: { account: 'account-a', owner: 'account-a' },
			},
			loads: 1,
			contextReads: 1,
			sameHistoryLength: true,
		},
	)

	await cold.close()
	const moved = await browser.newPage()
	moved.on('pageerror', (error) => errors.push(error.message))
	await moved.goto(new URL('moved', server.resolvedUrls.local[0]).href)
	await moved.waitForFunction(() => document.getElementById('item')?.textContent === 'coat:coat1:0')
	check(
		'cold loader redirect commits only the validated final screen without adding history',
		await moved.evaluate(() => ({
			path: location.pathname + location.search,
			loads: window.__routing.loads,
			sameHistoryLength: history.length === window.__routing.initialHistoryLength,
			contract: window.__routing.fileContract,
		})),
		{
			path: '/items/coat?tab=activity',
			loads: 1,
			sameHistoryLength: true,
			contract: {
				search: { tab: 'activity' },
				context: { account: 'account-a', owner: 'account-a' },
			},
		},
	)

	await moved.close()
	const tabbed = await browser.newPage()
	tabbed.on('pageerror', (error) => errors.push(error.message))
	await tabbed.goto(server.resolvedUrls.local[0])
	await tabbed.waitForFunction(() => !!window.__routing)
	await tabbed.getByRole('tab', { name: 'Right', exact: true }).click()
	await tabbed.getByRole('button', { name: 'Increment tab', exact: true }).click()
	check(
		'configured Tabs commit to the owning named pane',
		await tabbed.evaluate(async () => ({
			status: await window.__routing.named('tabbed'),
			path: location.pathname,
			stack: window.__routing.currentStack,
			text: document.getElementById('item')?.textContent,
		})),
		{ status: 'committed', path: '/@right/items/tabbed', stack: 'right', text: 'tabbed:tabbed1:0' },
	)

	check(
		'configured Tabs retain shell identity and state across named and root Back',
		await tabbed.evaluate(async () => {
			const counter = document.getElementById('tab-count')
			const namedBack = await window.__routing.ownedBack()
			const pushed = await window.__routing.push('root')
			const retainedWhileCovered = document.getElementById('tab-count') === counter
			const rootBack = await window.__routing.back()
			return {
				namedBack,
				pushed,
				rootBack,
				retainedWhileCovered,
				same: document.getElementById('tab-count') === counter,
				text: counter?.textContent,
				selected: document.querySelector('[data-tab-value="right"]')?.getAttribute('aria-selected'),
			}
		}),
		{
			namedBack: 'committed',
			pushed: 'committed',
			rootBack: 'committed',
			retainedWhileCovered: true,
			same: true,
			text: 'Tab count 1',
			selected: 'true',
		},
	)

	await tabbed.close()
	const canonical = await browser.newPage()
	canonical.on('pageerror', (error) => errors.push(error.message))
	await canonical.goto(server.resolvedUrls.local[0])
	await canonical.waitForFunction(() => !!window.__routing)
	await canonical.evaluate(() => window.__routing.push('canonical'))
	await canonical.waitForFunction(() => window.__routing.observed.id === 'canonical')
	check(
		'canonical navigation and hooks share the generated client entry',
		await canonical.evaluate(() => ({
			observed: window.__routing.observed,
			text: document.getElementById('item')?.textContent,
			path: location.pathname,
			loads: window.__routing.loads,
		})),
		{
			observed: { id: 'canonical', back: true, sameRoute: true },
			text: 'canonical:canonical1:0',
			path: '/items/canonical',
			loads: 1,
		},
	)

	await canonical.evaluate(() => window.__routing.push('dialog', true))
	await canonical.waitForFunction(() => window.__routing.modalId === 'dialog')
	check(
		'canonical modal shares the owned modal flow',
		await canonical.evaluate(() => ({
			modalId: window.__routing.modalId,
			rootId: window.__routing.observed.id,
			count: window.__routing.modalCount,
		})),
		{ modalId: 'dialog', rootId: 'canonical', count: 1 },
	)

	await canonical.evaluate(() => window.__routing.dismiss())
	await canonical.waitForFunction(() => window.__routing.modalCount === 0)
	await canonical.evaluate(() => window.__routing.back())
	await canonical.waitForFunction(() => !window.__routing.observed.back)
	check(
		'canonical Back returns through the same browser history',
		await canonical.evaluate(() => ({
			path: location.pathname,
			text: document.getElementById('base')?.textContent,
			loads: window.__routing.loads,
		})),
		{ path: '/', text: 'Base', loads: 3 },
	)

	check(
		'canonical incoming URLs use canonical matching',
		await canonical.evaluate(async () => ({
			known: await window.__routing.incoming('xplat://items/linked'),
			unknown: await window.__routing.incoming('/missing'),
		})),
		{ known: 'committed', unknown: 'not-found' },
	)

	await canonical.waitForFunction(
		() => document.getElementById('item')?.textContent === 'linked:linked4:0',
	)

	await canonical.close()
	const animated = await browser.newPage()
	animated.on('pageerror', (error) => errors.push(error.message))
	await animated.goto(server.resolvedUrls.local[0])
	await animated.waitForFunction(() => !!window.__routing)
	await animated.evaluate(() => window.__routing.push('before'))
	await animated.addStyleTag({
		content:
			'::view-transition-old(root), ::view-transition-new(root) { animation-duration: 300ms; }',
	})

	await animated.evaluate(() => {
		const start = document.startViewTransition.bind(document)
		window.__motionSnapshots = []
		window.__motionTypes = []
		document.startViewTransition = (update) => {
			const transition = start(async () => {
				const before = document.getElementById('item')?.textContent
				await update()
				window.__motionSnapshots.push({
					before,
					after: document.getElementById('item')?.textContent,
					path: location.pathname,
				})
			})
			void transition.ready.then(
				() => window.__motionTypes.push([...transition.types]),
				() => {},
			)
			return transition
		}
	})

	check(
		'CSR navigation resolves after DOM commit and before real animation finishes',
		await animated.evaluate(() => window.__routing.motion('animated', 'detail')),
		{ status: 'committed', finished: false, text: 'animated:animated2:0', path: '/items/animated' },
	)

	check(
		'custom browser transition completes',
		await animated.evaluate(() => window.__routing.motionFinished()),
		{ status: 'completed' },
	)

	check(
		'actual View Transition callback brackets the visible DOM update',
		await animated.evaluate(() => window.__motionSnapshots),
		[{ before: 'before:before1:0', after: 'animated:animated2:0', path: '/items/animated' }],
	)

	check(
		'registered transition receives prepared forward matches',
		await animated.evaluate(() => window.__routing.motionContext),
		{ direction: 'forward', action: 'push', from: '/items/before', to: '/items/animated' },
	)

	check('custom CSS type is applied', await animated.evaluate(() => window.__motionTypes), [
		['detail-forward'],
	])

	await animated.evaluate(() => window.__routing.back())
	await animated.waitForFunction(() => window.__motionTypes.length === 2)
	check(
		'Back selects the departing transition with reverse direction',
		await animated.evaluate(() => window.__routing.motionContext),
		{ direction: 'back', action: 'back', from: '/items/animated', to: '/items/before' },
	)

	check('Back applies its CSS type', await animated.evaluate(() => window.__motionTypes[1]), [
		'detail-back',
	])

	await animated.evaluate(() => window.__routing.retainButton())
	check(
		'modal navigation commits inside its own browser effect',
		await animated.evaluate(() => window.__routing.motion('motion-modal', 'detail', true)),
		{
			status: 'committed',
			finished: false,
			text: 'motion-modal:motion-modal4:0',
			path: '/items/motion-modal',
		},
	)

	check(
		'modal browser animation completes',
		await animated.evaluate(() => window.__routing.motionFinished()),
		{ status: 'completed' },
	)

	check(
		'animated modal retains the presenting DOM',
		await animated.evaluate(() => ({
			same: window.__routing.sameButton,
			count: window.__routing.modalCount,
		})),
		{ same: true, count: 1 },
	)

	await animated.evaluate(() => window.__routing.dismiss())
	await animated.waitForFunction(() => window.__motionTypes.length === 4)
	check(
		'animated dismissal restores its presenter',
		await animated.evaluate(() => ({
			same: window.__routing.sameButton,
			count: window.__routing.modalCount,
			path: location.pathname,
		})),
		{ same: true, count: 0, path: '/items/before' },
	)

	check(
		'overlapping real effects interrupt animation without undoing either route commit',
		await animated.evaluate(async () => {
			const style = document.createElement('style')
			style.textContent =
				'::view-transition-old(root), ::view-transition-new(root) { animation-duration: 10s; }'
			document.head.append(style)
			const first = await window.__routing.motion('overlap-one', 'detail')
			const firstFinished = window.__routing.motionFinished()
			const second = await window.__routing.motion('overlap-two', 'detail')
			const previous = await firstFinished
			for (const animation of document.getAnimations()) {
				animation.finish()
			}
			const current = await window.__routing.motionFinished()
			style.remove()
			return {
				first: first.status,
				second: second.status,
				previous,
				current,
				path: location.pathname,
			}
		}),
		{
			first: 'committed',
			second: 'committed',
			previous: { status: 'skipped', reason: 'interrupted' },
			current: { status: 'completed' },
			path: '/items/overlap-two',
		},
	)

	const motionStarts = await animated.evaluate(() => window.__motionSnapshots.length)
	await animated.emulateMedia({ reducedMotion: 'reduce' })
	await animated.evaluate(() => window.__routing.motion('reduced', 'detail'))
	check(
		'reduced motion preserves a successful route commit',
		await animated.evaluate(() => window.__routing.motionFinished()),
		{ status: 'skipped', reason: 'reduced-motion' },
	)

	check(
		'reduced motion does not start another browser transition',
		await animated.evaluate(() => window.__motionSnapshots.length),
		motionStarts,
	)

	await animated.emulateMedia({ reducedMotion: 'no-preference' })
	await animated.evaluate(() => {
		document.startViewTransition = undefined
	})

	await animated.evaluate(() => window.__routing.motion('unsupported', 'detail'))
	check(
		'unsupported browser animation preserves navigation',
		await animated.evaluate(() => window.__routing.motionFinished()),
		{ status: 'skipped', reason: 'unsupported' },
	)

	await animated.close()
	await page.evaluate(() => window.__routing.motion('checked-presenter', 'none'))
	check(
		'runtime validation does not load, guard or replace the current screen',
		await page.evaluate(() => window.__routing.installChecked()),
		{ status: 'valid', href: '/checked/opaque?tab=activity', unchanged: true },
	)

	const checkedLink = page.getByRole('link', { name: 'Open checked runtime', exact: true })
	check(
		'checked runtime links keep a real canonical href',
		await checkedLink.getAttribute('href'),
		'/checked/opaque?tab=activity',
	)

	check(
		'async runtime schema failures do not load',
		await page.evaluate(() => window.__routing.invalidChecked()),
		{ status: 'invalid-input', path: 'search', runtimeLoads: 0 },
	)

	await checkedLink.click()
	await page.waitForFunction(() => window.__routing.checkedState.runtimeLoads === 1)
	check(
		'an opaque checked link navigates through the production DOM renderer',
		await page.evaluate(() => window.__routing.checkedState),
		{
			contract: 'runtime',
			runtimeLoads: 1,
			path: '/checked/opaque',
			search: '?tab=activity',
			text: 'opaque:runtime-opaque:0',
		},
	)

	await page.evaluate(() => window.__routing.removeChecked())
	check(
		'plugin removal retains a checked anchor without a render error',
		await checkedLink.getAttribute('href'),
		'/checked/opaque?tab=activity',
	)

	await checkedLink.click()
	check(
		'activating an expired checked route preserves the committed screen and URL',
		await page.evaluate(() => window.__routing.checkedState),
		{
			contract: 'runtime',
			runtimeLoads: 1,
			path: '/checked/opaque',
			search: '?tab=activity',
			text: 'opaque:runtime-opaque:0',
		},
	)

	await page.evaluate(() => window.__routing.motion('filters', 'none'))
	await page.waitForSelector('#search-activity')
	const beforeSearch = await page.evaluate(() => window.__routing.searchState)
	await page.locator('#search-activity').click()
	await page.waitForFunction(() => location.search === '?tab=activity')
	const changedSearch = await page.evaluate(() => window.__routing.searchState)
	check('scoped search editing replaces history and reruns its loader', changedSearch, {
		...beforeSearch,
		href: '/items/filters?tab=activity',
		tab: 'activity',
		loads: beforeSearch.loads + 1,
	})

	await page.locator('#search-clear').click()
	await page.waitForFunction(() => location.search === '')
	check(
		'omitted search fields are removed and defaults are validated again',
		await page.evaluate(() => window.__routing.searchState),
		{ ...beforeSearch, loads: beforeSearch.loads + 2 },
	)

	await page.locator('#search-push').click()
	await page.waitForFunction(() => location.search === '?tab=activity')
	check(
		'opt-in search push creates a Back destination',
		(await page.evaluate(() => window.__routing.searchState)).length,
		beforeSearch.length + 1,
	)

	await page.evaluate(() => window.__routing.back())
	await page.waitForFunction(() => location.pathname === '/items/filters' && location.search === '')
	check(
		'Back restores the prior filter entry',
		(await page.evaluate(() => window.__routing.searchState)).tab,
		'details',
	)

	await page.evaluate(() => window.__routing.captureSearchUpdate())
	await page.evaluate(() => window.__routing.motion('another-record', 'none'))
	const beforeStaleSearch = await page.evaluate(() => window.__routing.searchState)
	check(
		'a stale search callback cannot edit another record of the same pattern',
		await page.evaluate(() => window.__routing.staleSearchUpdate()),
		'cancelled',
	)

	check(
		'stale search refusal leaves URL data and history intact',
		await page.evaluate(() => window.__routing.searchState),
		beforeStaleSearch,
	)

	for (const kind of [
		'strip',
		'side',
		'top',
		'mega',
		'breadcrumb',
		'heading',
		'tab',
		'dropdown',
		'context',
		'top-menu',
		'mega-menu',
		'overflow',
	]) {
		await page.evaluate((kind) => window.__routing.showChrome(kind), kind)
		const host = page.locator('#navigation-widgets')
		await host.waitFor()
		const beforeLoads = await page.evaluate(() => window.__routing.loads)
		if (['dropdown', 'context', 'top-menu', 'mega-menu', 'overflow'].includes(kind)) {
			await host
				.getByRole('button', {
					name:
						kind === 'overflow'
							? 'More ancestors'
							: kind === 'context'
								? 'Open actions'
								: 'Actions',
					exact: true,
				})
				.click()
		}

		const link = page.locator(`a[href="/items/chrome-${kind}?tab=activity"]`).first()
		await link.waitFor()
		if (kind === 'top-menu' || kind === 'mega-menu') {
			await link.focus()
			await page.keyboard.press('ArrowDown')
			await page.keyboard.press('Enter')
		} else {
			await link.click()
		}

		await page.waitForFunction((id) => location.pathname === '/items/' + id, 'chrome-' + kind)
		check(
			kind + ' navigation uses the typed request once',
			await page.evaluate(() => ({
				path: location.pathname,
				search: location.search,
				tab: window.__routing.fileContract?.search.tab,
				loads: window.__routing.loads,
			})),
			{
				path: '/items/chrome-' + kind,
				search: '?tab=activity',
				tab: 'activity',
				loads: beforeLoads + 1,
			},
		)
	}

	const beforeFeedback = await page.evaluate(() => ({
		href: location.href,
		item: document.getElementById('item')?.textContent,
	}))

	await page.evaluate(() => window.__routing.beginFeedback())
	await page
		.locator('#item')
		.locator('..')
		.locator('#feedback-status')
		.filter({ hasText: /^pending$/ })
		.waitFor()

	check(
		'pending feedback retains the current URL and screen',
		await page.evaluate(() => ({
			href: location.href,
			item: document.getElementById('item')?.textContent,
		})),
		beforeFeedback,
	)

	check(
		'loader failure settles normally',
		await page.evaluate(() => window.__routing.releaseFeedback()),
		'failed',
	)

	await page
		.locator('#item')
		.locator('..')
		.locator('#feedback-status')
		.filter({ hasText: 'failed:loader' })
		.waitFor()

	check(
		'failed feedback retains the current URL and screen',
		await page.evaluate(() => ({
			href: location.href,
			item: document.getElementById('item')?.textContent,
		})),
		beforeFeedback,
	)

	await page.evaluate(() => window.__routing.allowFeedback())
	await page.locator('#item').locator('..').locator('#feedback-retry').click()
	await page.waitForFunction(() => location.pathname === '/feedback/recover')
	check(
		'visible retry reruns the failed destination and clears feedback',
		await page.evaluate(() => ({
			status: window.__routing.navigationFeedback.status,
			loads: window.__routing.feedbackLoads,
			text: document.getElementById('item')?.textContent,
		})),
		{ status: 'idle', loads: 2, text: 'recover:feedback-recover:0' },
	)

	const coldFailure = await browser.newPage()
	coldFailure.on('pageerror', (error) => errors.push(error.message))
	await coldFailure.goto(new URL('/feedback/initial', server.resolvedUrls.local[0]).href)
	await coldFailure.locator('#feedback-status').filter({ hasText: 'failed:loader' }).waitFor()
	const failureHistory = await coldFailure.evaluate(() => history.length)
	await coldFailure.evaluate(() => window.__routing.allowFeedback())
	await coldFailure.locator('#feedback-retry').click()
	await coldFailure.waitForFunction(() => window.__routing.navigationFeedback.status === 'idle')
	check(
		'cold CSR failure retries once without adding browser history',
		await coldFailure.evaluate(() => ({
			loads: window.__routing.feedbackLoads,
			length: history.length,
			path: location.pathname,
			text: document.getElementById('item')?.textContent,
		})),
		{
			loads: 2,
			length: failureHistory,
			path: '/feedback/initial',
			text: 'initial:feedback-initial:0',
		},
	)

	await coldFailure.close()

	await page.evaluate(async () => {
		window.__routing.setHistoryAccess(true, 'account-a')
		await window.__routing.motion('guarded-history', 'none')
		await window.__routing.settings()
	})

	const beforeGuardedBack = await page.evaluate(() => ({
		path: location.pathname,
		loads: window.__routing.loads,
		length: history.length,
	}))

	await page.evaluate(() => window.__routing.setHistoryAccess(false, 'account-b'))
	check(
		'imperative Back refuses a formerly admitted route before history moves',
		await page.evaluate(async () => ({
			status: await window.__routing.back(),
			path: location.pathname,
			loads: window.__routing.loads,
			length: history.length,
		})),
		{ status: 'forbidden', ...beforeGuardedBack },
	)

	await page.goBack()
	await page.waitForFunction(
		() =>
			location.pathname === '/settings' && window.__routing.navigationFeedback.status === 'failed',
	)

	check(
		'browser Back corrects a denied destination without loading protected data',
		await page.evaluate(() => ({
			path: location.pathname,
			loads: window.__routing.loads,
			length: history.length,
			text: document.getElementById('settings')?.textContent,
		})),
		{ ...beforeGuardedBack, text: 'Settings' },
	)

	await page.evaluate(() => window.__routing.setHistoryAccess(true, 'account-b'))
	await page.goBack()
	await page.waitForFunction(
		() =>
			location.pathname === '/items/guarded-history' &&
			window.__routing.navigationFeedback.status === 'idle',
	)

	check(
		'browser Back uses the new account context and loads once after admission',
		await page.evaluate(() => ({
			account: window.__routing.fileContract.context.account,
			loads: window.__routing.loads,
			length: history.length,
		})),
		{ account: 'account-b', loads: beforeGuardedBack.loads + 1, length: beforeGuardedBack.length },
	)

	await page.evaluate(async () => {
		await window.__routing.settings()
		await window.__routing.motion('guarded-forward', 'none')
		await window.__routing.back()
		window.__routing.setHistoryAccess(false, 'account-b')
	})

	const beforeGuardedForward = await page.evaluate(() => ({
		loads: window.__routing.loads,
		length: history.length,
	}))

	await page.goForward()
	await page.waitForFunction(
		() =>
			location.pathname === '/settings' && window.__routing.navigationFeedback.status === 'failed',
	)

	check(
		'browser Forward corrects guard denial and records its direction',
		await page.evaluate(() => ({
			path: location.pathname,
			loads: window.__routing.loads,
			length: history.length,
			action: window.__routing.navigationFeedback.action,
		})),
		{ path: '/settings', ...beforeGuardedForward, action: 'forward' },
	)

	await page.evaluate(() => window.__routing.setHistoryAccess(true, 'account-b'))
	check(
		'retry repeats Forward with fresh preparation and no extra history',
		await page.evaluate(async () => ({
			status: await window.__routing.retryHistory(),
			path: location.pathname,
			loads: window.__routing.loads,
			length: history.length,
			account: window.__routing.fileContract.context.account,
		})),
		{
			status: 'committed',
			path: '/items/guarded-forward',
			loads: beforeGuardedForward.loads + 1,
			length: beforeGuardedForward.length,
			account: 'account-b',
		},
	)

	const modalHistory = await browser.newPage()
	modalHistory.on('pageerror', (error) => errors.push(error.message))
	await modalHistory.goto(server.resolvedUrls.local[0])
	await modalHistory.waitForFunction(() => !!window.__routing)
	for (const external of [false, true]) {
		await modalHistory.evaluate(async () => {
			window.__routing.setHistoryModalRedirect(false)
			await window.__routing.motion('history-private', 'none')
			await window.__routing.settings()
			window.__routing.setHistoryModalRedirect(true)
		})

		if (external) {
			await modalHistory.goBack()
		} else {
			check(
				'imperative history modal redirect commits',
				await modalHistory.evaluate(() => window.__routing.back()),
				'committed',
			)
		}

		await modalHistory.waitForFunction(
			() =>
				location.pathname === '/history-login' &&
				window.__routing.navigationFeedback.status === 'idle',
		)

		check(
			(external ? 'browser' : 'imperative') +
				' Back presents a prepared modal above the admitted source',
			await modalHistory.evaluate(() => ({
				...window.__routing.historyModalState,
				login: document.getElementById('history-login')?.textContent,
				protectedVisible: !!document.getElementById('item'),
			})),
			{
				loads: external ? 2 : 1,
				main: '/settings',
				modals: 1,
				login: 'Sign in',
				protectedVisible: false,
			},
		)

		await modalHistory.evaluate(() => window.__routing.setHistoryModalRedirect(false))
		check(
			'history redirect modal dismisses to the admitted source',
			await modalHistory.evaluate(async () => ({
				status: await window.__routing.dismiss(),
				path: location.pathname,
				...window.__routing.historyModalState,
			})),
			{
				status: 'committed',
				path: '/settings',
				loads: external ? 2 : 1,
				main: '/settings',
				modals: 0,
			},
		)
	}

	await modalHistory.close()
	const focus = await browser.newPage()
	focus.on('pageerror', (error) => errors.push(error.message))
	await focus.goto(server.resolvedUrls.local[0])
	await focus.waitForFunction(() => !!window.__routing)
	await focus.evaluate(() => window.__routing.push('focus-owner'))
	await focus.getByRole('button', { name: 'Increment', exact: true }).focus()
	await focus.evaluate(() => window.__routing.modal())
	await focus.evaluate(() => window.__routing.modalPush())
	await focus.keyboard.press('Tab')
	check('browser Tab enters the active modal controls', await focus.evaluate(() =>
		document.activeElement === document.querySelector('[role="dialog"] #item')), true)
	await focus.keyboard.press('Tab')
	check('browser Tab wraps inside the active modal', await focus.evaluate(() =>
		document.querySelector('[role="dialog"]').contains(document.activeElement)), true)
	check('inert presenter rejects programmatic focus', await focus.evaluate(() => {
		document.getElementById('item').focus()
		return document.querySelector('[role="dialog"]').contains(document.activeElement)
	}), true)
	await focus.keyboard.press('Escape')
	await focus.waitForFunction(() => window.__routing.modalCount === 0)
	check('browser Escape dismisses the owned modal and restores its opener', await focus.evaluate(() => ({
		path: location.pathname, focused: document.activeElement === document.getElementById('item'),
	})), { path: '/items/focus-owner', focused: true })
	await focus.close()
	const effects = await browser.newPage()
	effects.on('pageerror', (error) => errors.push(error.message))
	await effects.goto(server.resolvedUrls.local[0])
	await effects.waitForFunction(() => !!window.__routing)
	await effects.evaluate(() => window.__routing.focusPage('same'))
	check('a page commit focuses its heading and applies metadata before resolving', await effects.evaluate(() => ({
		focused: document.activeElement === document.getElementById('focus-heading'),
		title: document.title, description: document.querySelector('meta[name="description"]').content,
		y: scrollY,
	})), { focused: true, title: 'Focus same', description: 'Page same', y: 0 })
	await effects.keyboard.press('Tab')
	check('Tab continues from the newly focused page heading', await effects.evaluate(() =>
		document.activeElement === document.getElementById('focus-control')), true)
	await effects.evaluate(() => scrollTo(0, 300))
	await effects.waitForFunction(() => scrollY === 300)
	await effects.evaluate(() => window.__routing.refresh())
	check('refresh preserves current focus and document scroll', await effects.evaluate(() => ({
		focused: document.activeElement === document.getElementById('focus-control'), y: scrollY,
	})), { focused: true, y: 300 })
	await effects.evaluate(() => window.__routing.focusPage('same'))
	check('a second same-URL entry starts at the top with fresh heading focus', await effects.evaluate(() => ({
		focused: document.activeElement === document.getElementById('focus-heading'), y: scrollY,
	})), { focused: true, y: 0 })
	await effects.evaluate(() => {
		document.getElementById('focus-bottom-control').focus({ preventScroll: true })
		scrollTo(0, 700)
	})
	await effects.waitForFunction(() => scrollY === 700)
	await effects.evaluate(() => window.__routing.focusPage('other'))
	await effects.evaluate(() => window.__routing.back())
	check('Back restores the second same-URL entry without focus scrolling', await effects.evaluate(() => ({
		focused: document.activeElement === document.getElementById('focus-bottom-control'), y: scrollY,
	})), { focused: true, y: 700 })
	await effects.evaluate(() => window.__routing.back())
	check('Back distinguishes focus and scroll for the first same-URL entry', await effects.evaluate(() => ({
		focused: document.activeElement === document.getElementById('focus-control'), y: scrollY,
	})), { focused: true, y: 300 })
	await effects.goForward()
	await effects.waitForFunction(() => scrollY === 700)
	check('browser Forward restores its own focus target', await effects.evaluate(() =>
		document.activeElement === document.getElementById('focus-bottom-control')), true)
	await effects.evaluate(() => window.__routing.focusPage('fragment', 'part one'))
	check('a decoded fragment receives focus and native browser scrolling', await effects.evaluate(() => {
		const target = document.getElementById('part one')
		return { focused: document.activeElement === target, aligned: Math.abs(target.getBoundingClientRect().top) < 1,
			encoded: location.hash === '#part%20one' }
	}), { focused: true, aligned: true, encoded: true })
	const beforeModalScroll = await effects.evaluate(() => scrollY)
	await effects.evaluate(() => window.__routing.modal())
	check('modal presentation preserves the background document position', await effects.evaluate(() => scrollY), beforeModalScroll)
	await effects.evaluate(() => window.__routing.dismiss())
	check('modal dismissal restores fragment focus and the background document position', await effects.evaluate(() => ({
		focused: document.activeElement === document.getElementById('part one'), y: scrollY,
	})), { focused: true, y: beforeModalScroll })
	await effects.evaluate(() => window.__routing.beginFeedback())
	await effects.waitForFunction(() => window.__routing.feedbackLoads === 1)
	await effects.evaluate(() => window.__routing.focusPage('latest'))
	await effects.evaluate(() => {
		document.getElementById('focus-control').focus({ preventScroll: true })
		scrollTo(0, 250)
	})
	await effects.waitForFunction(() => scrollY === 250)
	check('superseded browser loading settles as cancellation', await effects.evaluate(() => window.__routing.releaseFeedback()), 'cancelled')
	await effects.evaluate(() => new Promise(requestAnimationFrame))
	check('a late loader cannot move committed focus, scroll or metadata', await effects.evaluate(() => ({
		focused: document.activeElement === document.getElementById('focus-control'), y: scrollY,
		title: document.title, path: location.pathname,
	})), { focused: true, y: 250, title: 'Focus latest', path: '/focus/latest' })
	await effects.close()

	await page.evaluate(() => window.__routing.motion('new-owner', 'none'))
	await page.getByRole('button', { name: 'Increment', exact: true }).click()
	await page.evaluate(() => window.__routing.retainButton())
	const beforeOwnerEnd = await page.evaluate(() => ({
		loads: window.__routing.loads,
		length: history.length,
	}))

	check(
		'root owner teardown releases prepared data and owned Back history',
		await page.evaluate(() => window.__routing.endRootOwner()),
		{ route: null, back: false },
	)

	await page.locator('#root-owner-ended').waitFor()
	await page.evaluate(() => window.__routing.startRootOwner())
	await page.waitForFunction(() => window.__routing.fileContract?.context.account === 'account-b')
	check(
		'a remounted root reloads the current URL once with fresh context and local state',
		await page.evaluate(() => ({
			loads: window.__routing.loads,
			length: history.length,
			account: window.__routing.fileContract.context.account,
			same: window.__routing.sameButton,
			count: document.getElementById('item')?.textContent?.split(':').at(-1),
		})),
		{
			loads: beforeOwnerEnd.loads + 1,
			length: beforeOwnerEnd.length,
			account: 'account-b',
			same: false,
			count: '0',
		},
	)

	await page.evaluate(async () => {
		window.__routing.setHistoryAccess(true, 'before-confirmation')
		await window.__routing.motion('confirm-source', 'none')
		window.__routing.setDirtyEntry('confirm-source')
	})

	await page.getByRole('button', { name: 'Increment', exact: true }).click()
	const beforeConfirmation = await page.evaluate(() => ({
		loads: window.__routing.loads, contexts: window.__routing.contextReads,
		path: location.pathname, text: document.getElementById('item')?.textContent,
	}))
	check('invalid destinations fail without opening confirmation or reading context', await page.evaluate(async () => ({
		result: await window.__routing.incoming('/__missing-confirmation__'),
		loads: window.__routing.loads, contexts: window.__routing.contextReads,
		status: document.getElementById('confirmation-status')?.textContent,
		path: location.pathname,
	})), { result: 'not-found', loads: beforeConfirmation.loads, contexts: beforeConfirmation.contexts, status: 'idle', path: beforeConfirmation.path })
	await page.evaluate(() => window.__routing.clearFailure())
	await page.evaluate(() => window.__routing.beginConfirmedNavigation('confirm-target'))
	await page.locator('#confirmation-status').filter({ hasText: 'blocked' }).waitFor()
	check('unsaved confirmation holds before context, loading and URL changes', await page.evaluate(() => ({
		loads: window.__routing.loads, contexts: window.__routing.contextReads,
		path: location.pathname, text: document.getElementById('item')?.textContent,
	})), beforeConfirmation)
	await page.getByRole('button', { name: 'Keep editing', exact: true }).click()
	check('pointer refusal cancels without navigation failure or source-state loss', await page.evaluate(async () => ({
		result: await window.__routing.confirmationResult(),
		status: window.__routing.navigationFeedback.status,
		path: location.pathname, text: document.getElementById('item')?.textContent,
	})), { result: 'cancelled', status: 'idle', path: beforeConfirmation.path, text: beforeConfirmation.text })
	await page.evaluate(() => window.__routing.beginConfirmedNavigation('confirm-target'))
	await page.locator('#confirmation-status').filter({ hasText: 'blocked' }).waitFor()
	await page.evaluate(() => window.__routing.setHistoryAccess(true, 'after-confirmation'))
	await page.getByRole('button', { name: 'Leave screen', exact: true }).click()
	await page.waitForFunction(() => location.pathname === '/items/confirm-target' && window.__routing.navigationFeedback.status === 'idle')
	check('pointer approval snapshots fresh account context and loads the destination once', await page.evaluate(async () => ({
		result: await window.__routing.confirmationResult(),
		account: window.__routing.fileContract.context.account,
		loads: window.__routing.loads, contexts: window.__routing.contextReads,
	})), { result: 'committed', account: 'after-confirmation', loads: beforeConfirmation.loads + 1, contexts: beforeConfirmation.contexts + 1 })
	await page.evaluate(() => window.__routing.setDirtyEntry('confirm-target'))
	const beforeBlockedBack = await page.evaluate(() => ({ loads: window.__routing.loads, contexts: window.__routing.contextReads }))
	await page.goBack()
	await page.locator('#confirmation-status').filter({ hasText: 'blocked' }).waitFor()
	await page.getByRole('button', { name: 'Keep editing', exact: true }).click()
	await page.waitForFunction(() => location.pathname === '/items/confirm-target' && window.__routing.navigationFeedback.status === 'idle')
	check('browser Back refusal corrects history without loading its rejected target', await page.evaluate(() => ({
		loads: window.__routing.loads, contexts: window.__routing.contextReads,
		status: document.getElementById('confirmation-status')?.textContent,
	})), { ...beforeBlockedBack, status: 'idle' })
	await page.goBack()
	await page.locator('#confirmation-status').filter({ hasText: 'blocked' }).waitFor()
	await page.getByRole('button', { name: 'Leave screen', exact: true }).click()
	await page.waitForFunction(() => location.pathname === '/items/confirm-source' && window.__routing.navigationFeedback.status === 'idle')
	check('browser Back approval restores a freshly prepared location once', await page.evaluate(() => ({ loads: window.__routing.loads, account: window.__routing.fileContract.context.account })), { loads: beforeBlockedBack.loads + 1, account: 'after-confirmation' })
	await page.evaluate(() => window.__routing.setDirtyEntry('confirm-source'))
	await page.goForward()
	await page.locator('#confirmation-status').filter({ hasText: 'blocked' }).waitFor()
	check('Forward confirmation retains the requested direction', await page.locator('#confirmation-action').textContent(), 'forward')
	await page.getByRole('button', { name: 'Keep editing', exact: true }).click()
	await page.waitForFunction(() => location.pathname === '/items/confirm-source' && window.__routing.navigationFeedback.status === 'idle')
	await page.goForward()
	await page.locator('#confirmation-status').filter({ hasText: 'blocked' }).waitFor()
	await page.getByRole('button', { name: 'Leave screen', exact: true }).click()
	await page.waitForFunction(() => location.pathname === '/items/confirm-target' && window.__routing.navigationFeedback.status === 'idle')
	check('Forward confirmation can proceed after an earlier refusal', await page.evaluate(() => ({ loads: window.__routing.loads, account: window.__routing.fileContract.context.account })), { loads: beforeBlockedBack.loads + 2, account: 'after-confirmation' })
	await page.evaluate(() => window.__routing.setDirtyEntry(null))

	await page.evaluate(() => {
		window.__routing.setDirtyEntry('confirm-target')
		window.__routing.allowFeedback()
		window.__routing.beginFeedback()
	})
	await page.locator('#confirmation-status').filter({ hasText: 'blocked' }).waitFor()
	await page.getByRole('button', { name: 'Approve and clear edits', exact: true }).click()
	await page.locator('#confirmation-status').filter({ hasText: 'proceeding' }).waitFor()
	const clearedConditionPhase = await page.evaluate(() => ({
		confirmation: document.getElementById('confirmation-status')?.textContent,
		navigation: window.__routing.navigationFeedback.status,
		path: location.pathname,
	}))
	const clearedConditionResult = await page.evaluate(() => window.__routing.releaseFeedback())
	await page.waitForFunction(() => location.pathname === '/feedback/recover' && window.__routing.navigationFeedback.status === 'idle')
	check('approval stays proceeding after clearing edits until its loader finishes', {
		during: clearedConditionPhase,
		result: clearedConditionResult,
		after: await page.locator('#confirmation-status').textContent(),
	}, { during: { confirmation: 'proceeding', navigation: 'pending', path: '/items/confirm-target' }, result: 'committed', after: 'idle' })

	const publicPanes = await page.evaluate(() => window.__routing.qualifyPanes())
	check('public panes preserve entry state, providers and owned independent flows', publicPanes.checks.length, 11)
	check('public panes leave the browser URL unchanged', publicPanes.urlUnchanged, true)
	check('public panes leave browser history unchanged', publicPanes.historyUnchanged, true)
	check('no uncaught browser errors', errors, [])
	console.log(
		JSON.stringify({
			target: 'chromium',
			productionBuild: true,
			screenshots: false,
			passed: checks.length,
			checks,
		}),
	)
} finally {
	await browser?.close()
	await new Promise((resolve, reject) =>
		server ? server.httpServer.close((error) => (error ? reject(error) : resolve())) : resolve(),
	)

	if (artifactBase) {console.log(JSON.stringify({ artifactDirectory: output }))}
	else {await rm(output, { recursive: true, force: true })}
}
