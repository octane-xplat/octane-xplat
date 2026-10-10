import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const directory = mkdtempSync(join(tmpdir(), 'xplat-geolocation-'))
try {
	const executable = join(directory, 'native-location')
	const compile = spawnSync(
		'xcrun',
		[
			'clang',
			'-fobjc-arc',
			'-fblocks',
			'-Wall',
			'-Werror',
			'-framework',
			'Foundation',
			'-framework',
			'CoreLocation',
			'-I',
			'platforms/macos/include',
			'tests/native-location.m',
			'-o',
			executable,
		],
		{ encoding: 'utf8' },
	)

	assert.equal(compile.status, 0, compile.stdout + compile.stderr)
	const run = spawnSync(executable, [], { encoding: 'utf8', timeout: 10000 })
	assert.equal(run.status, 0, run.stdout + run.stderr)
	assert.match(run.stdout, /NATIVE_GEOLOCATION_LIFECYCLE_OK/)
	console.log(run.stdout.trim())
} finally {
	rmSync(directory, { recursive: true, force: true })
}
