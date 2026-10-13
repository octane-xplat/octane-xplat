/** Packed Linux-target acceptance, outside the workspace with no source
 * aliases. Requires built UI/workshop artifacts. Covers everything checkable
 * without a real GTK/WebKitGTK host: doctor's remote-host row, launch refusal
 * off-Linux, catalog applicability, published `linux` export resolution, the
 * production server wiring (linux conditions/extensions, catalog loaders,
 * story-file hotUpdate) exercised in a plain DOM, and production-build
 * exclusion. The GJS window, GTK input/focus and WebKitGTK reload semantics
 * remain an actual-Linux-host gate — this is not that evidence. */
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const work = realpathSync(mkdtempSync(join(tmpdir(), 'xplat-workshop-packed-linux-')))
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

	write('package.json', JSON.stringify({ name: 'workshop-packed-linux-acceptance', private: true, type: 'module',
		dependencies: { '@octane-xplat/ui': tarballs['@octane-xplat/ui'], octane: '0.11.0' },
		devDependencies: { '@octane-xplat/workshop': tarballs['@octane-xplat/workshop'],
			'@octane-xplat/cli': tarballs['@octane-xplat/cli'], '@octanejs/vite-plugin': '0.1.61',
			'@tsrx/oxc': '0.20.0', '@tsrx/core': '0.2.4', typescript: '5.9.3', vite: '8.3.0' } }, null, 2))

	write('pnpm-workspace.yaml', `packages: []\noverrides:\n${Object.entries(tarballs).map(([name, path]) => `  '${name}': '${path}'`).join('\n')}\n`)
	run('pnpm', ['install', '--ignore-scripts'])
	for (const name of ['ui', 'workshop', 'cli']) {
		assert.ok(realpathSync(join(consumer, 'node_modules/@octane-xplat', name)).startsWith(work), `${name} must come from a tarball`)
	}

	run('pnpm', ['exec', 'xplat', 'workshop', 'init'])
	// The maintained acceptance catalog, without the init example.
	rmSync(join(consumer, 'src/workshop'), { recursive: true })
	cpSync(join(repo, 'apps/workshop-demo/src'), join(consumer, 'src'), { recursive: true })

	// The published UI manifest must carry the linux condition — without it a
	// packed consumer silently falls back to the web build and loses the
	// openWindow/colorScheme host overrides.
	const uiManifest = JSON.parse(readFileSync(join(consumer, 'node_modules/@octane-xplat/ui/package.json'), 'utf8'))
	assert.equal(uiManifest.exports['.'].linux?.default, './src/index.linux.ts', 'packed @octane-xplat/ui must publish a linux export branch')
	console.log('PASS packed @octane-xplat/ui publishes the linux export branch')

	// The canonical GJS host must ship inside the packed CLI — the launcher
	// resolves it from the consumer's installed package.
	assert.ok(realpathSync(join(consumer, 'node_modules/@octane-xplat/cli/src/linux/host/gjs-host.js')).startsWith(work),
		'packed @octane-xplat/cli must ship src/linux/host/gjs-host.js')

	console.log('PASS packed @octane-xplat/cli ships the canonical GJS host')

	const doctor = run('pnpm', ['exec', 'xplat', 'workshop', 'doctor', '--json'])
	const report = JSON.parse(doctor.slice(doctor.indexOf('{')))
	const linux = report.targets.linux
	assert.ok(linux, 'doctor reports a linux row')
	if (process.platform === 'linux') {
		assert.match(linux.status, /available|missing-prerequisites/)
	} else {
		assert.equal(linux.status, 'remote-host-required')
		assert.match(linux.note, /host's checkout/)
	}

	console.log(`PASS packed doctor linux row: ${linux.status} on ${process.platform}`)

	// Off-Linux the launch must refuse before binding the dev server — no
	// WORKSHOP_READY line, an actionable remote-host message.
	const refusal = spawnSync('pnpm', ['exec', 'xplat', 'workshop', 'dev', '--target', 'linux'],
		{ cwd: consumer, encoding: 'utf8', timeout: 60_000 })

	if (process.platform === 'linux') {
		assert.notEqual(refusal.status, 0)
		assert.match(refusal.stdout + refusal.stderr, /gjs|prerequisites|typelibs|cannot find the GJS host/i)
	} else {
		assert.notEqual(refusal.status, 0, 'dev --target linux must refuse off-Linux')
		assert.match(refusal.stdout + refusal.stderr, /Linux only|host's own checkout/i)
	}

	assert.doesNotMatch(refusal.stdout + refusal.stderr, /WORKSHOP_READY/, 'refusal must precede server bind')
	console.log('PASS dev --target linux refuses off-Linux without binding the server')

	const list = run('pnpm', ['exec', 'xplat', 'workshop', 'list', '--target', 'linux', '--json'])
	const entries = JSON.parse(list.slice(list.indexOf('{'))).entries
	const linuxLeaf = entries.find((e) => e.id === 'platform/linux-host')
	const iosLeaf = entries.find((e) => e.id === 'platform/ios-only')
	assert.equal(linuxLeaf?.applicable, true, 'linux leaf applicable on linux target')
	assert.equal(iosLeaf?.applicable, false, 'ios leaf never applicable on linux')
	assert.equal(entries.find((e) => e.id === 'counter/basic')?.applicable, true)
	console.log('PASS linux catalog applicability — linux leaf in, foreign leaves out, shared stories in')

	// Boot the exact production server wiring for the linux target. A plain
	// DOM can verify resolution, catalog loaders and hotUpdate behavior; only
	// the GJS window itself is absent.
	write('start-linux-server.mjs', `import { loadWorkshopConfig, startWorkshopServer } from '@octane-xplat/workshop/node'
const root = process.cwd()
const { config } = await loadWorkshopConfig(root)
const { server, url } = await startWorkshopServer({ root, config, target: 'linux' })
const resolved = await server.environments?.client?.pluginContainer?.resolveId?.('@octane-xplat/ui')
console.log('UI_RESOLVED ' + (resolved?.id ?? 'unresolved'))
`)

	const serverInfo = await new Promise((accept, reject) => {
		server = spawn('pnpm', ['exec', 'node', 'start-linux-server.mjs'],
			{ cwd: consumer, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })

		let output = ''
		const timer = setTimeout(() => reject(new Error('linux server readiness timeout: ' + output)), 60_000)
		const capture = (chunk) => {
			output += chunk
			serverOutput += chunk
			const ready = /WORKSHOP_READY (https?:\/\/\S+)/.exec(output)
			const resolved = /UI_RESOLVED (\S+)/.exec(output)
			if (ready && resolved) { clearTimeout(timer); accept({ url: ready[1], ui: resolved[1] }) }
		}

		server.stdout.on('data', capture)
		server.stderr.on('data', capture)
		server.on('exit', () => { clearTimeout(timer); reject(new Error(`linux server exited: ${output}`)) })
	})

	assert.match(serverInfo.ui, /src[\\/]index\.linux\.ts(\?|$)/, `linux condition must resolve ui's linux barrel, got: ${serverInfo.ui}`)
	console.log('PASS vite resolves @octane-xplat/ui through the linux condition in a packed consumer')

	const { chromium } = createRequire(join(repo, 'apps/workshop-demo/package.json'))('playwright')
	browser = await chromium.launch({ headless: true })
	const page = await browser.newPage()
	let lastUrl = ''
	let pageReloads = 0
	page.on('framenavigated', (frame) => {
		if (frame !== page.mainFrame()) { return }

		const next = frame.url()
		if (next === lastUrl) { pageReloads++ }
		lastUrl = next
	})

	await page.goto(serverInfo.url)
	await page.locator('.xw-story').filter({ hasText: /Linux host bridge/ }).click()
	await page.waitForFunction(() => globalThis.__xplatWorkshopRuntime?.session.state.phase === 'ready')
	assert.match(await page.locator('.xw-stage-mount').innerText(), /Host bridge: absent/)
	console.log('PASS linux leaf story mounts through linux resolution (DOM check — bridge absent outside gjs)')

	await page.goto(`${serverInfo.url}#/story/counter/basic`)
	await page.waitForFunction(() => globalThis.__xplatWorkshopRuntime?.session.state.phase === 'ready')
	await page.getByRole('button', { name: 'Increment', exact: true }).click()
	assert.match(await page.locator('.xw-stage-mount').innerText(), /Demo: 1/)

	// A story/component edit must remount in place under the linux chain —
	// the pre-hotUpdate boundary answers before octane's full reload.
	const sourcePath = join(consumer, 'src/counter.tsrx')
	const original = readFileSync(sourcePath, 'utf8')
	const before = await page.evaluate(() => globalThis.__xplatWorkshopRuntime.session.state.revision)
	writeFileSync(sourcePath, original.replace('(+{props.step})', '(warm +{props.step})'))
	await page.waitForFunction((revision) => globalThis.__xplatWorkshopRuntime.session.state.revision > revision &&
		document.querySelector('.xw-stage-mount')?.textContent?.includes('warm'), before)

	writeFileSync(sourcePath, original)
	await page.waitForFunction(() => globalThis.__xplatWorkshopRuntime.session.state.phase === 'ready' &&
		!document.querySelector('.xw-stage-mount')?.textContent?.includes('warm'))

	assert.equal(pageReloads, 0, 'story and component edits must not reload the workshop page')
	console.log('PASS linux-target warm edit remounts in place, no page reload (DOM check)')

	// An ordinary production entry built with linux resolution excludes the
	// workshop — and the ui linux source compiles cleanly.
	write('index.html', '<div id="app"></div><script type="module" src="/src/main.ts"></script>')
	write('src/main.ts', `import { createElement, createRoot } from 'octane'
import { createStore, getColorScheme } from '@octane-xplat/ui'
import { WorkshopCounter } from './counter.tsrx'
void getColorScheme
document.getElementById('app').textContent = 'production-only'
const stage = document.createElement('section')
document.body.append(stage)
createRoot(stage).render(createElement(WorkshopCounter, { step: 1, state: createStore({ count: 0 }), fixture: { account: 'Production' } }))`)

	write('vite.config.ts', `import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
export default defineConfig({ plugins: octane(), resolve: {
	conditions: ['linux', 'web'],
	extensions: ['.linux.tsrx', '.web.tsrx', '.tsrx', '.linux.tsx', '.web.tsx', '.tsx', '.linux.ts', '.web.ts', '.mjs', '.mts', '.ts', '.jsx', '.js', '.json'],
} })`)

	run('pnpm', ['exec', 'vite', 'build'])
	const files = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
		entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)])

	const built = files(join(consumer, 'dist')).map((file) => readFileSync(file, 'utf8')).join('\n')
	assert.match(built, /production-only/)
	assert.doesNotMatch(built, /xplatWorkshop|__xplatWorkshop|AsyncAccount|counter\/basic|storybook/)
	console.log('PASS packed linux production build compiles ui linux source and excludes workshop tooling')
	console.log(`QUALIFIED linux DOM-resolution Chromium ${browser.version()}, Node ${process.version} — GJS host, GTK input/focus and WebKitGTK reload remain actual-Linux gates`)
	succeeded = true
} catch (error) {
	console.error(serverOutput.slice(-6000))
	throw error
} finally {
	await browser?.close()
	if (server?.pid) { try { process.kill(-server.pid, 'SIGTERM') } catch { /* already stopped */ } }
	// Keep failure artifacts for diagnosis; successful fixtures are owned and temporary.
	if (succeeded) { rmSync(work, { recursive: true, force: true }) }
}
