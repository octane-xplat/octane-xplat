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
const directory = await mkdtemp(join(scratch, 'macos-fonts-'))
const bootstrap = join(directory, 'bootstrap.js')
await writeFile(bootstrap, await readFile(join(hostRoot, 'shim.js'), 'utf8'))
const config = createMacOSConfig({
	packaged: true,
	rules: [{ include: '**/*.{tsx,tsrx}', renderer: 'macos' }],
})({ mode: 'production' })

for (const custom of [false, true]) {
	const entry = join(directory, 'main.mjs')
	await writeFile(
		entry,
		[
			`import { runFontFixture } from ${JSON.stringify(join(appRoot, 'test/font-fixture.macos.tsx'))}`,
			...(custom
				? [`import { harnessFontOptions } from ${JSON.stringify(join(appRoot, 'src/fonts.mjs'))}`]
				: []),
			`NSApplication.sharedApplication`,
			`runFontFixture(${custom ? 'harnessFontOptions, true' : ''})`,
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
	assert.doesNotMatch(output, /FONT_FIXTURE_FAIL|uncaught render error/)
	assert.match(output, custom ? /CUSTOM_FONT_OK/ : /SYSTEM_FONT_OK/)
}

console.log(
	'AppKit fonts: system defaults, weights, updates, fallback, and explicit harness Geist pass',
)
