import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
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

test(
	'--no-build skips both package preparation and packing lifecycle hooks',
	{ skip: process.platform === 'win32' },
	() => {
		const directory = mkdtempSync(join(tmpdir(), 'consumer-prepared-test-'))
		try {
			const bin = join(directory, 'bin')
			const log = join(directory, 'commands.jsonl')
			mkdirSync(bin)
			writeFileSync(
				join(bin, 'bun'),
				`#!/usr/bin/env node
import { appendFileSync } from 'node:fs'
appendFileSync(process.env.CONSUMER_COMMAND_LOG, JSON.stringify(process.argv.slice(2)) + '\\n')
process.exit(1)
`,
				{ mode: 0o755 },
			)

			const result = spawnSync(process.execPath, ['scripts/verify-consumer.ts', '--no-build'], {
				encoding: 'utf8',
				env: {
					...process.env,
					PATH: bin + delimiter + process.env.PATH,
					VERIFY_CONSUMER_DIR: join(directory, 'consumer'),
					CONSUMER_COMMAND_LOG: log,
				},
			})

			// Stop at the first pack request: the shim must never execute a real
			// build or pack, and its arguments establish the lifecycle contract.
			assert.notEqual(result.status, 0)
			assert.match(result.stderr, /bun pm pack failed/)
			const commands = readFileSync(log, 'utf8')
				.trim()
				.split('\n')
				.map((line) => JSON.parse(line))

			assert.equal(commands.length, 1)
			assert.deepEqual(commands[0].slice(0, 3), ['pm', 'pack', '--ignore-scripts'])
		} finally {
			rmSync(directory, { recursive: true, force: true })
		}
	},
)
