import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

// Child processes exercise Bamboo's real beforeExit warning as well as written assets.
for (const mode of [
	'baseline',
	'worker-client',
	'ssr-first',
	'ssr-last',
	'incomplete',
	'excluded',
	'unknown',
]) {
	test(`Bamboo build participation: ${mode}`, () => {
		const result = spawnSync(
			process.execPath,
			[fileURLToPath(new URL('./build-environments.fixture.mjs', import.meta.url)), mode],
			{
				encoding: 'utf8',
				timeout: 60000,
			},
		)
		const log = result.stdout + result.stderr
		if (mode === 'excluded' || mode === 'unknown') {
			assert.notEqual(result.status, 0, log)
			assert.match(
				log,
				mode === 'excluded'
					? /building environment "ssr" is missing from buildEnvironments/
					: /unknown buildEnvironments entry "missing"/,
			)

			return
		}
		assert.equal(result.status, 0, log)
		if (mode === 'baseline' || mode === 'incomplete') {
			assert.match(log, /incomplete run: ssr never completed/, log)
		} else {
			assert.doesNotMatch(log, /incomplete run|never completed/, log)
		}
		const data = JSON.parse(result.stdout.match(/^RESULT (.+)$/m)[1])
		assert.deepEqual(
			data,
			{
				client: true,
				server: mode.startsWith('ssr-'),
				unused: false,
				color: true,
				references: true,
			},
			log,
		)
	})
}
