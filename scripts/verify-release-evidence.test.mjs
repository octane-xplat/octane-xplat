import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { REQUIRED_JOBS, releaseChannel } from './release-channel.mjs'

test('release evidence requires the on-device iOS suite alongside every build gate', () => {
	const out = mkdtempSync(join(tmpdir(), 'release-evidence-test-'))
	try {
		const jobs = {
			checks: { result: 'success' },
			'native-ios': { result: 'success' },
			'native-android': { result: 'success' },
		}

		for (const result of ['absent', 'failure', 'skipped', 'success']) {
			if (result !== 'absent') {
				jobs['native-ios-tests'] = { result }
			}

			const run = spawnSync(
				process.execPath,
				[
					'scripts/verify-release-evidence.mjs',
					'record',
					'--jobs',
					JSON.stringify(jobs),
					'--sha',
					'tested-sha',
					'--run-id',
					'123',
					'--out',
					out,
				],
				{ encoding: 'utf8' },
			)

			assert.equal(run.status, 0, run.stderr)
			const evidence = JSON.parse(readFileSync(join(out, 'ci-evidence.json'), 'utf8'))
			assert.equal(evidence.status, result === 'success' ? 'success' : 'failure')
			assert.equal(evidence.jobs['native-ios-tests'], result)
			assert.ok(evidence.required.includes('native-ios-tests'))
		}
	} finally {
		rmSync(out, { recursive: true, force: true })
	}
})

test('release channel: stable needs every required job green, nightly needs only checks', () => {
	const green = Object.fromEntries(REQUIRED_JOBS.map((job) => [job, 'success']))
	assert.equal(releaseChannel(green), 'stable')
	assert.deepEqual(REQUIRED_JOBS, [
		'checks',
		'native-ios',
		'native-ios-tests',
		'native-android',
	])

	for (const lane of ['native-ios', 'native-ios-tests', 'native-android']) {
		for (const result of ['failure', 'cancelled', 'skipped', 'absent']) {
			const jobs = { ...green, [lane]: result === 'absent' ? undefined : result }
			assert.equal(releaseChannel(jobs), 'nightly', `${lane}=${result}`)
		}
	}

	for (const result of ['failure', 'cancelled', 'skipped', 'absent']) {
		const jobs = { ...green, checks: result === 'absent' ? undefined : result }
		assert.equal(releaseChannel(jobs), 'none', `checks=${result}`)
	}
	assert.equal(releaseChannel({}), 'none')
	assert.equal(releaseChannel(undefined), 'none')
})
