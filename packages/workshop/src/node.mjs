/**
 * Node backend for `xplat workshop …` — the CLI resolves this module from
 * the consumer's installed @octane-xplat/workshop and delegates.
 */
import { spawn, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import {
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from 'node:fs'

import { dirname, join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { realpathSync } from 'node:fs'
import { discoverStories } from './discover.mjs'
import { windowsPreflight, windowsLaunchBlocker } from './windows/preflight.mjs'
import { xplatWorkshop } from './vite.mjs'
import { launchMobile, mobilePrerequisites } from './mobile-node.mjs'
import { xplatBoundary, xplatDevBridge, xplatNodeEnvDefine } from '@octane-xplat/cli/vite'

const CONFIG_NAMES = [
	'workshop.config.ts',
	'workshop.config.mts',
	'workshop.config.mjs',
	'workshop.config.js',
]

const importFrom = (cwd, specifier) => {
	const req = createRequire(join(cwd, 'package.json'))
	return import(pathToFileURL(realpathSync(req.resolve(specifier))).href)
}

export class WorkshopUsageError extends Error {
	name = 'WorkshopUsageError'
}

function consumerRoot(cwd) {
	const dir = resolve(cwd)
	if (!existsSync(join(dir, 'package.json'))) {
		throw new WorkshopUsageError(`no package.json at ${dir} — run inside a consumer app`)
	}

	return dir
}

export function findConfigFile(root) {
	for (const name of CONFIG_NAMES) {
		const file = join(root, name)
		if (existsSync(file)) {
			return file
		}
	}

	return null
}

export async function loadWorkshopConfig(root) {
	const file = findConfigFile(root)
	if (!file) {
		return { config: {}, file: null }
	}

	const { loadConfigFromFile } = await importFrom(root, 'vite')
	const result = await loadConfigFromFile(
		{ command: 'serve', mode: 'development' },
		file,
	)

	return { config: result.config?.default ?? result.config ?? {}, file }
}

// ---------- list ----------

export async function workshopList({ cwd, target = 'web', json = false } = {}) {
	const root = consumerRoot(cwd)
	const { config } = await loadWorkshopConfig(root)
	const { entries, diagnostics } = discoverStories(root, {
		include: config.stories?.include,
		exclude: config.stories?.exclude,
		target,
	})

	if (json) {
		console.log(JSON.stringify({ target, entries, diagnostics }, null, 2))
		return { entries, diagnostics }
	}

	console.log(`workshop stories (target: ${target})`)
	if (!entries.length) {
		console.log('  (none)')
	}

	for (const entry of entries) {
		const mark = entry.applicable ? ' ' : '!'
		const reason = entry.applicable ? '' : `  — ${entry.reason}`
		const caps = entry.capabilities.length ? `  [${entry.capabilities.join(', ')}]` : ''
		console.log(`${mark} ${entry.id.padEnd(32)} ${entry.title}${caps}${reason}`)
	}

	for (const diagnostic of diagnostics) {
		console.error(`! ${relative(root, diagnostic.file)}: ${diagnostic.message}`)
	}

	if (diagnostics.length) {
		throw new WorkshopUsageError(`${diagnostics.length} discovery diagnostic(s)`)
	}

	return { entries, diagnostics }
}

// ---------- doctor ----------

const resolveFrom = (cwd, specifier) => {
	try {
		const req = createRequire(join(cwd, 'package.json'))
		return req.resolve(specifier)
	} catch {
		return null
	}
}

export async function workshopDoctor({ cwd, json = false } = {}) {
	const root = consumerRoot(cwd)
	const report = { root, targets: {} }

	const webRequirements = {
		vite: Boolean(resolveFrom(root, 'vite')),
		'@octanejs/vite-plugin': Boolean(resolveFrom(root, '@octanejs/vite-plugin')),
		octane: Boolean(resolveFrom(root, 'octane')),
		'@octane-xplat/ui': Boolean(resolveFrom(root, '@octane-xplat/ui')),
		'@octane-xplat/workshop': Boolean(resolveFrom(root, '@octane-xplat/workshop')),
	}

	const configFile = findConfigFile(root)
	report.targets.web = {
		backend: 'octane-dom (vite)',
		requirements: { ...webRequirements, 'workshop.config': Boolean(configFile) },
		status: Object.values(webRequirements).every(Boolean) ? 'available' : 'missing-prerequisites',
	}

	for (const target of ['ios', 'android']) {
		report.targets[target] = mobilePrerequisites(root, target)
	}

	const macosRequirements = {
		'darwin-arm64 host': process.platform === 'darwin' && process.arch === 'arm64',
		'@octane-xplat/macos-renderer': Boolean(resolveFrom(root, '@octane-xplat/macos-renderer')),
		'@nativescript/macos-node-api': Boolean(resolveFrom(root, '@nativescript/macos-node-api')),
		'@octane-xplat/cli': Boolean(resolveFrom(root, '@octane-xplat/cli/macos')),
		octane: Boolean(resolveFrom(root, 'octane')),
		'@octanejs/vite-plugin': Boolean(resolveFrom(root, '@octanejs/vite-plugin')),
		vite: Boolean(resolveFrom(root, 'vite')),
		'workshop.config': Boolean(configFile),
	}

	report.targets.macos = {
		backend: 'appkit/jsc renderer',
		requirements: macosRequirements,
		status: Object.values(macosRequirements).every(Boolean)
			? 'available'
			: macosRequirements['darwin-arm64 host']
				? 'missing-prerequisites'
				: 'unsupported-host',
		note: 'the AppKit workshop needs the app\'s own macOS renderer and node-api versions',
	}

	report.targets.windows = windowsPreflight(root)

	report.targets.linux = linuxDoctor(root, webRequirements, configFile)

	if (json) {
		console.log(JSON.stringify(report, null, 2))
		return report
	}

	console.log(`workshop doctor — ${root}`)
	for (const [target, info] of Object.entries(report.targets)) {
		console.log(`  ${target.padEnd(8)} ${info.status.padEnd(22)} ${info.backend}`)
		for (const [req, ok] of Object.entries(info.requirements)) {
			if (!ok) {
				console.log(`             missing: ${req}`)
			}
		}

		if (info.note) {
			console.log(`             ${info.note}`)
		}
	}

	return report
}

// ---------- init ----------

const CONFIG_TEMPLATE = `import { defineWorkshopConfig } from '@octane-xplat/workshop'

export default defineWorkshopConfig({
	// Story modules are discovered statically — id/title/targets must be
	// literal values. Platform leaves like counter.stories.ios.tsrx stay out
	// of incompatible bundles.
	stories: {
		include: [
			'src/**/*.stories.{ts,tsx,tsrx}',
			'src/**/*.stories.{web,mobile,ios,android,macos,windows,linux}.{ts,tsx,tsrx}',
		],
	},
	// Optional: modules exporting a providers array applied around every story.
	// providerModules: ['./src/demo-providers.tsrx'],
})
`

const STORY_TEMPLATE = `import { Pressable, Text } from '@octane-xplat/ui'
import { useStore, type Store } from '@octane-xplat/ui/data'
import { defineStory } from '@octane-xplat/workshop'

type Props = { step: number }
type State = { count: number }
type Fixture = { account: string }

function WorkshopCounter(p: Props & { state: Store<State>; fixture: Fixture }) {
	const { count } = useStore(p.state)
	return (
		<Pressable
			accessibilityLabel="Increment"
			onPress={() => p.state.update((s) => ({ count: s.count + p.step }))}
		>
			<Text>{p.fixture.account}: {count}</Text>
		</Pressable>
	)
}

export const Basic = defineStory<Props, State, Fixture>({
	id: 'workshop/counter-basic',
	title: 'Workshop / Counter',
	targets: 'all',
	component: WorkshopCounter,
	args: { step: 1 },
	controls: { step: { type: 'number', min: 1, max: 10 } },
	state: () => ({ count: 0 }),
	fixture: () => ({ account: 'Demo' }),
})
`

export async function workshopInit({ cwd, scripts = true } = {}) {
	const root = consumerRoot(cwd)
	const created = []
	const skipped = []

	const writeIfAbsent = (file, contents) => {
		if (existsSync(file)) {
			const existing = readFileSync(file, 'utf8')
			skipped.push(
				existing === contents
					? `${relative(root, file)} already up to date`
					: `${relative(root, file)} exists with different content — left untouched; reconcile it manually`,
			)

			return false
		}

		mkdirSync(dirname(file), { recursive: true })
		writeFileSync(file, contents)
		created.push(relative(root, file))
		return true
	}

	writeIfAbsent(join(root, 'workshop.config.ts'), CONFIG_TEMPLATE)
	writeIfAbsent(join(root, 'src', 'workshop', 'counter.stories.tsrx'), STORY_TEMPLATE)

	if (scripts) {
		const manifestPath = join(root, 'package.json')
		const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
		manifest.scripts = manifest.scripts ?? {}
		if (!manifest.scripts.workshop) {
			manifest.scripts.workshop = 'xplat workshop dev --target web'
			writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
			created.push('package.json script "workshop"')
		} else {
			skipped.push('package.json script "workshop" already exists')
		}
	}

	const hasWorkshop = Boolean(resolveFrom(root, '@octane-xplat/workshop'))
	for (const item of created) {
		console.log(`  created ${item}`)
	}

	for (const item of skipped) {
		console.log(`  skipped ${item}`)
	}

	if (!hasWorkshop) {
		console.log('  next: pnpm add -D @octane-xplat/workshop')
	}

	console.log('  run: pnpm exec xplat workshop dev --target web')
	return { created, skipped }
}

// ---------- linux host checks ----------

const gjsProbe = (args) => {
	try {
		return spawnSync('gjs', args, { encoding: 'utf8', timeout: 10_000 }).status === 0
	} catch {
		return false
	}
}

const GJS_TYPELIB_PROBE =
	'imports.gi.versions.Gtk="4.0";imports.gi.versions.WebKit="6.0";imports.gi.versions.Adw="1";' +
	'void imports.gi.Gtk;void imports.gi.WebKit;void imports.gi.Adw'

/** Linux host prerequisites as a missing-item list (empty when satisfied). */
export function linuxMissingPrerequisites() {
	const missing = []
	if (!gjsProbe(['--version'])) {
		missing.push('gjs')
	} else if (!gjsProbe(['-c', GJS_TYPELIB_PROBE])) {
		missing.push('GTK4/WebKitGTK/Adwaita typelibs (gir1.2-webkit-6.0, gir1.2-adw-1)')
	}

	return missing
}

/** The published `@octane-xplat/ui` map needs a `linux` condition or packed
 *  consumers silently fall back to the web build, losing openWindow and
 *  colorScheme host overrides. */
function uiHasLinuxExport(root) {
	const manifest = resolveFrom(root, '@octane-xplat/ui/package.json')
	if (!manifest) {
		return false
	}

	try {
		return Boolean(JSON.parse(readFileSync(manifest, 'utf8')).exports?.['.']?.linux)
	} catch {
		return false
	}
}

function linuxDoctor(root, sharedRequirements, configFile) {
	const backend = 'gtk4/webkitgtk dom host (gjs)'
	if (process.platform !== 'linux') {
		return {
			backend,
			requirements: {},
			status: 'remote-host-required',
			note: 'Linux runs on the qualified GTK/WebKitGTK runtime — run `xplat workshop dev --target linux` in that host\'s checkout',
		}
	}

	const requirements = {
		...sharedRequirements,
		'workshop.config': Boolean(configFile),
		gjs: gjsProbe(['--version']),
		'GTK4/WebKitGTK/Adwaita typelibs': gjsProbe(['-c', GJS_TYPELIB_PROBE]),
		'@octane-xplat/ui linux export': uiHasLinuxExport(root),
	}

	return {
		backend,
		requirements,
		status: Object.values(requirements).every(Boolean) ? 'available' : 'missing-prerequisites',
	}
}

// ---------- dev ----------

/**
 * Shared dev-server seam for every DOM target — the caller owns process
 * lifecycle (signal handlers, host subprocess). Exported so qualification
 * harnesses can boot the exact production wiring.
 */
export async function startWorkshopServer({ root, config, target, story, port } = {}) {
	const [{ createServer, searchForWorkspaceRoot }, { octane }] = await Promise.all([
		importFrom(root, 'vite'),
		importFrom(root, '@octanejs/vite-plugin'),
	])

	const assetRoots = Object.values(config.assets ?? {}).map((dir) => resolve(root, dir))
	const server = await createServer({
		root,
		configFile: false,
		mode: 'development',
		logLevel: 'info',
		plugins: [
			// The workshop's 'pre' hotUpdate must run before the octane plugin's
			// own 'pre' hook, so the story catalog answers edits before octane
			// can force a full page reload.
			...xplatWorkshop({ cwd: root, config, target, story }),
			...octane(),
			xplatBoundary(target),
			xplatDevBridge(),
		],
		define: xplatNodeEnvDefine('development'),
		server: {
			...(port ? { port, strictPort: true } : {}),
			fs: {
				allow: [
					...new Set(
						[searchForWorkspaceRoot(root), root, ...assetRoots].filter(Boolean),
					),
				],
			},
		},
	})

	await server.listen()
	const address = server.httpServer?.address()
	const resolvedPort = typeof address === 'object' && address ? address.port : port
	const url = `http://localhost:${resolvedPort}/`
	console.log(`WORKSHOP_READY ${url}`)
	server.printUrls()
	return { server, url }
}

export async function workshopDev({ cwd, target = 'web', story, port, device } = {}) {
	const root = consumerRoot(cwd)
	if (target === 'macos') {
		const { config } = await loadWorkshopConfig(root)
		const { workshopMacOSDev } = await import('./macos-node.mjs')
		return workshopMacOSDev({ root, config, story })
	}

	if (target === 'ios' || target === 'android') {
		if (port !== undefined) {
			throw new WorkshopUsageError('Mobile workshop uses the consumer native Vite server port; configure it in the native Vite config')
		}

		const prerequisites = mobilePrerequisites(root, target)
		if (prerequisites.status !== 'unqualified-backend') {
			throw new WorkshopUsageError(`Mobile workshop ${target}: ${prerequisites.status}. Run xplat workshop doctor and follow @octane-xplat/workshop/MOBILE.md setup.`)
		}

		const { config } = await loadWorkshopConfig(root)
		try { return await launchMobile({ root, target, device, story, config }) }
		catch (error) { throw new WorkshopUsageError(error.message) }
	}

	if (target === 'windows') {
		throw new WorkshopUsageError(windowsLaunchBlocker(windowsPreflight(root)))
	}

	if (target !== 'web' && target !== 'linux') {
		throw new WorkshopUsageError(
			`xplat workshop dev --target ${target}: this workshop preview provides web, linux, macos, ios and android launch paths — ` +
				`run \`xplat workshop doctor\` for per-target status`,
		)
	}

	const gjsHost = target === 'linux' ? checkLinuxHost(root) : null
	const { config } = await loadWorkshopConfig(root)
	const { server, url } = await startWorkshopServer({ root, config, target, story, port })

	if (target === 'linux') {
		return runLinuxHost({ server, url, gjsHost })
	}

	const shutdown = async () => {
		await server.close()
		process.exit(0)
	}

	process.on('SIGINT', shutdown)
	process.on('SIGTERM', shutdown)
	return server
}

/** Gate the Linux launch before the dev server binds: the GTK host runs on
 *  Linux only, needs gjs + the WebKitGTK/Adwaita typelibs, and launches the
 *  canonical host shipped in @octane-xplat/cli. Returns the host script path. */
function checkLinuxHost(root) {
	if (process.platform !== 'linux') {
		throw new WorkshopUsageError(
			'xplat workshop dev --target linux: the GTK4/WebKitGTK host runs on Linux only — ' +
				'run this command in the Linux host\'s own checkout. `xplat workshop doctor` reports per-target status',
		)
	}

	const missing = linuxMissingPrerequisites()
	if (missing.length) {
		throw new WorkshopUsageError(
			`xplat workshop dev --target linux: missing host prerequisites: ${missing.join(', ')} — ` +
				'on Debian/Ubuntu install: gjs libgtk-4-1 libadwaita-1-0 libwebkitgtk-6.0-4 gir1.2-webkit-6.0 gir1.2-adw-1',
		)
	}

	const cliManifest = resolveFrom(root, '@octane-xplat/cli/package.json')
	const gjsHost = cliManifest
		? join(dirname(cliManifest), 'src', 'linux', 'host', 'gjs-host.js')
		: null

	if (!gjsHost || !existsSync(gjsHost)) {
		throw new WorkshopUsageError(
			'xplat workshop dev --target linux: cannot find the GJS host in @octane-xplat/cli ' +
				'(expected cli/src/linux/host/gjs-host.js) — update @octane-xplat/cli',
		)
	}

	return gjsHost
}

/** Launch the canonical GJS/WebKitGTK host at the dev server and own both
 *  halves' lifecycle: closing the host window stops the server, a dying
 *  server kills the host, and signals shut both down. */
async function runLinuxHost({ server, url, gjsHost }) {
	// A distinct application id keeps workshop media-permission/config state
	// out of the app under development's directories.
	const host = spawn('gjs', [gjsHost, url], {
		stdio: 'inherit',
		env: { ...process.env, XPLAT_PROBE_APP_ID: 'org.octane.xplat.workshop' },
	})

	let exiting = false
	const shutdown = async (code = 0) => {
		if (exiting) {
			return
		}

		exiting = true
		if (host.exitCode === null && !host.killed) {
			host.kill()
		}

		await server.close().catch(() => {})
		process.exit(code)
	}

	host.on('exit', (code) => void shutdown(code ?? 0))
	host.on('error', async (error) => {
		console.error(`xplat workshop: failed to launch the Linux host — ${error.message}`)
		await shutdown(1)
	})

	process.on('SIGINT', () => void shutdown(0))
	process.on('SIGTERM', () => void shutdown(0))
	return server
}
