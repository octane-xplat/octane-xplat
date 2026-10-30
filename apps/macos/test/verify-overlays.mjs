import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { createMacOSConfig } from '../vite.shared.mjs'
import { macOSExecutable } from '../../../packages/cli/src/macos/executables.ts'
import {
	macOSHostArch,
	hostBundle,
	validateHostBundle,
} from '../../../packages/cli/src/macos/jsc-host/runtime.ts'
import {
	buildMacOSNative,
	writeNativeBootstrap,
} from '../../../packages/cli/src/macos/native.ts'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const scratch = resolve(appRoot, '../../research')
await mkdir(scratch, { recursive: true })
const directory = await mkdtemp(join(scratch, 'macos-overlays-'))
const bootstrap = join(directory, 'bootstrap.js')
const artifact = await buildMacOSNative(appRoot)
await writeNativeBootstrap(artifact, bootstrap)
const config = await createMacOSConfig({
	packaged: true,
	rules: [{ include: '**/*.{tsx,tsrx}', renderer: 'macos' }],
})({ mode: 'production' })

{
	const entry = join(directory, 'main.mjs')
	await writeFile(
		entry,
		[
			`import 'virtual:bamboo.css'`,
			`import { runOverlayFixture } from ${JSON.stringify(join(appRoot, 'test/overlay-fixture.macos.tsx'))}`,
			`NSApplication.sharedApplication`,
			`void runOverlayFixture()`,
		].join('\n'),
	)

	await build({
		...config,
		configFile: false,
		logLevel: 'error',
		build: {
			...config.build,
			minify: false,
			outDir: directory,
			emptyOutDir: false,
			lib: { entry, formats: ['cjs'], fileName: 'fixture' },
		},
	})

	const bundle = join(directory, 'fixture.cjs')
	await validateHostBundle(bundle, appRoot)
	const result = spawnSync(
		await macOSExecutable(appRoot, 'macos/host'),
		[
			join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
			bundle,
			artifact.metadata[macOSHostArch()],
			bootstrap,
		],
		{
			cwd: directory,
			env: { ...process.env, OCTANE_MACOS_AUTOMATION: '1' },
			encoding: 'utf8',
			timeout: 20_000,
		},
	)

	const output = result.stdout + result.stderr
	assert.equal(result.status, 0, output)
	assert.doesNotMatch(output, /APPKIT_OVERLAYS_FAIL|uncaught render error/)
	assert.match(output, /APPKIT_OVERLAYS_OK/)
}

console.log(
	'Isolated AppKit overlay fixture passed (no screenshots; handler/API and native-state evidence)',
)
