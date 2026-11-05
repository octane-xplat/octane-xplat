// Real one-shot native clients and the public CLI's detached owner entry.
import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import {
	readFileSync,
	writeFileSync,
	mkdirSync,
	readdirSync,
	existsSync,
	copyFileSync,
	chmodSync,
	renameSync,
	rmSync,
	realpathSync,
} from 'node:fs'

import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createHash } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { scratchRun } from '../cli-nim/scratch.mjs'
const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')

const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const suffix = process.platform === 'win32' ? '.exe' : ''
const binary = join(work, `xplat-go-${host}-cli${suffix}`),
	fixture = join(work, `go-tests-${host}${suffix}`)

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
for (const executable of [binary, fixture]) {
	const record = JSON.parse(readFileSync(executable + '.json'))
	assert.equal(sha(readFileSync(executable)), record.sha256)
	for (const [file, digest] of Object.entries(record.inputs)) {
		assert.equal(sha(readFileSync(join(root, file))), digest, 'Stale owner source: ' + file)
	}
}

const scratch = realpathSync(scratchRun(root, 'go-owner-bootstrap')),
	fixtures = [],
	evidence = []

let serial = 0
function app() {
	const project = join(scratch, `app ${serial++} π`),
		cache = join(scratch, `cache-${serial}`)
	mkdirSync(project)
	writeFileSync(
		join(project, 'package.json'),
		JSON.stringify({ name: 'native-owner-fixture', private: true, type: 'module' }),
	)
	const f = { project, cache, invoked: binary, idle: 5000 }
	fixtures.push(f)
	return f
}

function launch(f, { mode = 'lookup', method = 'host.ping', pause = '', stdin } = {}) {
	const child = spawn(fixture, ['-test.run=^TestAgentOwnerBootstrapFixture$'], {
		cwd: f.cwd ?? f.project,
		stdio: [stdin === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
		env: {
			...process.env,
			NODE_OPTIONS: '',
			NODE_PATH: '',
			XPLAT_GO_OWNER_FIXTURE: '1',
			XPLAT_GO_OWNER_PROJECT: f.project,
			XPLAT_GO_OWNER_CACHE: f.cache,
			XPLAT_GO_OWNER_BINARY: f.invoked,
			XPLAT_GO_OWNER_MODE: mode,
			XPLAT_GO_OWNER_METHOD: method,
			XPLAT_GO_OWNER_PAUSE: pause,
			XPLAT_GO_OWNER_READ_STDIN: stdin === undefined ? '' : '1',
			XPLAT_AGENT_HOST_IDLE_MS: String(f.idle),
		},
	})
	let stdout = '',
		stderr = ''
	child.stdout.on('data', (b) => (stdout += b))
	child.stderr.on('data', (b) => (stderr += b))
	const exited = once(child, 'close').then(([code, signal]) => ({
		code,
		signal,
		stdout,
		stderr,
		lines: stdout
			.split('\n')
			.filter((l) => l.trim())
			.map((l) => JSON.parse(l)),
	}))
	if (stdin !== undefined) {
		child.stdin.on('error', (error) => {
			if (error.code !== 'EPIPE') {
				child.emit('error', error)
			}
		})

		child.stdin.end(stdin)
	}
	const timer = setTimeout(() => child.kill('SIGKILL'), 20000)
	return { child, output: () => stdout, exited: exited.finally(() => clearTimeout(timer)) }
}

async function run(f, options) {
	const result = await launch(f, options).exited
	evidence.push({ project: f.project, ...result })
	return result
}

const value = (result) => result.lines.at(-1)
async function until(check, context, timeout = 7000) {
	const end = Date.now() + timeout
	while (!check()) {
		assert.ok(Date.now() < end, typeof context === 'function' ? context() : context)
		await delay(25)
	}
}

async function ownerGone(f, directory) {
	await until(
		() => !existsSync(join(directory, 'owner.json')),
		'owner readiness remained after shutdown',
	)
	const stages = readdirSync(directory).filter((n) => n.startsWith('launch-'))
	await until(
		() =>
			stages.every((n) => {
				try {
					return JSON.parse(readFileSync(join(directory, n, 'launch.json'))).cleanupConfirmed
				} catch {
					return false
				}
			}),
		'owner stage did not confirm cleanup',
	)
}

async function shutdown(f) {
	const found = await run(f)
	assert.equal(found.code, 0, found.stdout + found.stderr)
	if (value(found).owner === null) {
		return
	}
	const stopped = await run(f, { method: 'host.shutdown' })
	assert.equal(stopped.code, 0, stopped.stdout + stopped.stderr)
	await ownerGone(f, value(found).directory)
}

after(async () => {
	let safe = true
	for (const f of fixtures) {
		try {
			await shutdown(f)
			const collected = await run(f, { mode: 'collect' })
			assert.equal(collected.code, 0, collected.stdout + collected.stderr)
		} catch (error) {
			safe = false
			evidence.push({ cleanupError: String(error), project: f.project })
		}
	}
	writeFileSync(
		join(work, `owner-bootstrap-${host}.json`),
		JSON.stringify({ host, evidence }, null, 2),
	)
	if (safe) {
		rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
	}
	assert.equal(safe, true, 'Retained owner fixture scratch after uncertain cleanup: ' + scratch)
})

test('native read-only owner lookup creates no cache or daemon', async () => {
	const f = app(),
		result = await run(f)
	assert.equal(result.code, 0, result.stdout + result.stderr)
	assert.deepEqual(value(result), { ok: true, owner: null })
	assert.equal(existsSync(f.cache), false)
})

test('an idle owner does not hold the workspace working directory open', async () => {
	const f = app()
	f.cwd = scratch
	const started = await run(f, { mode: 'start' })
	assert.equal(started.code, 0, started.stdout + started.stderr)
	rmSync(f.project, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
	assert.equal(existsSync(f.project), false)
	const observed = await run(f)
	assert.equal(observed.code, 0, observed.stdout + observed.stderr)
	assert.equal(value(observed).generation, value(started).generation)
	await shutdown(f)
})

test(
	'concurrent one-shot clients adopt one actual native owner and preserve foreground stdin',
	{ timeout: 60000 },
	async () => {
		const f = app()
		const results = await Promise.all(
			Array.from({ length: 6 }, () => run(f, { mode: 'start', stdin: 'caller-input-survives\n' })),
		)
		for (const result of results) {
			assert.equal(result.code, 0, result.stdout + result.stderr)
			assert.equal(value(result).stdin, 'caller-input-survives\n')
			assert.equal(value(result).adopted, true)
		}
		assert.equal(new Set(results.map((r) => value(r).generation)).size, 1)
		assert.equal(new Set(results.map((r) => value(r).ownerPid)).size, 1)
		const observed = await run(f)
		assert.equal(observed.code, 0, observed.stdout + observed.stderr)
		assert.equal(value(observed).generation, value(results[0]).generation)
		await shutdown(f)
	},
)

test(
	'native owner staged image survives replacement of the invoked executable',
	{ timeout: 60000 },
	async () => {
		const f = app(),
			source = join(scratch, 'mutable-native' + suffix)
		copyFileSync(binary, source)
		chmodSync(source, 0o700)
		f.invoked = source
		const started = await run(f, { mode: 'start' })
		assert.equal(started.code, 0, started.stdout + started.stderr)
		const before = value(started)
		renameSync(source, source + '.original')
		writeFileSync(source, 'a user replacement file')
		chmodSync(source, 0o700)
		const found = await run(f)
		assert.equal(found.code, 0, found.stdout + found.stderr)
		assert.equal(value(found).generation, before.generation)
		const rejected = await run(f, { mode: 'start' })
		assert.equal(value(rejected).ok, false)
		assert.match(value(rejected).error.message, /different native CLI build/)
		const runDirectory = join(before.directory, 'launch-' + before.data.launchId)
		const manifest = JSON.parse(readFileSync(join(runDirectory, 'launch.json')))
		assert.equal(sha(readFileSync(join(runDirectory, manifest.helper))), sha(readFileSync(binary)))
		await shutdown(f)
		assert.equal(readFileSync(source, 'utf8'), 'a user replacement file')
	},
)

test(
	'creator cancellation before handoff reaps startup; after handoff preserves the owner',
	{ timeout: 90000 },
	async () => {
		for (const pause of ['before', 'after']) {
			const f = app(),
				launched = launch(f, { mode: 'start', pause })

			await until(() => launched.output().includes('"phase"'), launched.output, 12000)
			const phase = JSON.parse(launched.output().trim().split('\n')[0])
			launched.child.kill('SIGTERM') // Retained one-shot client handle, never a cached PID.
			const ended = await launched.exited
			evidence.push({ phase: pause, ...ended })
			if (pause === 'before') {
				await ownerGone(f, phase.directory)
				const missing = await run(f)
				assert.equal(missing.code, 0, missing.stdout + missing.stderr)
				assert.equal(value(missing).owner, null)
				const recovered = await run(f, { mode: 'start' })
				assert.equal(recovered.code, 0, recovered.stdout + recovered.stderr)
				assert.notEqual(value(recovered).generation, phase.generation)
				assert.equal(readdirSync(phase.directory).filter((n) => n.startsWith('launch-')).length, 1)
			} else {
				const alive = await run(f)
				assert.equal(alive.code, 0, alive.stdout + alive.stderr)
				assert.equal(value(alive).generation, phase.generation)
				assert.equal(value(alive).data.adopted, true)
			}

			await shutdown(f)
		}
	},
)

test(
	'idle native owners retire and failed process creation leaves no executable stages',
	{ timeout: 60000 },
	async () => {
		const f = app()
		f.idle = 500
		const started = await run(f, { mode: 'start' })
		assert.equal(started.code, 0, started.stdout + started.stderr)
		await ownerGone(f, value(started).directory)
		const absent = await run(f)
		assert.equal(value(absent).owner, null)
		const broken = join(scratch, 'invalid-owner-image' + suffix)
		writeFileSync(broken, 'not an executable')
		chmodSync(broken, 0o700)
		f.invoked = broken
		const failed = await run(f, { mode: 'start' })
		assert.equal(value(failed).ok, false)
		assert.equal(
			readdirSync(value(started).directory).filter((n) => n.startsWith('launch-')).length,
			0,
		)
	},
)
