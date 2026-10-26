import assert from 'node:assert/strict'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const actionBarOnly = process.argv.includes('--actionbar')
const liquidGlassOnly = process.argv.includes('--liquidglass')

const ambientEnv = { ...process.env }
delete ambientEnv.XPLAT_MASON_LIB

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repo = resolve(packageRoot, '../..')
const directory = await mkdtemp(join(tmpdir(), 'xplat-macos-renderer-'))
console.log('[packed renderer] consumer: ' + directory)
const packs = join(directory, 'packs')
const app = join(directory, 'consumer')
await mkdir(packs)
await mkdir(join(app, 'src'), { recursive: true })

function run(command: string, args: string[], cwd = app) {
	return execFileSync(command, args, {
		cwd,
		encoding: 'utf8',
		timeout: 180_000,
		maxBuffer: 16 * 1024 * 1024,
		env: { ...ambientEnv, MACOS_SIGNING_IDENTITY: '', MACOS_NOTARY_PROFILE: '' },
	})
}

async function pack(root: string) {
	const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
	run('pnpm', ['pack', '--pack-destination', packs], root)
	return `file:${join(packs, `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`)}`
}

const renderer = await pack(packageRoot)
assert.ok(
	run('tar', ['-tzf', renderer.slice('file:'.length)], packs).includes(
		'package/platforms/macos/prebuilt/libxplatmason.dylib',
	),
	'packed renderer must ship the prebuilt Mason engine',
)
const cssEngine = await pack(join(repo, 'packages/css-engine'))
const platform = await pack(join(repo, 'packages/platform'))
const jsx = await pack(join(repo, 'packages/jsx'))
const cli = await pack(join(repo, 'packages/cli'))
const lib = await pack(join(repo, 'packages/lib'))
const lint = await pack(join(repo, 'packages/lint'))
const create = await pack(join(repo, 'packages/create'))
// Signal-reading fixtures need the patched compiler and oxc parser; mirror the
// release compatibility pins (octane must match the cli patch manifest's
// `octane@*` specifier or the patch is skipped as unused).
const compatibility = JSON.parse(
	await readFile(join(repo, 'packages/create/compatibility.json'), 'utf8'),
)

const octaneVersion = compatibility.packages.octane.version
const oxcVersion = compatibility.packages['@tsrx/oxc'].version
const fixture = join(packageRoot, 'test/fixtures')
for (const file of [
	'App.macos.tsx',
	'Content.macos.tsx',
	'Dock.macos.tsx',
	'Wrap.macos.tsx',
	'Proxy.macos.tsx',
	'Root.macos.tsx',
	'ListView.macos.tsx',
	'listview-lifecycle.ts',
	'List.macos.tsx',
	'list-lifecycle.ts',
	'Tab.macos.tsx',
	'tab-lifecycle.ts',
	'Time.macos.tsx',
	'time-lifecycle.ts',
	'Date.macos.tsx',
	'date-lifecycle.ts',
	'SegmentItem.macos.tsx',
	'segment-item-lifecycle.ts',
	'Segment.macos.tsx',
	'segment-lifecycle.ts',
	'Progress.macos.tsx',
	'progress-lifecycle.ts',
	'Activity.macos.tsx',
	'activity-lifecycle.ts',
	'Html.macos.tsx',
	'html-lifecycle.ts',
	'Formatted.macos.tsx',
	'formatted-lifecycle.ts',
	'Search.macos.tsx',
	'search-lifecycle.ts',
	'ActionBar.macos.tsx',
	'actionbar-lifecycle.ts',
	'Placeholder.macos.tsx',
	'placeholder-lifecycle.ts',
	'LiquidGlass.macos.tsx',
	'liquidglass-lifecycle.ts',
	'root-lifecycle.ts',
	'proxy-lifecycle.ts',
	'wrap-lifecycle.ts',
	'dock-lifecycle.ts',
	'content-lifecycle.ts',
	'main.ts',
	'dev-shell.ts',
	'types.ts',
	'style-merge.ts',
	'globals.d.ts',
]) {
	await cp(join(fixture, file), join(app, 'src', file))
}

if (actionBarOnly) {
	for (const [source, target] of [
		['actionbar-main.ts', 'main.ts'],
		['ActionBarHmr.macos.tsx', 'App.macos.tsx'],
		['actionbar-dev-shell.ts', 'dev-shell.ts'],
	]) {
		await cp(join(fixture, source), join(app, 'src', target))
	}
}

if (liquidGlassOnly) {
	for (const [source, target] of [
		['liquidglass-main.ts', 'main.ts'],
		['LiquidGlassHmr.macos.tsx', 'App.macos.tsx'],
		['liquidglass-dev-shell.ts', 'dev-shell.ts'],
	]) {
		await cp(join(fixture, source), join(app, 'src', target))
	}
}

// Keep the contributor example checked by the same independent consumer.
const ledger = await readFile(join(repo, '.agents/docs/notes/appkit-native-intrinsics.md'), 'utf8')
const examples = [...ledger.matchAll(/```tsx\n([\s\S]*?)```/g)]
assert.equal(
	examples.length,
	22,
	'Intrinsic ledger must include checked MasonView, ContentView, dock/wrap emulation, ProxyViewContainer, RootLayout, SearchBar, FormattedString, HtmlView, ActivityIndicator, DatePicker, ListPicker, Progress, SegmentedBar, SegmentedBarItem, TimePicker, Placeholder, ActionBar and LiquidGlass examples',
)

for (const [index, example] of examples.entries()) {
	await writeFile(join(app, `src/Example${index}.macos.tsx`), example[1])
}

for (const [index, example] of [...ledger.matchAll(/```ts\n([\s\S]*?)```/g)].entries()) {
	await writeFile(join(app, `src/ExampleTypes${index}.ts`), example[1])
}

for (const file of ['vite.config.ts', 'vite.dev.config.ts', 'vite.shell.config.ts']) {
	await cp(join(fixture, file), join(app, file))
}

await writeFile(
	join(app, 'package.json'),
	JSON.stringify(
		{
			name: 'macos-renderer-consumer',
			private: true,
			type: 'module',
			dependencies: {
				'@octane-xplat/macos-renderer': renderer,
				'@octane-xplat/css-engine': cssEngine,
				'@octane-xplat/platform': platform,
				'@octane-xplat/jsx': jsx,
				'@nativescript/macos-node-api':
					compatibility.packages['@nativescript/macos-node-api'].version,
				octane: octaneVersion,
			},
			devDependencies: {
				'@octane-xplat/cli': cli,
				'@octanejs/vite-plugin': compatibility.packages['@octanejs/vite-plugin'].version,
				'@tsrx/oxc': oxcVersion,
				vite: compatibility.packages.vite.version,
				typescript: compatibility.packages.typescript.version,
			},
			xplat: {
				targets: {
					macos: {
						runtime: 'appkit-node-api',
						dev: {
							viteConfig: 'vite.dev.config.ts',
							bundleFile: 'dist/dev/app.cjs',
							shellViteConfig: 'vite.shell.config.ts',
							shellBundleFile: 'dist/dev/main.cjs',
						},
						package: {
							productName: 'RendererConsumer',
							bundleIdentifier: 'org.octane.xplat.renderer-consumer',
							executableName: 'RendererConsumer',
							version: '0.1.0',
							minimumSystemVersion: '13.5',
							viteConfig: 'vite.config.ts',
							bundleFile: 'dist/package-build/main.cjs',
						},
					},
				},
			},
		},
		null,
		2,
	),
)

await writeFile(
	join(app, 'pnpm-workspace.yaml'),
	`packages: []\nnodeLinker: isolated\nallowUnusedPatches: true\noverrides:\n  create-octane-xplat: ${JSON.stringify(create)}\n  '@octane-xplat/lib': ${JSON.stringify(lib)}\n  '@octane-xplat/lint': ${JSON.stringify(lint)}\n  '@octane-xplat/platform': ${JSON.stringify(platform)}\n  '@octane-xplat/css-engine': ${JSON.stringify(cssEngine)}\n`,
)

await writeFile(
	join(app, 'tsconfig.json'),
	JSON.stringify(
		{
			compilerOptions: {
				target: 'ESNext',
				module: 'ESNext',
				moduleResolution: 'Bundler',
				jsx: 'react-jsx',
				jsxImportSource: '@octane-xplat/jsx',
				customConditions: ['macos'],
				moduleSuffixes: ['.macos', ''],
				lib: ['ESNext'],
				types: [],
				strict: true,
				skipLibCheck: true,
				noEmit: true,
			},
			include: ['src/**/*.ts', 'src/**/*.tsx'],
		},
		null,
		2,
	),
)

console.log('[packed renderer] installing independent tarball consumer')
run('pnpm', ['install', '--ignore-scripts'])
run('pnpm', ['exec', 'xplat', 'patches', 'apply'])
// patches apply registers patchedDependencies, so this install must update
// the lockfile — frozen installs (CI default) would reject the config change.
run('pnpm', ['install', '--ignore-scripts', '--no-frozen-lockfile'])
run('pnpm', ['exec', 'tsc', '--noEmit'])
run('pnpm', ['exec', 'vite', 'build'])
const bundled = await readFile(join(app, 'dist/package-build/main.cjs'), 'utf8')
assert.doesNotMatch(bundled, /Geist|__XPLAT_GEIST|packages\/app\/src/)
console.log('[packed renderer] types and production build pass without harness assets')

if (process.platform !== 'darwin' || process.arch !== 'arm64') {
	console.log('[packed renderer] AppKit runtime and HMR require Apple Silicon macOS; not run')
} else {
	console.log('[packed renderer] packaging and launching the standalone app')
	run('pnpm', ['exec', 'xplat', 'build', '--targets', 'macos'])
	assert.ok(
		existsSync(
			join(
				app,
				'artifacts/macos-arm64/RendererConsumer.app/Contents/Frameworks/libxplatmason.dylib',
			),
		),
		'packaged app must embed the Mason engine in Contents/Frameworks',
	)
	const notices = await readFile(
		join(
			app,
			'artifacts/macos-arm64/RendererConsumer.app/Contents/Resources/licenses/THIRD-PARTY-NOTICES.txt',
		),
		'utf8',
	)
	assert.match(notices, /@octane-xplat\/macos-renderer/)
	assert.match(notices, /Apache License/)
	const executable = join(
		app,
		'artifacts/macos-arm64/RendererConsumer.app/Contents/MacOS/RendererConsumer',
	)

	const result = spawnSync(executable, [], {
		cwd: directory,
		encoding: 'utf8',
		timeout: 30_000,
		env: {
			...ambientEnv,
			OCTANE_MACOS_AUTOMATION: '1',
			XPLAT_RENDERER_CONSUMER_TEST: '1',
		},
	})

	const output = result.stdout + result.stderr
	await writeFile(join(directory, 'appkit-runtime.log'), output)
	assert.equal(result.status, 0, output)
	assert.match(output, /PACKED_RENDERER_OK/)
	if (actionBarOnly) {
		assert.match(output, /PACKED_ACTIONBAR_OK/)
	} else if (liquidGlassOnly) {
		assert.match(output, /PACKED_LIQUIDGLASS_OK/)
	} else {
		assert.match(output, /PACKED_STACKLAYOUT_OK/)
		assert.match(output, /PACKED_CONTENTVIEW_OK/)
		assert.match(output, /PACKED_DOCKLAYOUT_OK/)
		assert.match(output, /PACKED_WRAPLAYOUT_OK/)
		assert.match(output, /PACKED_PROXYVIEWCONTAINER_OK/)
		assert.match(output, /PACKED_ROOTLAYOUT_OK/)
		assert.match(output, /PACKED_SEARCHBAR_OK/)
		assert.match(output, /PACKED_FORMATTEDSTRING_OK/)
		assert.match(output, /PACKED_HTMLVIEW_OK/)
		assert.match(output, /PACKED_ACTIVITYINDICATOR_OK/)
		assert.match(output, /PACKED_SEGMENTEDBAR_OK/)
		assert.match(output, /PACKED_SEGMENTEDBARITEM_OK/)
		assert.match(output, /PACKED_PROGRESS_OK/)
		assert.match(output, /PACKED_LISTPICKER_OK/)
		assert.match(output, /PACKED_DATEPICKER_OK/)
		assert.match(output, /PACKED_TIMEPICKER_OK/)
		assert.match(output, /PACKED_LISTVIEW_OK/)
		assert.match(output, /PACKED_TABVIEW_OK/)
		assert.match(output, /PACKED_TABVIEW_ITEMS_OK/)
		assert.match(output, /PACKED_ACTIONBAR_OK/)
		assert.match(output, /PACKED_PLACEHOLDER_OK/)
		assert.match(output, /PACKED_LIQUIDGLASS_OK/)
	}

	assert.doesNotMatch(output, /PACKED_RENDERER_FAIL|uncaught render error|\[macos-mason\]/)
	console.log(
		actionBarOnly
			? '[packed renderer] ActionBar lifecycle assertions pass'
			: liquidGlassOnly
				? '[packed renderer] LiquidGlass lifecycle assertions pass'
				: '[packed renderer] packaged AppKit system fonts and signal updates pass',
	)

	console.log('[packed renderer] verifying retained-root HMR')
	const dev = spawn('pnpm', ['exec', 'xplat', 'dev', '--targets', 'macos'], {
		shell: process.platform === 'win32',
		cwd: app,
		stdio: ['ignore', 'pipe', 'pipe'],
		env: { ...ambientEnv, OCTANE_MACOS_AUTOMATION: '1' },
	})

	let devOutput = ''
	let editing: Promise<void> | undefined
	let verified = false
	let failure: unknown
	// Dev startup compiles the cold shell and then the watched app before the
	// first runtime assertion. Allow both builds under concurrent CI workloads.
	const deadline = setTimeout(() => dev.kill('SIGTERM'), 180_000)
	for (const stream of [dev.stdout!, dev.stderr!]) {
		stream.on('data', (chunk) => {
			devOutput += chunk.toString()
			if (!editing && devOutput.includes('HMR_CONSUMER_READY')) {
				editing = (async () => {
					const source = join(app, 'src/App.macos.tsx')
					await writeFile(
						source,
						(await readFile(source, 'utf8')).replaceAll('First revision', 'Second revision'),
					)
				})().catch((error) => {
					failure = error
					dev.kill('SIGTERM')
				})
			}

			if (!verified && devOutput.includes('PACKED_HMR_OK')) {
				verified = true
				dev.kill('SIGTERM')
			}
		})
	}

	try {
		await new Promise((resolve, reject) => {
			dev.once('error', reject)
			dev.once('close', resolve)
		})

		await editing
		await writeFile(join(directory, 'appkit-hmr.log'), devOutput)
		assert.ifError(failure)
		assert.equal(verified, true, devOutput.slice(-5000))
		if (actionBarOnly) {
			assert.match(devOutput, /PACKED_ACTIONBAR_HMR_OK/)
		} else if (liquidGlassOnly) {
			assert.match(devOutput, /PACKED_LIQUIDGLASS_HMR_OK/)
		} else {
			assert.match(devOutput, /PACKED_DOCKLAYOUT_HMR_OK/)
			assert.match(devOutput, /PACKED_WRAPLAYOUT_HMR_OK/)
			assert.match(devOutput, /PACKED_PROXYVIEWCONTAINER_HMR_OK/)
			assert.match(devOutput, /PACKED_CONTENTVIEW_HMR_OK/)
			assert.match(devOutput, /PACKED_ROOTLAYOUT_HMR_OK/)
			assert.match(devOutput, /PACKED_SEARCHBAR_HMR_OK/)
			assert.match(devOutput, /PACKED_FORMATTEDSTRING_HMR_OK/)
			assert.match(devOutput, /PACKED_HTMLVIEW_HMR_OK/)
			assert.match(devOutput, /PACKED_ACTIVITYINDICATOR_HMR_OK/)
			assert.match(devOutput, /PACKED_SEGMENTEDBAR_HMR_OK/)
			assert.match(devOutput, /PACKED_SEGMENTEDBARITEM_HMR_OK/)
			assert.match(devOutput, /PACKED_PROGRESS_HMR_OK/)
			assert.match(devOutput, /PACKED_LISTPICKER_HMR_OK/)
			assert.match(devOutput, /PACKED_DATEPICKER_HMR_OK/)
			assert.match(devOutput, /PACKED_TIMEPICKER_HMR_OK/)
			assert.match(devOutput, /PACKED_LISTVIEW_HMR_OK/)
			assert.match(devOutput, /PACKED_TABVIEW_HMR_OK/)
			assert.match(devOutput, /PACKED_ACTIONBAR_HMR_OK/)
			assert.match(devOutput, /PACKED_PLACEHOLDER_HMR_OK/)
		}

		assert.doesNotMatch(devOutput, /PACKED_HMR_FAIL|uncaught render error|\[macos-mason\]/)
	} finally {
		clearTimeout(deadline)
		if (dev.exitCode === null && dev.signalCode === null) {
			dev.kill('SIGTERM')
		}
	}

	console.log('[packed renderer] HMR preserves native view identity and signal state')
}

console.log(`Packed renderer consumer passed: ${directory}`)
