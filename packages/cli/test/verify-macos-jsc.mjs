import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { cp, mkdtemp, mkdir, symlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateHostBundle } from '../src/macos/jsc-host/runtime.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const cliPath = process.env.XPLAT_TEST_CLI ?? join(repoRoot, 'packages/cli/src/cli.mjs')
const scratchRoot = join(repoRoot, 'research')
await mkdir(scratchRoot, { recursive: true })
const appRoot = await mkdtemp(join(scratchRoot, 'macos-jsc-fixture-'))
await cp(join(repoRoot, 'packages/cli/test/fixtures/macos-jsc-app'), appRoot, { recursive: true })
const installed = join(repoRoot, 'apps/macos/node_modules')
await mkdir(join(appRoot, 'node_modules/@nativescript'), { recursive: true })
for (const name of ['vite', 'octane', '@nativescript/macos-node-api']) {
	await symlink(join(installed, name), join(appRoot, 'node_modules', name))
}

const unsupportedBundle = join(appRoot, 'unsupported.cjs')
await writeFile(unsupportedBundle, 'require("node:child_process")\n')
assert.throws(() => validateHostBundle(unsupportedBundle), /Unsupported macOS JavaScriptCore host imports: node:child_process/)
await writeFile(unsupportedBundle, 'require(name)\n')
assert.throws(() => validateHostBundle(unsupportedBundle), /Unsupported dynamic require/)

execFileSync(process.execPath, [cliPath, 'build', '--targets', 'macos'], {
	cwd: appRoot,
	env: { ...process.env, XPLAT_MACOS_SKIP_SIGNING: '1' },
	stdio: 'inherit',
	timeout: 120_000,
})

const executable = join(appRoot, 'artifacts/macos-arm64/JSCFixture.app/Contents/MacOS/JSCFixture')
const result = spawnSync(executable, [], { cwd: appRoot, encoding: 'utf8', timeout: 10_000 })
assert.equal(result.status, 0, result.stderr)
assert.match(result.stderr, /JSC_FIXTURE_OK/)
assert.doesNotMatch(result.stderr, /JSC_FIXTURE_FAIL|failed:/)
const dependencies = execFileSync('otool', ['-L', executable], { encoding: 'utf8' })
assert.doesNotMatch(dependencies, /node|@rpath/)
assert.match(dependencies, /JavaScriptCore\.framework/)

await writeFile(join(appRoot, 'src/main.js'), "import { execSync } from 'node:child_process'\nconsole.log(execSync)\n")
const rejected = spawnSync(process.execPath, [cliPath, 'build', '--targets', 'macos'], {
	cwd: appRoot,
	env: { ...process.env, XPLAT_MACOS_SKIP_SIGNING: '1' },
	encoding: 'utf8',
	timeout: 30_000,
})
assert.notEqual(rejected.status, 0)
assert.match(`${rejected.stdout}\n${rejected.stderr}`, /Unsupported macOS JavaScriptCore host imports: node:child_process/)
console.log(`JavaScriptCore public fixture passed: ${appRoot}`)
