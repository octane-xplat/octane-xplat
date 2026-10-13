/**
 * Node backend for `xplat workshop …` — the CLI resolves this module from
 * the consumer's installed @octane-xplat/workshop and delegates.
 */
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

	const nativeConfig = existsSync(join(root, 'nativescript.config.ts'))
	for (const target of ['ios', 'android']) {
		report.targets[target] = {
			backend: 'nativescript',
			requirements: { 'nativescript.config.ts': nativeConfig },
			status: 'unqualified-backend',
			note: 'the workshop does not yet support this target (package A delivers the web preview)',
		}
	}

	report.targets.macos = {
		backend: 'appkit/jsc renderer',
		requirements: {},
		status: 'unqualified-backend',
		note: 'the workshop does not yet support this target',
	}

	report.targets.windows = windowsPreflight(root)

	report.targets.linux = {
		backend: 'gtk4/webkitgtk dom host',
		requirements: {},
		status: 'unqualified-backend',
		note: 'the workshop does not yet support this target; Linux runs on the qualified Linux runtime',
	}

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

const STORY_TEMPLATE = `import { Pressable, Text, useStore, type Store } from '@octane-xplat/ui'
import { defineStory } from '@octane-xplat/workshop'

type Props = { step: number }
type State = { count: number }
type Fixture = { account: string }

function WorkshopCounter(p: Props & { state: Store<State>; fixture: Fixture }) {
	const { count } = useStore(p.state)
	return (
		<Pressable
			accessibilityLabel="Increment"
			onPress={() => p.state.set((s) => ({ count: s.count + p.step }))}
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

// ---------- dev ----------

export async function workshopDev({ cwd, target = 'web', story, port } = {}) {
	const root = consumerRoot(cwd)
	if (target === 'windows') {
		throw new WorkshopUsageError(windowsLaunchBlocker(windowsPreflight(root)))
	}

	if (target !== 'web') {
		throw new WorkshopUsageError(
			`xplat workshop dev --target ${target}: this workshop release supports the web target only — ` +
				`run \`xplat workshop doctor\` for per-target status`,
		)
	}

	const { config } = await loadWorkshopConfig(root)
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
			xplatBoundary('web'),
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
	console.log(`WORKSHOP_READY http://localhost:${resolvedPort}/`)
	server.printUrls()

	const shutdown = async () => {
		await server.close()
		process.exit(0)
	}

	process.on('SIGINT', shutdown)
	process.on('SIGTERM', shutdown)
	return server
}
