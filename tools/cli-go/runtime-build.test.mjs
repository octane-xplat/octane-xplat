import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import {
	readFileSync,
	writeFileSync,
	mkdirSync,
	readdirSync,
	existsSync,
	realpathSync,
	symlinkSync,
	rmSync,
} from 'node:fs'

import { join, resolve, dirname, relative } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { scratchRun } from '../cli-nim/scratch.mjs'
import { projectToolFixture } from './project-fixtures.mjs'

const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')

const target = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `xplat-go-${target}-cli${process.platform === 'win32' ? '.exe' : ''}`)
const sha = (b) => createHash('sha256').update(b).digest('hex')
const build = JSON.parse(readFileSync(binary + '.json'))
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
	assert.equal(sha(readFileSync(join(root, file))), hash, file)
}

const scratch = realpathSync(scratchRun(root, 'go-runtime-build'))
const tools = projectToolFixture(root, work, scratch)
const fixtures = [],
	evidence = []

let serial = 0
function put(base, name, data) {
	const path = join(base, name)
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(path, typeof data === 'string' ? data : JSON.stringify(data))
	return path
}

function fixture(mode = 'normal', multi = false) {
	const base = join(scratch, `case ${serial++} π`),
		project = join(base, 'project'),
		cache = join(base, 'cache'),
		home = join(base, 'home')
	mkdirSync(home, { recursive: true })
	const osCache = join(home, 'cache')
	const f = {
		project,
		cache,
		release: [],
		env: {
			...process.env,
			HOME: home,
			LOCALAPPDATA: osCache,
			XDG_CACHE_HOME: osCache,
			XPLAT_MCP_CACHE: cache,
			XPLAT_AGENT_CLIENT: '',
			XPLAT_AGENT_APP: '',
			XPLAT_PERMISSIONS: '',
			XPLAT_AGENT_HOST_IDLE_MS: '20000',
			NODE_OPTIONS: '',
			NODE_PATH: '',
		},
	}
	fixtures.push(f)
	if (multi) {
		put(project, 'package.json', { private: true, workspaces: ['apps/*'] })
	}
	f.app = appFixture(f, multi ? 'apps/a' : '', mode)
	if (multi) {
		f.other = appFixture(f, 'apps/b', 'normal')
	}
	return f
}

function appFixture(f, relative, mode) {
	const app = join(f.project, relative)
	put(app, 'package.json', {
		name: relative || 'runtime-app',
		private: true,
		type: 'module',
		packageManager: 'bun@1.4.4',
		xplat: { targets: {} },
	})
	put(app, 'index.html', '<h1>Native owned build</h1>')
	const module = `import fs from 'node:fs'; import {spawn} from 'node:child_process';
export default {plugins:[{name:'runtime-build-proof',async buildStart(){
 fs.appendFileSync('starts.jsonl',JSON.stringify({marker:process.env.RUNTIME_BUILD_MARKER??null,nodeOptions:process.env.NODE_OPTIONS,nodePath:process.env.NODE_PATH})+'\\n');
 console.log('RUNTIME_BUILD_STDOUT'); console.error('RUNTIME_BUILD_STDERR');
 ${mode === 'failure' ? "throw new Error('EXPECTED_RUNTIME_FAILURE');" : ''}
 ${mode === 'gate' ? "while(!fs.existsSync('release'))await new Promise(r=>setTimeout(r,30));" : ''}
 ${mode === 'resistant' ? `process.on('SIGTERM',()=>{}); const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});console.log('armed');setInterval(()=>{},1000)"],{stdio:['ignore','pipe','ignore']});await new Promise(resolve=>child.stdout.once('data',resolve));fs.writeFileSync('armed.json',JSON.stringify([process.pid,child.pid]));child.stdout.resume();await new Promise(()=>{});` : ''}
 } }]}`
	put(app, 'vite.config.mjs', module)
	const destination = join(app, 'node_modules/vite')
	mkdirSync(dirname(destination), { recursive: true })
	symlinkSync(
		realpathSync(join(tools.nodeModules, 'vite')),
		destination,
		process.platform === 'win32' ? 'junction' : 'dir',
	)
	if (mode === 'gate') {
		f.release.push(join(app, 'release'))
	}
	return app
}

async function cli(f, args, overlay = {}, app = f.app) {
	const child = spawn(
		binary,
		[...args, '--project', f.project, '--app', relative(f.project, app) || '.', '--json'],
		{ cwd: scratch, env: { ...f.env, ...overlay }, stdio: ['ignore', 'pipe', 'pipe'] },
	)
	let stdout = '',
		stderr = ''
	child.stdout.setEncoding('utf8')
	child.stderr.setEncoding('utf8')
	child.stdout.on('data', (text) => {
		stdout += text
	})
	child.stderr.on('data', (text) => {
		stderr += text
	})
	const timer = setTimeout(() => child.kill(), 20000)
	const status = await new Promise((resolve, reject) => {
		child.once('error', reject)
		child.once('close', (code, signal) => resolve({ code, signal }))
	}).finally(() => clearTimeout(timer))
	assert.equal(stderr, '', stderr)
	assert.ok(stdout.length, 'native client returned no JSON')
	const value = JSON.parse(stdout)
	evidence.push({ command: args.slice(0, 2), ...status, value })
	return { ...status, ...value }
}

async function until(check, message, timeout = 30000) {
	const end = Date.now() + timeout
	for (;;) {
		const value = await check()
		if (value) {
			return value
		}

		assert.ok(Date.now() < end, message)
		await delay(50)
	}
}

async function terminal(f, id, app = f.app) {
	return until(async () => {
		const reply = await cli(f, ['job', 'status', id], {}, app)
		assert.equal(reply.code, 0, JSON.stringify(reply))
		return ['succeeded', 'failed', 'cancelled'].includes(reply.data.job.state) && reply.data.job
	}, 'native job never finished')
}

function ownerDirectories(f) {
	const base = join(f.cache, 'cli-go/owner-go-v1')
	if (!existsSync(base)) {
		return []
	}
	return readdirSync(base).map((name) => join(base, name))
}

function descriptors(f) {
	return ownerDirectories(f)
		.filter((path) => existsSync(join(path, 'owner.json')))
		.map((path) => ({ path, value: JSON.parse(readFileSync(join(path, 'owner.json'))) }))
}

after(async () => {
	let safe = true
	for (const f of fixtures) {
		for (const path of f.release) {
			put(dirname(path), 'release', 'complete')
		}

		try {
			for (const { path, value } of descriptors(f)) {
				const reply = await fetch(value.address, {
					method: 'POST',
					headers: { Authorization: 'Bearer ' + value.token, 'X-Octane-Owner': value.generation },
					body: JSON.stringify({ method: 'host.shutdown' }),
					signal: AbortSignal.timeout(5000),
				})

				assert.equal(reply.status, 200)
				await until(() => !existsSync(join(path, 'owner.json')), 'owner cleanup was not confirmed')
				await until(
					() =>
						readdirSync(path)
							.filter((n) => n.startsWith('launch-'))
							.every(
								(n) => JSON.parse(readFileSync(join(path, n, 'launch.json'))).cleanupConfirmed,
							),
					'staged owner cleanup was not checkpointed',
				)
			}

			for (const path of ownerDirectories(f)) {
				await until(
					() =>
						readdirSync(path)
							.filter((n) => n.startsWith('launch-'))
							.every(
								(n) => JSON.parse(readFileSync(join(path, n, 'launch.json'))).cleanupConfirmed,
							),
					'retired owner stage has no cleanup confirmation',
				)
			}
		} catch (error) {
			safe = false
			evidence.push({ cleanupError: String(error) })
		}
	}
	writeFileSync(
		join(work, `runtime-build-${target}.json`),
		JSON.stringify({ target, binarySha256: build.sha256, evidence }, null, 2),
	)
	if (safe) {
		rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
	}
	assert.ok(safe, 'Owned runtime fixture could not be retired; scratch retained')
})

test('job reads and cancellation need no Node and never bootstrap an absent owner', async () => {
	const f = fixture()
	for (const method of ['status', 'cancel']) {
		const reply = await cli(f, ['job', method, 'job_missing'], { PATH: '' })
		assert.equal(reply.code, 2)
		assert.equal(reply.error.code, 'not_found')
		assert.equal(existsSync(f.cache), false)
	}
	const missing = await cli(f, ['runtime', 'build'])
	assert.equal(missing.error.code, 'invalid_selection')
	const undeclared = await cli(f, ['runtime', 'build', '--platform', 'android'])
	assert.equal(undeclared.error.code, 'invalid_selection')
	assert.equal(existsSync(f.cache), false)
})

test(
	'real project Vite builds survive client exit and use each request environment',
	{ timeout: 60000 },
	async () => {
		const f = fixture()
		const capabilities = await cli(f, ['capabilities'])
		assert.equal(
			capabilities.data.capabilities
				.find((row) => row.platform === 'web')
				.capabilities.find((row) => row.capability === 'build').status,
			'supported',
		)
		for (const marker of ['first-client', 'second-client']) {
			const accepted = await cli(f, ['runtime', 'build', '--platform', 'web'], {
				RUNTIME_BUILD_MARKER: marker,
				NODE_OPTIONS: '--this-must-not-reach-node',
				NODE_PATH: '/invalid-preload',
			})

			assert.equal(accepted.code, 0, JSON.stringify(accepted))
			const job = await terminal(f, accepted.data.job.jobId)
			assert.equal(job.state, 'succeeded', JSON.stringify(job))
			assert.equal(job.result.appId, '.')
			assert.ok(job.result.diagnostics.tail.some((l) => l.includes('RUNTIME_BUILD_STDERR')))
			assert.ok(existsSync(join(f.app, 'dist/index.html')))
		}
		const starts = readFileSync(join(f.app, 'starts.jsonl'), 'utf8')
			.trim()
			.split('\n')
			.map(JSON.parse)
		assert.deepEqual(
			starts.map((s) => s.marker),
			['first-client', 'second-client'],
		)
		assert.ok(starts.every((s) => s.nodeOptions === '' && s.nodePath === ''))
		assert.equal(descriptors(f).length, 1)
	},
)

test(
	'concurrent request keys dedupe real builds while app bindings stay isolated',
	{ timeout: 90000 },
	async () => {
		const f = fixture('gate', true)
		const replies = await Promise.all(
			Array.from({ length: 4 }, () =>
				cli(f, ['runtime', 'build', '--platform', 'web', '--request-key', 'same']),
			),
		)
		assert.ok(
			replies.every((r) => r.code === 0),
			JSON.stringify(replies),
		)
		assert.equal(new Set(replies.map((r) => r.data.job.jobId)).size, 1)
		assert.equal(replies.filter((r) => !r.data.deduplicated).length, 1)
		const id = replies[0].data.job.jobId
		await until(() => existsSync(join(f.app, 'starts.jsonl')), 'first build did not start')
		const contended = await cli(f, [
			'runtime',
			'build',
			'--platform',
			'web',
			'--request-key',
			'different',
		])
		assert.equal(contended.code, 0)
		assert.equal((await terminal(f, contended.data.job.jobId)).error.code, 'target_busy')
		const foreign = await cli(f, ['job', 'status', id], {}, f.other)
		assert.equal(foreign.error.code, 'not_found')
		const foreignCancel = await cli(f, ['job', 'cancel', id], {}, f.other)
		assert.equal(foreignCancel.error.code, 'not_found')
		const other = await cli(
			f,
			['runtime', 'build', '--platform', 'web', '--request-key', 'same'],
			{},
			f.other,
		)
		assert.notEqual(other.data.job.jobId, id)
		assert.equal((await terminal(f, other.data.job.jobId, f.other)).state, 'succeeded')
		put(f.app, 'release', 'continue')
		assert.equal((await terminal(f, id)).state, 'succeeded')
		assert.equal(readFileSync(join(f.app, 'starts.jsonl'), 'utf8').trim().split('\n').length, 1)
	},
)

test('build failures stay in the job and preserve stdout/stderr diagnostics', async () => {
	const f = fixture('failure')
	const accepted = await cli(f, ['runtime', 'build', '--platform', 'web'])
	assert.equal(accepted.code, 0)
	const job = await terminal(f, accepted.data.job.jobId)
	assert.equal(job.state, 'failed')
	assert.equal(job.error.code, 'execution_failure')
	assert.equal(job.error.retryable, false)
	assert.ok(
		job.error.context.tail.some((l) => l.includes('EXPECTED_RUNTIME_FAILURE')),
		JSON.stringify(job),
	)
	const cancelled = await cli(f, ['job', 'cancel', job.jobId])
	assert.equal(cancelled.data.job.state, 'failed')
})

test(
	'job cancellation reaps a resistant real build and its descendant',
	{ timeout: 60000 },
	async () => {
		const f = fixture('resistant')
		const accepted = await cli(f, ['runtime', 'build', '--platform', 'web'])
		assert.equal(accepted.code, 0)
		await until(() => existsSync(join(f.app, 'armed.json')), 'resistant build never armed')
		const pids = JSON.parse(readFileSync(join(f.app, 'armed.json')))
		const cancelled = await cli(f, ['job', 'cancel', accepted.data.job.jobId])
		assert.ok(['cancelling', 'cancelled'].includes(cancelled.data.job.state))
		const done = await terminal(f, accepted.data.job.jobId)
		assert.equal(done.state, 'cancelled')
		assert.ok(done.finishedAt)
		assert.ok(
			pids.every((pid) => {
				try {
					process.kill(pid, 0)
					return false
				} catch (error) {
					return error.code === 'ESRCH'
				}
			}),
			'owned child or descendant survived completed cancellation',
		)
	},
)

test(
	'real Vite artifacts, dirty revision and failure classification agree with the TypeScript adapter',
	{ timeout: 60000, skip: !existsSync(join(root, 'packages/cli/node_modules/yaml')) },
	async () => {
		// Source-host comparison only. Portable snapshots deliberately omit the old
		// CLI's dependencies; native execution there remains independently required.
		const { createWebAdapter } = await import('../../packages/cli/src/mcp/runtime/adapters/web.ts')
		const { createLogBuffer } = await import('../../packages/cli/src/mcp/runtime/logs.ts')
		const f = fixture()
		put(f.app, '.gitignore', 'node_modules/\ndist/\nstarts.jsonl\n')
		for (const args of [
			['init', '--quiet'],
			['add', '.'],
			[
				'-c',
				'user.name=Native CLI fixture',
				'-c',
				'user.email=fixture@example.invalid',
				'-c',
				'commit.gpgsign=false',
				'commit',
				'--quiet',
				'--no-verify',
				'-m',
				'fixture',
			],
		]) {
			const result = spawnSync(
				'git',
				['-c', `core.hooksPath=${join(f.app, '.git/no-hooks')}`, ...args],
				{ cwd: f.app, encoding: 'utf8' },
			)

			assert.equal(result.status, 0, result.stderr)
		}
		put(f.app, 'index.html', '<h1>Changed after commit</h1>')
		const accepted = await cli(f, ['runtime', 'build', '--platform', 'web'])
		assert.equal(accepted.code, 0)
		const job = await terminal(f, accepted.data.job.jobId)
		assert.equal(job.state, 'succeeded', JSON.stringify(job))
		const artifact = readFileSync(join(f.app, 'dist/index.html'), 'utf8')
		const logs = createLogBuffer()
		const reference = await createWebAdapter().build({
			app: { root: f.app },
			logs,
			signal: new AbortController().signal,
			report() {},
			deps: {},
		})
		assert.deepEqual(job.result.buildIdentity, reference.buildIdentity)
		assert.match(job.result.buildIdentity.revision, /-dirty$/)
		assert.equal(readFileSync(join(f.app, 'dist/index.html'), 'utf8'), artifact)
		assert.ok(logs.read().records.some((r) => r.line.includes('RUNTIME_BUILD_STDERR')))
		const failed = fixture('failure')
		const failedStart = await cli(failed, ['runtime', 'build', '--platform', 'web'])
		const nativeFailure = await terminal(failed, failedStart.data.job.jobId)
		await assert.rejects(
			createWebAdapter().build({
				app: { root: failed.app },
				logs: createLogBuffer(),
				signal: new AbortController().signal,
				report() {},
				deps: {},
			}),
			(error) => {
				assert.equal(error.code, nativeFailure.error.code)
				assert.equal(error.retryable, nativeFailure.error.retryable)
				assert.ok(error.context.tail.some((line) => line.includes('EXPECTED_RUNTIME_FAILURE')))
				return true
			},
		)
		evidence.push({
			reference: 'TypeScript web adapter',
			artifactEqual: true,
			dirtyRevisionEqual: true,
			failureContractEqual: true,
		})
	},
)
