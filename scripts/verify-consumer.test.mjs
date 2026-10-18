import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

test('quick consumer mode refuses native qualification before creating or resetting work', () => {
	const directory = mkdtempSync(join(tmpdir(), 'consumer-options-test-'))
	const work = join(directory, 'consumer')
	try {
		for (const flags of [
			['--native', 'ios'],
			['--smoke-ios'],
			['--test-ios'],
			['--test-android'],
		]) {
			const result = spawnSync(
				process.execPath,
				['scripts/verify-consumer.ts', '--quick', ...flags],
				{
					encoding: 'utf8',
					env: { ...process.env, VERIFY_CONSUMER_DIR: work },
				},
			)

			assert.notEqual(result.status, 0)
			assert.match(result.stderr, /--quick cannot qualify native builds or device tests/)
			assert.equal(existsSync(work), false)
		}
	} finally {
		rmSync(directory, { recursive: true, force: true })
	}
})
