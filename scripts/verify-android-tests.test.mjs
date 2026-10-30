import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { verifyAndroidTests } from './verify-android-tests.ts'

function fixture(t, overrides = {}) {
	const appDir = mkdtempSync(join(tmpdir(), 'xplat-android-gate-'))
	t.after(() => rmSync(appDir, { recursive: true, force: true }))
	writeFileSync(
		join(appDir, 'nativescript.config.ts'),
		"export default { id: 'org.nativescript.octanexplat' }",
	)

	const calls = []
	const run = (cmd, args, cwd, env) => {
		calls.push({ cmd, args, cwd, env })
		if (cmd === 'bun') {
			return {
				status: overrides.testStatus ?? 0,
				stdout: overrides.summary ?? 'Test Files 3 passed (3)\nTests 10 passed (10)',
			}
		}

		assert.equal(cmd, 'adb')
		assert.deepEqual(args.slice(0, 2), ['-s', 'emulator-5566'])
		if (args.includes('getprop')) {
			return { status: 0, stdout: overrides.boot ?? '1' }
		}

		if (args.includes('packages')) {
			return { status: 0, stdout: overrides.installed ? `package:${args.at(-1)}` : '' }
		}

		if (args.includes('force-stop')) {
			return { status: overrides.stopStatus ?? 0, stdout: '' }
		}

		if (args.includes('pidof')) {
			return { status: 1, stdout: overrides.pid ?? '' }
		}

		assert.equal(args[2], 'uninstall')
		return { status: 0, stdout: 'Success' }
	}

	return { appDir, work: appDir, device: 'emulator-5566', run, calls }
}

test('explicit device and boot readiness gate all app writes and launches', (t) => {
	const f = fixture(t, { boot: '0' })
	assert.throws(
		() => verifyAndroidTests({ ...f, device: undefined }),
		/requires VERIFY_ANDROID_DEVICE/,
	)

	assert.equal(f.calls.length, 0)
	assert.throws(() => verifyAndroidTests(f), /has not finished booting/)
	assert.equal(f.calls.length, 1)
	assert.match(
		readFileSync(join(f.appDir, 'nativescript.config.ts'), 'utf8'),
		/org.nativescript.octanexplat/,
	)
})

test('repeated runs reset only the disposable identity and stop it', (t) => {
	const f = fixture(t, { installed: true })
	for (let i = 0; i < 2; i++) {
		assert.match(verifyAndroidTests(f), /gesture-observer-dispatch/)
	}

	const config = readFileSync(join(f.appDir, 'nativescript.config.ts'), 'utf8')
	const id = config.match(/id: '([^']+)'/)[1]
	assert.match(id, /^org\.octanexplat\.consumer\.t[a-f0-9]{12}$/)
	for (const c of f.calls.filter(
		(c) => c.args.includes('uninstall') || c.args.includes('force-stop'),
	)) {
		assert.equal(c.args.at(-1), id)
	}

	assert.equal(f.calls.filter((c) => c.cmd === 'bun').length, 2)
})

test('assertion failure still stops the owned app and returns non-success', (t) => {
	const f = fixture(t, { testStatus: 1 })
	assert.throws(() => verifyAndroidTests(f), /ns test android exited 1/)
	assert.ok(f.calls.some((c) => c.args.includes('force-stop')))
})

test('zero tests and failed teardown cannot qualify a host', (t) => {
	assert.throws(
		() => verifyAndroidTests(fixture(t, { summary: 'Tests 0 passed' })),
		/no passing device tests/,
	)

	assert.throws(() => verifyAndroidTests(fixture(t, { stopStatus: 1 })), /could not stop/)
	assert.throws(() => verifyAndroidTests(fixture(t, { pid: '123' })), /still running/)
})
