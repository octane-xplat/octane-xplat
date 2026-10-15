/** Packed web acceptance, outside the workspace with no source aliases.
 * Requires generated UI/workshop declarations. Uses the proving app's declared
 * Playwright tool; never captures images or launches native devices. */
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createServer as createNetServer } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const work = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-workshop-packed-')))
const consumer = join(work, 'consumer')
const pack = join(work, 'pack')
mkdirSync(consumer)
mkdirSync(pack)
let server
let serverOutput = ''
let browser
let succeeded = false
function run(command, args, cwd = consumer) {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
	assert.equal(result.status, 0, `${command} ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`)
	return result.stdout
}

function write(name, content) {
	writeFileSync(join(consumer, name), content)
}

try {
	const tarballs = {}
	for (const dir of ['create', 'cli', 'lib', 'ui', 'workshop']) {
		const root = join(repo, 'packages', dir)
		const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
		run('pnpm', ['--config.ignore-scripts=true', 'pack', '--pack-destination', pack], root)
		tarballs[manifest.name] = `file:${join(pack, `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`)}`
	}

	write('package.json', JSON.stringify({ name: 'workshop-packed-acceptance', private: true, type: 'module',
		dependencies: { '@octane-xplat/ui': tarballs['@octane-xplat/ui'], octane: '0.11.0' },
		devDependencies: { '@octane-xplat/workshop': tarballs['@octane-xplat/workshop'],
			'@octane-xplat/cli': tarballs['@octane-xplat/cli'], '@octanejs/vite-plugin': '0.1.61',
			'@tsrx/oxc': '0.20.0', '@tsrx/core': '0.2.4', typescript: '5.9.3', vite: '8.3.0' } }, null, 2))

	write('pnpm-workspace.yaml', `packages: []\noverrides:\n${Object.entries(tarballs).map(([name, path]) => `  '${name}': '${path}'`).join('\n')}\n`)
	run('pnpm', ['install', '--ignore-scripts'])
	for (const name of ['ui', 'workshop', 'cli']) {
		assert.ok(realpathSync(join(consumer, 'node_modules/@octane-xplat', name)).startsWith(work), `${name} must come from a tarball`)
	}

	const initialized = run('pnpm', ['exec', 'xplat', 'workshop', 'init'])
	assert.match(initialized, /created workshop.config.ts/)
	const config = readFileSync(join(consumer, 'workshop.config.ts'), 'utf8')
	run('pnpm', ['exec', 'xplat', 'workshop', 'init'])
	assert.equal(readFileSync(join(consumer, 'workshop.config.ts'), 'utf8'), config)
	const doctor = run('pnpm', ['exec', 'xplat', 'workshop', 'doctor', '--json'])
	const targetReport = JSON.parse(doctor.slice(doctor.indexOf('{')))
	assert.equal(Object.keys(targetReport.targets).length, 6)
	assert.equal(targetReport.targets.web.status, 'available')
	assert.equal(targetReport.targets.ios.status, process.platform === 'darwin' ? 'missing-prerequisites' : 'remote-host-required')
	assert.equal(targetReport.targets.android.status, 'missing-prerequisites')
	// Use the maintained acceptance catalog, without the init example.
	rmSync(join(consumer, 'src/workshop'), { recursive: true })
	cpSync(join(repo, 'apps/workshop-demo/src'), join(consumer, 'src'), { recursive: true })
	const list = run('pnpm', ['exec', 'xplat', 'workshop', 'list', '--json'])
	assert.match(list, /counter\/basic/)
	assert.match(list, /ios-only/)
	assert.equal(JSON.parse(list.slice(list.indexOf('{'))).entries.find(e => e.id.includes('ios')).applicable, false)
	write('typing.contract.ts', readFileSync(join(repo, 'packages/workshop/tests/typing.contract.ts'), 'utf8')
		.replace("'../src/contract'", "'@octane-xplat/workshop'"))

	write('tsconfig.json', JSON.stringify({ compilerOptions: { strict: true, noEmit: true,
		module: 'ESNext', moduleResolution: 'Bundler', target: 'ES2022', skipLibCheck: true }, files: ['typing.contract.ts'] }))

	run('pnpm', ['exec', 'tsc', '--noEmit'])
	const req = createRequire(join(consumer, 'package.json'))
	const { WORKSHOP_CONTRACT_VERSION } = await import(req.resolve('@octane-xplat/workshop'))
	assert.equal(WORKSHOP_CONTRACT_VERSION, 1)
	for (const specifier of ['@octane-xplat/workshop', '@octane-xplat/ui', '@octanejs/vite-plugin']) {
		assert.equal(realpathSync(createRequire(req.resolve(specifier)).resolve('octane')), realpathSync(req.resolve('octane')))
	}

	console.log('PASS one matching Octane runtime across consumer, compiler and workshop')
	console.log('PASS packed contract version 1 and negative typing')
	console.log('PASS packed init idempotence, six doctor rows, static catalog and isolated package resolution')

	const port = await new Promise((resolve) => {
		const socket = createNetServer()
		socket.listen(0, () => {
			const port = socket.address().port
			socket.close(() => resolve(port))
		})
	})

	const url = await new Promise((accept, reject) => {
		server = spawn('pnpm', ['exec', 'xplat', 'workshop', 'dev', '--target', 'web', '--port', String(port)],
			{ cwd: consumer, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })

		let output = ''
		const timer = setTimeout(() => reject(new Error('packed server readiness timeout')), 30_000)
		const capture = (chunk) => {
			output += chunk
			serverOutput += chunk
			const match = /WORKSHOP_READY (https?:\/\/\S+)/.exec(output)
			if (match) { clearTimeout(timer); accept(match[1]) }
		}

		server.stdout.on('data', capture)
		server.stderr.on('data', capture)
		server.on('exit', () => { clearTimeout(timer); reject(new Error(`packed server exited: ${output}`)) })
	})

	// Compile the installed source graph before the interaction and warm-edit checks.
	const { chromium } = createRequire(join(repo, 'apps/workshop-demo/package.json'))('playwright')
	browser = await chromium.launch({ headless: true })
	const cold = await browser.newPage()
	const coldStart = performance.now()
	await cold.goto(`${url}#/story/counter/basic`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
	await cold.waitForFunction(() => ['ready', 'failed'].includes(globalThis.__xplatWorkshopRuntime?.session.state.phase), undefined, { timeout: 60_000 })
	const coldState = await cold.evaluate(() => {
		const state = globalThis.__xplatWorkshopRuntime.session.state
		return { phase: state.phase, failure: state.failure?.message }
	})

	assert.equal(coldState.phase, 'ready', coldState.failure)
	await cold.close()
	console.log(`PASS packed source graph compiles and mounts (${Math.round(performance.now() - coldStart)}ms cold)`)

	// Execute the same maintained DOM/input acceptance on the packed consumer.
	const journey = run(process.execPath, [join(repo, 'apps/workshop-demo/scripts/e2e-web.mjs'), url], repo)
	process.stdout.write(journey)
	console.log('PASS packed browser journey (32 DOM/input checks, no screenshots)')

	const page = await browser.newPage()
	// A story or component edit must never reset the page: the shell writes
	// only same-document hash navigations, while a reload repeats the URL.
	let lastUrl = ''
	let pageReloads = 0
	page.on('framenavigated', frame => {
		if (frame !== page.mainFrame()) {return}

		const next = frame.url()
		if (next === lastUrl) {pageReloads++}
		lastUrl = next
	})

	await page.goto(`${url}#/story/counter/basic`)
	await page.waitForFunction(() => globalThis.__xplatWorkshopRuntime?.session.state.phase === 'ready')
	const sourcePath = join(consumer, 'src/counter.tsrx')
	const original = readFileSync(sourcePath, 'utf8')
	await page.getByRole('button', { name: 'Increment', exact: true }).click()
	const before = await page.evaluate(() => globalThis.__xplatWorkshopRuntime.session.state.revision)
	const start = performance.now()
	writeFileSync(sourcePath, original.replace('(+{props.step})', '(warm +{props.step})'))
	await page.waitForFunction((revision) => globalThis.__xplatWorkshopRuntime.session.state.revision > revision &&
		document.querySelector('.xw-stage-mount')?.textContent?.includes('warm'), before)

	const latency = Math.round(performance.now() - start)
	assert.ok(latency <= 2000, `warm web edit exceeded 2s: ${latency}ms`)
	assert.match(await page.locator('.xw-stage-mount').innerText(), /Demo: 0/)
	writeFileSync(sourcePath, 'this is invalid source !!!')
	await page.waitForFunction(() => globalThis.__xplatWorkshopRuntime.session.state.phase === 'failed' &&
		globalThis.__xplatWorkshopRuntime.session.state.stale)

	assert.match(await page.locator('.xw-stage-mount').innerText(), /warm/)
	writeFileSync(sourcePath, original)
	await page.waitForFunction(() => globalThis.__xplatWorkshopRuntime.session.state.phase === 'ready' &&
		!globalThis.__xplatWorkshopRuntime.session.state.stale &&
		!document.querySelector('.xw-stage-mount')?.textContent?.includes('warm'))

	console.log(`PASS packed warm edit ${latency}ms, defaults restored, bad edit stale and correction recovered`)

	const storyPath = join(consumer, 'src/stories/counter.stories.tsrx')
	const originalStory = readFileSync(storyPath, 'utf8')
	writeFileSync(storyPath, originalStory.replace('args: { step: 1 }', 'args: { step: 3 }'))
	await page.waitForFunction(() => globalThis.__xplatWorkshopRuntime.session.state.phase === 'ready' &&
		document.querySelector('.xw-stage-mount')?.textContent === 'Demo: 0 (+3)')

	writeFileSync(storyPath, originalStory.replace("id: 'counter/basic'", "id: 'counter/renamed'"))
	await page.waitForFunction(() => globalThis.__xplatWorkshopRuntime.store.getSnapshot().missingId === 'counter/basic' &&
		!document.querySelector('.xw-stage-mount'))

	assert.match(await page.locator('.xw-stage-area').innerText(), /was not found/)
	writeFileSync(storyPath, originalStory)
	await page.waitForFunction(() => globalThis.__xplatWorkshopRuntime.store.getSnapshot().catalog.some(e => e.id === 'counter/basic'))
	await page.locator('.xw-story').filter({ hasText: /^Basic$/ }).click()
	await page.waitForFunction(() => globalThis.__xplatWorkshopRuntime.session.state.phase === 'ready')
	await page.getByRole('searchbox', { name: 'Search stories' }).fill('Counter')
	await page.evaluate(() => { globalThis.__workshopCatalogToken = 'retained' })
	const dynamicPath = join(consumer, 'src/stories/dynamic.stories.tsrx')
	writeFileSync(dynamicPath, `import { defineStory } from '@octane-xplat/workshop'
export const Dynamic = defineStory({ id: 'dynamic/new', title: 'Dynamic / New', targets: ['web'], component: () => null, args: {} })`)

	await page.waitForFunction(() => globalThis.__xplatWorkshopRuntime.store.getSnapshot().catalog.some(e => e.id === 'dynamic/new'))
	assert.equal(await page.evaluate(() => globalThis.__workshopCatalogToken), 'retained')
	assert.equal(await page.getByRole('searchbox', { name: 'Search stories' }).inputValue(), 'Counter')
	rmSync(dynamicPath)
	await page.waitForFunction(() => !globalThis.__xplatWorkshopRuntime.store.getSnapshot().catalog.some(e => e.id === 'dynamic/new'))
	assert.equal(await page.evaluate(() => globalThis.__workshopCatalogToken), 'retained')
	assert.equal(pageReloads, 0, 'story and component edits must not reload the workshop page')
	console.log('PASS story source edit, renamed-ID missing state, add/unlink retains catalog query and session shell')

	// An ordinary production entry never imports the workshop or its fixtures.
	write('index.html', '<div id="app"></div><script type="module" src="/src/main.ts"></script>')
	write('src/main.ts', `import { createElement, createRoot } from 'octane'
import { createStore } from '@octane-xplat/ui/data'
import { WorkshopCounter } from './counter.tsrx'
document.getElementById('app').textContent = 'production-only'
const stage = document.createElement('section')
document.body.append(stage)
createRoot(stage).render(createElement(WorkshopCounter, { step: 1, state: createStore({ count: 42 }), fixture: { account: 'Production' } }))` )

	write('vite.config.ts', readFileSync(join(repo, 'packages/create/template/vite.config.ts'), 'utf8'))

	run('pnpm', ['exec', 'vite', 'build'])
	function files(dir) {
		return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)])
	}

	const built = files(join(consumer, 'dist')).map((file) => readFileSync(file, 'utf8')).join('\n')
	assert.match(built, /production-only/)
	assert.doesNotMatch(built, /xplatWorkshop|__xplatWorkshop|story account overlay|AsyncAccount|counter\/basic|storybook/)
	console.log('PASS packed production build excludes workshop, stories, fixture data and composition tooling')
	console.log(`QUALIFIED web Chromium ${browser.version()}, Node ${process.version}, consumer package 0.14.0`)
	succeeded = true
} catch (error) {
	console.error(serverOutput.slice(-6000))
	throw error
} finally {
	await browser?.close()
	if (server?.pid) { try { process.kill(-server.pid, 'SIGTERM') } catch { /* already stopped */ } }
	// Keep failure artifacts for diagnosis; successful fixtures are owned and temporary.
	if (succeeded) {rmSync(work, { recursive: true, force: true })}
}
