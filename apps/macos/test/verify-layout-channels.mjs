import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { createMacOSConfig } from '../vite.shared.mjs'
import { macOSExecutable } from '../../../packages/cli/src/macos/executables.mjs'
import {
	hostBundle,
	hostRoot,
	validateHostBundle,
} from '../../../packages/cli/src/macos/jsc-host/runtime.mjs'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const scratch = resolve(appRoot, '../../research')
await mkdir(scratch, { recursive: true })
const directory = await mkdtemp(join(scratch, 'macos-layout-channels-'))
const bootstrap = join(directory, 'bootstrap.js')
await writeFile(bootstrap, await readFile(join(hostRoot, 'shim.js'), 'utf8'))
const config = await createMacOSConfig({
	packaged: true,
	rules: [{ include: '**/*.{tsx,tsrx}', renderer: 'macos' }],
})({ mode: 'production' })

const entry = join(directory, 'main.mjs')
await writeFile(
	entry,
	[
		`import { runLayoutChannelsFixture } from ${JSON.stringify(join(appRoot, 'test/layout-channels-fixture.macos.tsx'))}`,
		`NSApplication.sharedApplication`,
		`runLayoutChannelsFixture()`,
	].join('\n'),
)

await build({
	...config,
	configFile: false,
	logLevel: 'error',
	build: {
		...config.build,
		outDir: directory,
		emptyOutDir: false,
		lib: { entry, formats: ['cjs'], fileName: 'fixture' },
	},
})

const bundle = join(directory, 'fixture.cjs')
await validateHostBundle(bundle, appRoot)
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
		env: { ...process.env, OCTANE_MACOS_AUTOMATION: '1' },
		encoding: 'utf8',
		timeout: 10_000,
	},
)

const output = result.stdout + result.stderr
assert.equal(result.status, 0, output)
assert.doesNotMatch(output, /LAYOUT_CHANNELS_FAIL|uncaught render error/)
assert.doesNotMatch(
	output,
	/ignored unsupported style\.(flexDirection|gap|rowGap|columnGap|alignItems|justifyContent)/,
)

assert.match(output, /LAYOUT_CHANNELS_OK/)
console.log(
	'AppKit layout channels: precedence, removals, intrinsic text, assigned frames, percentage sizing and real-window resize pass',
)
