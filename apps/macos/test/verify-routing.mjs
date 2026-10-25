import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { createMacOSConfig } from '../vite.shared.mjs'
import { macOSExecutable } from '../../../packages/cli/src/macos/executables.ts'
import {
	buildMacOSNative,
	writeNativeBootstrap,
} from '../../../packages/cli/src/macos/native.ts'
import {
	hostBundle,
	validateHostBundle,
} from '../../../packages/cli/src/macos/jsc-host/runtime.ts'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cliBuild = spawnSync('pnpm', ['--filter', '@octane-xplat/cli', 'build'], {
	shell: process.platform === 'win32',
	cwd: appRoot,
	encoding: 'utf8',
	timeout: 120000,
})

assert.equal(cliBuild.status, 0, cliBuild.stdout + cliBuild.stderr)
const { generateRoutes } = await import('../../../packages/cli/dist/commands/routes.js')
await generateRoutes(join(appRoot, 'test/default-client'), undefined, undefined, { bake: true })
const checked = spawnSync(
	'pnpm',
	['exec', 'tsrx-tsc', '--noEmit', '-p', 'test/tsconfig.routing.json'],
	{ cwd: appRoot, encoding: 'utf8', timeout: 60000, shell: process.platform === 'win32' },
)

assert.equal(checked.status, 0, checked.stdout + checked.stderr)
const scratch = resolve(appRoot, '../../research')
await mkdir(scratch, { recursive: true })
const directory = await mkdtemp(join(scratch, 'macos-routing-'))
const artifact = await buildMacOSNative(appRoot)
const bootstrap = join(directory, 'bootstrap.js')
await writeNativeBootstrap(artifact, bootstrap)
const config = await createMacOSConfig({
	packaged: true,
	rules: [{ include: '**/*.{tsx,tsrx}', renderer: 'macos' }],
})({ mode: 'production' })

const entry = join(directory, 'main.mjs')
await writeFile(
	entry,
	`import { runRoutingFixture } from ${JSON.stringify(join(appRoot, 'test/routing-fixture.macos.tsx'))}
NSApplication.sharedApplication
runRoutingFixture()`,
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
assert.doesNotMatch(await readFile(bundle, 'utf8'), /XPLAT_BAKED_ROUTE_BUILD_ONLY/)
const result = spawnSync(
	await macOSExecutable(appRoot, 'macos-arm64/host'),
	[
		join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
		bundle,
		artifact.metadata,
		bootstrap,
	],
	{
		cwd: directory,
		env: { ...process.env, OCTANE_MACOS_AUTOMATION: '1' },
		encoding: 'utf8',
		timeout: 30000,
	},
)

const output = result.stdout + result.stderr
assert.equal(result.status, 0, output)
assert.doesNotMatch(output, /ROUTING_FIXTURE_FAIL|uncaught render error/)
assert.match(output, /ROUTING_FIXTURE_OK/)
console.log(output)
