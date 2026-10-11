import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { xplatMacOS } from '../../cli/src/macos/vite.mjs'
import { macOSExecutable } from '../../cli/src/macos/executables.mjs'
import { hostBundle, hostRoot, validateHostBundle } from '../../cli/src/macos/jsc-host/runtime.mjs'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const appRoot = fileURLToPath(new URL('../../../apps/macos', import.meta.url))
const directory = await mkdtemp(join(tmpdir(), 'octane-motion-channels-'))
try {
	const entry = join(directory, 'entry.ts')
	await writeFile(
		entry,
		`import { runChannels } from ${JSON.stringify(join(packageRoot, 'tests/channels.macos.tsx'))}\nNSApplication.sharedApplication\nvoid runChannels()\n`,
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
	const result = spawnSync(
		await macOSExecutable(appRoot, 'macos-arm64/host'),
		[
			join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
			bundle,
			join(hostBundle, 'metadata.nsmd'),
			join(hostRoot, 'shim.js'),
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
	console.log(output)
} finally {
	await rm(directory, { recursive: true, force: true })
}
