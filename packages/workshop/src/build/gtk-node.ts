// @ts-nocheck — Node driver for the GTK workshop: builds the shell once and
// the stories bundle in watch mode, launches the GTK host, and forwards the same
// stdin line protocol the macOS driver speaks.
import { createRequire } from 'node:module'
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises'
import { WorkshopUsageError } from './node.ts'
import { nativeCatalogPlugin } from './native-catalog-vite.ts'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawn, spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline'

const gjsEnv = () => {
	const env = { ...process.env }
	if (process.platform === 'darwin') {
		const prefix = spawnSync('brew', ['--prefix'], { encoding: 'utf8' }).stdout.trim()
		if (prefix) {
			env.DYLD_FALLBACK_LIBRARY_PATH = [join(prefix, 'lib'), env.DYLD_FALLBACK_LIBRARY_PATH]
				.filter(Boolean)
				.join(':')
		}
	}
	return env
}

const gjsProbe = (args) => {
	try {
		return spawnSync('gjs', args, { encoding: 'utf8', timeout: 10_000, env: gjsEnv() }).status === 0
	} catch {
		return false
	}
}

/** The XplatMason GI artifact directory inside the installed renderer, or null. */
function masonTypelibDir(root) {
	try {
		const entry = createRequire(join(root, 'package.json')).resolve('@octane-xplat/linux-gtk')
		const dir = join(dirname(entry), '..', 'native', 'xplatmason')
		return existsSync(join(dir, 'XplatMason-1.0.typelib')) ? dir : null
	} catch {
		return null
	}
}

function gtkPreset(root) {
	const require = createRequire(join(root, 'package.json'))
	return import(pathToFileURL(require.resolve('@octane-xplat/cli/linux-gtk/vite')).href)
}

async function gtkRequirements(root) {
	const require = createRequire(join(root, 'package.json'))
	const requirements = {}
	try {
		require.resolve('@octane-xplat/linux-gtk')
		requirements['@octane-xplat/linux-gtk'] = true
	} catch {
		requirements['@octane-xplat/linux-gtk'] = false
	}
	if (process.platform === 'linux') {
		try {
			const { hasGtkDevelopmentRuntime } = await gtkPreset(root)
			requirements['NativeScript Linux runtime'] = hasGtkDevelopmentRuntime(root)
		} catch {
			requirements['NativeScript Linux runtime'] = false
		}
	} else {
		requirements.gjs = gjsProbe(['--version'])
		requirements['GTK 4 typelib'] = requirements.gjs &&
			gjsProbe(['-c', 'imports.gi.versions.Gtk="4.0";void imports.gi.Gtk'])
	}
	return requirements
}

export async function gtkMissingPrerequisites(root) {
	return Object.entries(await gtkRequirements(root))
		.filter(([, available]) => !available)
		.map(([name]) => name)
}

export async function gtkDoctor(root, configFile) {
	const backend = process.platform === 'linux' ? 'GTK4 (NativeScript Linux)' : 'GTK4 (GJS)'
	if (process.platform !== 'linux' && process.platform !== 'darwin') {
		return {
			backend,
			requirements: {},
			status: 'unsupported-host',
			note: 'the GTK workshop launches on Linux, or on macOS with Homebrew GJS as a development stand-in',
		}
	}
	const requirements = { ...await gtkRequirements(root), 'workshop.config': Boolean(configFile) }
	return {
		backend,
		requirements,
		status: Object.values(requirements).every(Boolean) ? 'available' : 'missing-prerequisites',
	}
}

/** Generate a session-owned build directory; app entries stay untouched. */
export async function workshopGtkDev({ root, config, story, profileRoot, onStarted }) {
	if (process.platform !== 'linux' && process.platform !== 'darwin') {
		throw new Error(
			'The GTK workshop runs on Linux, or on macOS with Homebrew gjs as a development stand-in',
		)
	}
	const missing = await gtkMissingPrerequisites(root)
	if (missing.length) {
		throw new WorkshopUsageError(
			`GTK workshop prerequisites missing: ${missing.join(', ')}` +
				(process.platform === 'darwin'
					? ' — on macOS install Homebrew gjs + gtk4 (development stand-in)'
					: ''),
		)
	}
	if (process.platform !== 'linux') {
		console.log('xplat workshop: non-Linux gjs is a development stand-in, not Linux qualification')
	}

	const require = createRequire(join(root, 'package.json'))
	for (const name of [
		'@octane-xplat/cli/linux-gtk/vite',
		'@octane-xplat/linux-gtk',
		'octane',
		'vite',
	]) {
		try {
			require.resolve(name)
		} catch {
			throw new WorkshopUsageError(`GTK workshop prerequisite missing: ${name}`)
		}
	}

	const source = dirname(fileURLToPath(import.meta.url)).replace('/dist/', '/src/')
	const shell = join(source, 'gtk/shell.gtk.ts')
	const chromeCss = join(source, '../native/chrome.css')
	const cache = profileRoot ?? join(root, 'node_modules/.cache/xplat/workshop-gtk')
	await mkdir(cache, { recursive: true })
	const directory = await mkdtemp(join(cache, 'session-'))
	const bundle = join(directory, 'stories.cjs')
	const catalogFile = join(directory, 'catalog.gen.ts')
	const shellOut = join(directory, 'shell-out')
	await mkdir(shellOut)
	const { linuxGtk, stageGtkDevelopmentRuntime } = await gtkPreset(root)
	const nativeHost = process.platform === 'linux'
		? stageGtkDevelopmentRuntime(root, shellOut, 'shell.js')
		: null
	const typelibDir = nativeHost ? null : masonTypelibDir(root)

	// Build the shell once. Story revisions share its runtime instances.
	await writeFile(
		join(directory, 'entry.ts'),
		`import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/utilities.css'
import ${JSON.stringify(chromeCss)}
import { startGtkWorkshop } from ${JSON.stringify(shell)}
startGtkWorkshop({ bundleFile: ${JSON.stringify(bundle)}, initialStoryId: ${JSON.stringify(story ?? null)} })
`,
	)

	const { build } = await import(pathToFileURL(require.resolve('vite')).href)
	const shellSettings = await linuxGtk('production', { root, nativeGiSchema: nativeHost?.schema })
	await build({
		logLevel: 'error',
		configFile: false,
		...shellSettings,
		build: {
			...shellSettings.build,
			outDir: shellOut,
			emptyOutDir: false,
			lib: { entry: join(directory, 'entry.ts'), formats: ['es'], fileName: () => 'shell.js' },
		},
	})

	// Stories: CJS bundle rebuilt in watch mode; runtime singletons external,
	// resolved by the shell's own module map at evaluation time.
	const singletons = [
		'octane/universal/native',
		'octane/signals',
		'octane/signals/client',
		'octane/internal/client',
		'@nativescript/core',
		'@nativescript/core/animation-frame',
		'@octane-xplat/nativescript-octane',
		'@octane-xplat/linux-gtk',
	]
	const storySettings = await linuxGtk('production', { root })
	// The preset aliases runtime specifiers to absolute paths — externals must
	// match the resolved paths too or a second octane bundles into stories.
	const resolvedSingletons = new Set()
	for (const name of singletons) {
		try {
			resolvedSingletons.add(require.resolve(name))
		} catch {}
	}
	for (const alias of storySettings.resolve?.alias ?? []) {
		if (typeof alias === 'object' && singletons.includes(alias.find)) {
			resolvedSingletons.add(alias.replacement)
		}

		if (typeof alias === 'object' && alias.find instanceof RegExp) {
			for (const name of singletons) {
				if (alias.find.test(name)) {
					resolvedSingletons.add(alias.replacement)
				}
			}
		}
	}

	const watcher = await build({
		logLevel: 'error',
		configFile: false,
		...storySettings,
		plugins: [
			nativeCatalogPlugin({ root, config, catalogFile, target: 'linux' }),
			...(storySettings.plugins ?? []),
		],
		build: {
			...storySettings.build,
			outDir: directory,
			emptyOutDir: false,
			watch: {},
			lib: { entry: catalogFile, formats: ['cjs'], fileName: () => 'stories.cjs' },
			rollupOptions: {
				external: (id) =>
					id.startsWith('gi://') || singletons.includes(id) || resolvedSingletons.has(id),
				output: { codeSplitting: false },
			},
		},
	})

	const env = gjsEnv()
	if (typelibDir) {
		env.GI_TYPELIB_PATH = [typelibDir, env.GI_TYPELIB_PATH].filter(Boolean).join(':')
	}

	// The stories bundle must exist before the host evaluates it — launch only
	// after the watch build's first END event.
	await new Promise((resolveSpawn, rejectSpawn) => {
		let first = false
		watcher.on?.('event', (event) => {
			if (!first && (event.code === 'END' || event.code === 'BUNDLE_END') && existsSync(bundle)) {
				first = true
				resolveSpawn()
			} else if (!first && event.code === 'ERROR') {
				rejectSpawn(event.error)
			}
		})
		if (existsSync(bundle)) {
			resolveSpawn()
		}
	})

	const host = spawn(nativeHost?.executable ?? 'gjs', nativeHost ? [] : ['-m', join(shellOut, 'shell.js')], {
		stdio: ['pipe', 'inherit', 'inherit'],
		env,
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
		await watcher.close?.().catch?.(() => {})
		await rm(directory, { recursive: true, force: true })
		process.exit(code)
	}

	// External automation (the e2e journeys) writes the same line protocol to
	// this process's stdin — forward it to the GTK host.
	const input = createInterface({ input: process.stdin })
	input.on('line', (line) => {
		if (host.stdin.writable) {
			host.stdin.write(`${line}\n`)
		}
	})

	host.once('spawn', () => {
		try {
			onStarted?.({ kind: 'native-host-spawned', pid: host.pid })
		} catch (error) {
			console.error(error)
			void shutdown(1)
		}
	})
	host.on('exit', (code) => void shutdown(code ?? 0))
	host.on('error', async (error) => {
		console.error(`xplat workshop: failed to launch the GTK host — ${error.message}`)
		await shutdown(1)
	})
	process.on('SIGINT', () => void shutdown(0))
	process.on('SIGTERM', () => void shutdown(0))

	// Rebuild notifications ride the same stdin protocol as the macOS driver.
	watcher.on?.('event', (event) => {
		if (event.code === 'START') {
			host.stdin.write('rebuilding\n')
		} else if (event.code === 'END' && existsSync(bundle)) {
			host.stdin.write('reload\n')
		} else if (event.code === 'ERROR') {
			host.stdin.write(`compile-error ${JSON.stringify(String(event.error?.message ?? event.error))}\n`)
		}
	})

	return { host, watcher }
}
