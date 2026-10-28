import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { xplatMacOS } from '../../cli/src/macos/vite.ts'
import { macOSExecutable } from '../../cli/src/macos/executables.ts'
import { writeNativeBootstrap } from '../../cli/src/macos/native.ts'
import { hostBundle, validateHostBundle } from '../../cli/src/macos/jsc-host/runtime.ts'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const appRoot = fileURLToPath(new URL('../../../apps/macos', import.meta.url))
const directory = await mkdtemp(join(tmpdir(), 'octane-motion-channels-'))
try {
	const entry = join(directory, 'entry.ts')
	await writeFile(
		entry,
		`import { runChannels } from ${JSON.stringify(join(packageRoot, 'tests/channels.macos.tsx'))}\nimport { runLayout } from ${JSON.stringify(join(packageRoot, 'tests/layout.macos.tsx'))}\nNSApplication.sharedApplication\nvoid runChannels().then(runLayout).catch(error => { console.error("MOTION_LAYOUT_FAIL", error.message, error.stack); }).finally(() => (globalThis as any).__xplatStopHost())\n`,
	)

	const config = await xplatMacOS('development', {
		root: appRoot,
		entry,
		outDir: directory,
		packaged: true,
	})

	await build({
		...config,
		configFile: false,
		logLevel: 'error',
		build: { ...config.build, emptyOutDir: false },
	})

	const bundle = join(directory, 'main.cjs')
	await validateHostBundle(bundle, appRoot)
	const bootstrap = join(directory, 'bootstrap.js')
	await writeNativeBootstrap(
		{
			prebuilt: [
				{
					source: join(
						packageRoot,
						'../macos-renderer/platforms/macos/prebuilt/libxplatmason.dylib',
					),
				},
			],
			libraries: [],
		},
		bootstrap,
	)

	const result = spawnSync(
		await macOSExecutable(appRoot, 'macos-arm64/host'),
		[
			join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
			bundle,
			join(hostBundle, 'metadata.nsmd'),
			bootstrap,
		],
		{
			cwd: directory,
			encoding: 'utf8',
			timeout: 15000,
			env: { ...process.env, OCTANE_MACOS_AUTOMATION: '1' },
		},
	)

	const output = result.stdout + result.stderr
	assert.equal(result.status, 0, output)
	assert.doesNotMatch(output, /MOTION_CHANNELS_FAIL|uncaught render error/)
	assert.match(output, /MOTION_CHANNELS_OK/)
	assert.match(output, /MOTION_LAYOUT_OK/)
	console.log(output)
} finally {
	await rm(directory, { recursive: true, force: true })
}
