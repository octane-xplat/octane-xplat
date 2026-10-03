import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

function fixture(t) {
	const dir = mkdtempSync(join(tmpdir(), 'xplat-maestro-'))
	t.after(() => rmSync(dir, { recursive: true, force: true }))
	const log = join(dir, 'commands.jsonl')
	for (const executable of ['maestro', 'adb', 'xcrun', 'pnpm']) {
		const file = join(dir, executable)
		writeFileSync(
			file,
			`#!${process.execPath}\nimport { appendFileSync } from 'node:fs';\nappendFileSync(process.env.MAESTRO_TEST_LOG, JSON.stringify([${JSON.stringify(executable)}, ...process.argv.slice(2)]) + '\\n');\nif (process.argv.includes('build')) process.exit(9);\nif (process.argv.includes('test')) process.exit(Number(process.env.MAESTRO_TEST_EXIT ?? 0));\n`,
		)

		chmodSync(file, 0o755)
	}

	const apk = join(dir, 'test.apk')
	writeFileSync(apk, '')
	const app = join(dir, 'test.app')
	mkdirSync(app)
	return {
		dir,
		apk,
		app,
		run(args, env = {}) {
			return spawnSync(process.execPath, ['scripts/maestro.mjs', ...args], {
				encoding: 'utf8',
				env: { ...process.env, PATH: dir, MAESTRO_TEST_LOG: log, ...env },
			})
		},
		commands() {
			return readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse)
		},
	}
}

for (const target of ['ios', 'android']) {
	test(`${target}: selects device for install and Maestro, preserves paths and produces JUnit options`, (t) => {
		const f = fixture(t)
		const artifact = target === 'ios' ? f.app : f.apk
		const output = join(f.dir, 'reports with spaces')
		const result = f.run(
			[
				'--target',
				target,
				'--device',
				'chosen-device',
				'--artifact',
				artifact,
				'--output',
				output,
				'--app-id',
				'org.example.test',
			],
			{ XPLAT_MAESTRO_LOCK_HELD: target },
		)

		assert.equal(result.status, 0, result.stderr)
		const commands = f.commands()
		const install = commands.find((args) => args.includes('install'))
		assert.deepEqual(
			install,
			target === 'ios'
				? ['xcrun', 'simctl', 'install', 'chosen-device', artifact]
				: ['adb', '-s', 'chosen-device', 'install', '-r', artifact],
		)

		const maestro = commands.find((args) => args.includes('test'))
		assert.deepEqual(maestro.slice(0, 6), [
			'maestro',
			'--device',
			'chosen-device',
			'--platform',
			target,
			'test',
		])

		assert.ok(maestro.includes('APP_ID=org.example.test'))
		assert.ok(maestro.includes('JUNIT'))
		assert.ok(maestro.includes(join(output, 'report.xml')))
		assert.equal(
			commands.some((args) => args.includes('boot') || args.includes('shutdown')),
			false,
		)
	})
}

test('test failures propagate their exit code', (t) => {
	const f = fixture(t)
	const result = f.run(
		[
			'--target',
			'android',
			'--device',
			'chosen-device',
			'--artifact',
			f.apk,
			'--output',
			join(f.dir, 'reports'),
		],
		{ XPLAT_MAESTRO_LOCK_HELD: 'android', MAESTRO_TEST_EXIT: '7' },
	)

	assert.equal(result.status, 7)
})

test('help and invalid arguments do not require native tools', (t) => {
	const f = fixture(t)
	assert.equal(f.run(['--help']).status, 0)
	for (const args of [
		[],
		['--target', 'web', '--device', 'x'],
		['--target', 'ios'],
		['--unexpected', 'x'],
	]) {
		assert.notEqual(f.run(args).status, 0)
	}
})

test('missing artifact fails before touching a device', (t) => {
	const f = fixture(t)
	const result = f.run([
		'--target',
		'android',
		'--device',
		'chosen-device',
		'--artifact',
		join(f.dir, 'missing.apk'),
	])

	assert.equal(result.status, 1)
	assert.match(result.stderr, /existing.*artifact/)
})

test('default iOS path builds a simulator bundle without HMR and stops on build failure', (t) => {
	const f = fixture(t)
	const result = f.run(['--target', 'ios', '--device', 'chosen-device'], {
		XPLAT_MAESTRO_LOCK_HELD: 'ios',
	})

	assert.equal(result.status, 9)
	assert.deepEqual(
		f.commands().find((args) => args[0] === 'pnpm'),
		['pnpm', 'exec', 'ns', 'build', 'ios', '--no-hmr', '--for-device', 'false'],
	)

	assert.equal(
		f.commands().some((args) => args.includes('install') || args.includes('test')),
		false,
	)
})
