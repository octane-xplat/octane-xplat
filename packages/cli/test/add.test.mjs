import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { composeTargets } from 'create-octane-xplat/scaffold'

// Same rule as create's scaffold tests: dep values track the template, which
// releases bump in lockstep.
const TPL = JSON.parse(
	readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), '../../create/template/package.json'),
		'utf8',
	),
)

const cli = join(dirname(fileURLToPath(import.meta.url)), '../src/cli.mjs')

function scaffold(t, targets) {
	const dir = mkdtempSync(join(tmpdir(), 'xplat-add-'))
	t.after(() => rmSync(dir, { recursive: true, force: true }))
	composeTargets(targets, dir)
	return dir
}

const run = (argv, cwd) =>
	spawnSync(process.execPath, [cli, ...argv], { cwd, encoding: 'utf8' })

test('xplat add enables a skipped platform and is idempotent', (t) => {
	const dir = scaffold(t, ['web'])

	const first = run(['add', 'ios', '--no-install'], dir)
	assert.equal(first.status, 0, first.stderr)
	assert.match(first.stdout, /enabled ios/)
	assert.ok(existsSync(join(dir, 'nativescript.config.ts')))
	assert.ok(existsSync(join(dir, 'App_Resources/iOS/Info.plist')))
	assert.ok(!existsSync(join(dir, 'App_Resources/Android')))

	const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
	assert.equal(manifest.devDependencies['@nativescript/ios'], TPL.devDependencies['@nativescript/ios'])
	assert.equal(manifest.scripts['dev:ios'], 'ns run ios')
	assert.match(manifest.scripts.typecheck, /tsconfig\.native\.json/)

	const second = run(['add', 'ios', '--no-install'], dir)
	assert.equal(second.status, 0, second.stderr)
	assert.match(second.stdout, /already enabled/)
})

test('xplat add accepts several platforms in one call', (t) => {
	const dir = scaffold(t, ['web'])
	const result = run(['add', 'ios', 'android', '--no-install'], dir)
	assert.equal(result.status, 0, result.stderr)
	assert.ok(existsSync(join(dir, 'App_Resources/Android/app.gradle')))
	const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
	assert.equal(manifest.devDependencies['@nativescript/android'], TPL.devDependencies['@nativescript/android'])
})

test('xplat add rejects unknown targets and bare non-TTY calls', (t) => {
	const dir = scaffold(t, ['web'])
	assert.notEqual(run(['add', 'windows'], dir).status, 0)
	assert.notEqual(run(['add'], dir).status, 0)
})
