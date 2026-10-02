import assert from 'node:assert/strict'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repo = resolve(packageRoot, '../..')
const directory = await mkdtemp(join(tmpdir(), 'xplat-macos-renderer-'))
const packs = join(directory, 'packs')
const app = join(directory, 'consumer')
await mkdir(packs)
await mkdir(join(app, 'src'), { recursive: true })

function run(command, args, cwd = app) {
	return execFileSync(command, args, {
		cwd,
		encoding: 'utf8',
		timeout: 180_000,
		maxBuffer: 16 * 1024 * 1024,
		env: { ...process.env, MACOS_SIGNING_IDENTITY: '', MACOS_NOTARY_PROFILE: '' },
	})
}

async function pack(root) {
	const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
	run('pnpm', ['pack', '--pack-destination', packs], root)
	return `file:${join(packs, `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`)}`
}

const renderer = await pack(packageRoot)
const cli = await pack(join(repo, 'packages/cli'))
const fixture = join(packageRoot, 'test/fixtures')
for (const file of ['App.macos.tsx', 'main.mjs', 'dev-shell.mjs', 'types.ts']) {
	await cp(join(fixture, file), join(app, 'src', file))
}

for (const file of ['vite.config.mjs', 'vite.dev.config.mjs', 'vite.shell.config.mjs']) {
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
				'@nativescript/macos-node-api': '0.4.4-next.2026-08-09-31292056208',
				octane: '0.6.3',
			},
			devDependencies: {
				'@octane-xplat/cli': cli,
				'@octanejs/vite-plugin': '0.1.61',
				vite: '8.3.0',
				typescript: '5.9.3',
			},
			xplat: {
				targets: {
					macos: {
						runtime: 'appkit-node-api',
						dev: {
							viteConfig: 'vite.dev.config.mjs',
							bundleFile: 'dist/dev/app.cjs',
							shellViteConfig: 'vite.shell.config.mjs',
							shellBundleFile: 'dist/dev/main.cjs',
						},
						package: {
							productName: 'RendererConsumer',
							bundleIdentifier: 'org.octane.xplat.renderer-consumer',
							executableName: 'RendererConsumer',
							version: '0.1.0',
							minimumSystemVersion: '13.5',
							viteConfig: 'vite.config.mjs',
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
	'packages: []\nnodeLinker: isolated\nallowUnusedPatches: true\n',
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
				jsxImportSource: '@octane-xplat/macos-renderer',
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
run('pnpm', ['install', '--ignore-scripts'])
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
	const executable = join(
		app,
		'artifacts/macos-arm64/RendererConsumer.app/Contents/MacOS/RendererConsumer',
	)

	const result = spawnSync(executable, [], {
		cwd: directory,
		encoding: 'utf8',
		timeout: 15_000,
		env: { ...process.env, OCTANE_MACOS_AUTOMATION: '1', XPLAT_RENDERER_CONSUMER_TEST: '1' },
	})

	const output = result.stdout + result.stderr
	assert.equal(result.status, 0, output)
	assert.match(output, /PACKED_RENDERER_OK/)
	assert.doesNotMatch(output, /PACKED_RENDERER_FAIL|uncaught render error/)
	console.log('[packed renderer] packaged AppKit system fonts and signal updates pass')

	console.log('[packed renderer] verifying retained-root HMR')
	const dev = spawn('pnpm', ['exec', 'xplat', 'dev', '--targets', 'macos'], {
		cwd: app,
		stdio: ['ignore', 'pipe', 'pipe'],
		env: { ...process.env, OCTANE_MACOS_AUTOMATION: '1' },
	})

	let devOutput = ''
	let editing
	let verified = false
	let failure
	const deadline = setTimeout(() => dev.kill('SIGTERM'), 60_000)
	for (const stream of [dev.stdout, dev.stderr]) {
		stream.on('data', (chunk) => {
			devOutput += chunk.toString()
			if (!editing && devOutput.includes('HMR_CONSUMER_READY')) {
				editing = (async () => {
					const source = join(app, 'src/App.macos.tsx')
					await writeFile(
						source,
						(await readFile(source, 'utf8')).replace('First revision', 'Second revision'),
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
		assert.ifError(failure)
		assert.equal(verified, true, devOutput.slice(-5000))
		assert.doesNotMatch(devOutput, /PACKED_HMR_FAIL|uncaught render error/)
	} finally {
		clearTimeout(deadline)
		if (dev.exitCode === null && dev.signalCode === null) {
			dev.kill('SIGTERM')
		}
	}

	console.log('[packed renderer] HMR preserves native view identity and signal state')
}

console.log(`Packed renderer consumer passed: ${directory}`)
