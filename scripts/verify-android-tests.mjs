import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Internal packed-consumer gate. The caller owns the host reservation and
// supplies the subprocess runner; this helper never chooses or boots a device.
export function verifyAndroidTests({ appDir, work, device, run }) {
	assert.ok(device, '--test-android requires VERIFY_ANDROID_DEVICE')
	const adb = (argv) => run('adb', ['-s', device, ...argv], appDir)
	const ready = adb(['shell', 'getprop', 'sys.boot_completed'])
	assert.equal(ready.status, 0, 'selected Android host is unavailable')
	assert.equal(ready.stdout.trim(), '1', 'selected Android host has not finished booting')

	// A disposable identity prevents an install from replacing a user's app.
	const id =
		'org.octanexplat.consumer.t' + createHash('sha256').update(work).digest('hex').slice(0, 12)

	const configPath = join(appDir, 'nativescript.config.ts')
	const config = readFileSync(configPath, 'utf8')
	assert.ok(
		config.includes("id: 'org.nativescript.octanexplat'") || config.includes(`id: '${id}'`),
		'unexpected scaffold app ID',
	)

	writeFileSync(configPath, config.replace("id: 'org.nativescript.octanexplat'", `id: '${id}'`))

	const existing = adb(['shell', 'pm', 'list', 'packages', id])
	assert.equal(existing.status, 0, 'could not inspect the owned consumer installation')
	if (existing.stdout.split('\n').some((line) => line.trim() === `package:${id}`)) {
		const remove = adb(['uninstall', id])
		assert.equal(remove.status, 0, 'could not reset the disposable consumer app')
	}

	let r
	try {
		r = run('pnpm', ['test:android'], appDir, { NS_DEVICE: device })
	} finally {
		const stop = adb(['shell', 'am', 'force-stop', id])
		assert.equal(stop.status, 0, 'could not stop the owned consumer app')
		const pid = adb(['shell', 'pidof', id])
		assert.equal(pid.stdout.trim(), '', 'owned consumer app is still running')
	}

	assert.equal(r.status, 0, `ns test android exited ${r.status}`)
	const summary = r.stdout
		.split('\n')
		.filter((line) => /Test Files|Tests\s+\d+/.test(line))
		.join(' ')
		.trim()

	assert.match(summary, /Tests\s+[1-9]\d*\s+passed/, 'no passing device tests reported')
	return `${device}, ${id}, gesture-observer-dispatch — ${summary}`
}
