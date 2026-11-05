import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import {
	readFileSync,
	writeFileSync,
	mkdirSync,
	existsSync,
	realpathSync,
	readdirSync,
	symlinkSync,
	rmSync,
} from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { stripVTControlCharacters } from 'node:util'
import { setTimeout as delay } from 'node:timers/promises'
import { createHash } from 'node:crypto'
import { projectToolFixture } from './project-fixtures.mjs'
import { scratchRun } from '../cli-nim/scratch.mjs'

const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')
const target = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `xplat-go-${target}-cli${process.platform === 'win32' ? '.exe' : ''}`)
const sha = (value) => createHash('sha256').update(value).digest('hex')
const build = JSON.parse(readFileSync(binary + '.json'))
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs))
	assert.equal(sha(readFileSync(join(root, file))), hash, file)
const scratch = realpathSync(scratchRun(root, 'go-dev-server'))
const tools = projectToolFixture(root, work, scratch)
const evidence = [],
	fixtures = []
let sequence = 0
function put(base, name, value) {
	const path = join(base, name)
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value))
	return path
}
function fixture(multi = false) {
	const base = join(scratch, `case ${sequence++} π`),
		project = join(base, 'project'),
		cache = join(base, 'cache'),
		home = join(base, 'home')
	mkdirSync(home, { recursive: true })
	const f = {
		base,
		project,
		cache,
		children: [],
		env: {
			...process.env,
			HOME: home,
			LOCALAPPDATA: join(home, 'cache'),
			XDG_CACHE_HOME: join(home, 'cache'),
			XPLAT_DEV_CACHE: cache,
			NODE_OPTIONS: '',
			NODE_PATH: '',
			XPLAT_AGENT_CLIENT: '',
			FORCE_COLOR: '1',
		},
	}
	if (multi)
		put(project, 'package.json', {
			name: 'workspace',
			private: true,
			packageManager: 'bun@1.4.4',
			workspaces: ['apps/*'],
		})
	const apps = multi ? ['apps/one', 'apps/two'] : ['']
	for (const name of apps) {
		const app = join(project, name)
		put(app, 'package.json', {
			name: 'same-app-name',
			private: true,
			type: 'module',
			packageManager: 'bun@1.4.4',
			xplat: { targets: { web: {} } },
		})
		put(app, 'index.html', '<h1>Explicit foreground dev server</h1>')
		put(app, 'src/app/index.tsrx', 'export default ()=>null\n')
		put(
			app,
			'vite.config.mjs',
			`import fs from 'node:fs';export default{server:{host:'127.0.0.1',port:0},plugins:[{name:'dev-server-proof',configureServer(){fs.appendFileSync('engine-starts.log','start\\n')}}]}`,
		)
		symlinkSync(
			tools.nodeModules,
			join(app, 'node_modules'),
			process.platform === 'win32' ? 'junction' : 'dir',
		)
	}
	f.app = join(project, apps[0])
	fixtures.push(f)
	return f
}
async function until(read, message, timeout = 30000) {
	const deadline = Date.now() + timeout
	for (;;) {
		const value = await read()
		if (value) return value
		assert.ok(Date.now() < deadline, typeof message === 'function' ? message() : message)
		await delay(50)
	}
}
function cli(f, args, cwd = f.app) {
	const result = spawnSync(binary, [...args, '--json'], {
		cwd,
		env: f.env,
		encoding: 'utf8',
		timeout: 15000,
	})
	assert.equal(result.stderr, '', result.stderr)
	const value = JSON.parse(result.stdout)
	evidence.push({ args, status: result.status, value })
	return { status: result.status, ...value }
}
function record(f) {
	const namespace = join(f.cache, 'dev-servers-v1')
	if (!existsSync(namespace)) return null
	for (const name of readdirSync(namespace)) {
		const file = join(namespace, name, 'server.json')
		if (existsSync(file)) return JSON.parse(readFileSync(file))
	}
	return null
}
function start(f, args = []) {
	const child = spawn(binary, ['dev', '--targets', 'web', ...args], {
		cwd: f.app,
		env: f.env,
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	const owned = { child, stdout: '', stderr: '', ended: false, completion: null }
	child.stdout.setEncoding('utf8')
	child.stderr.setEncoding('utf8')
	child.stdout.on('data', (data) => {
		owned.stdout += data
		assert.ok(owned.stdout.length < 2 << 20)
	})
	child.stderr.on('data', (data) => {
		owned.stderr += data
		assert.ok(owned.stderr.length < 2 << 20)
	})
	owned.completion = new Promise((resolve, reject) => {
		child.once('error', reject)
		child.once('close', (code, signal) => {
			owned.ended = true
			resolve({ code, signal })
		})
	})
	f.children.push(owned)
	return owned
}
async function stop(owned) {
	if (!owned.ended) owned.child.kill(process.platform === 'win32' ? 'SIGTERM' : 'SIGINT')
	return await Promise.race([
		owned.completion,
		delay(15000, undefined, { ref: false }).then(() => {
			throw new Error('owned foreground dev did not stop')
		}),
	])
}
after(async () => {
	let clean = true
	for (const f of fixtures)
		for (const child of f.children) {
			try {
				await stop(child)
			} catch {
				clean = false
			}
		}
	for (const f of fixtures)
		for (const child of f.children)
			evidence.push({
				foregroundOutput: stripVTControlCharacters(child.stdout),
				foregroundDiagnostics: stripVTControlCharacters(child.stderr),
			})
	writeFileSync(
		join(work, `dev-server-${target}.json`),
		JSON.stringify(
			{
				target,
				binarySha256: build.sha256,
				evidence,
				cleanupConfirmed: clean,
				windowsTermination:
					process.platform === 'win32' ? 'forced process/Job cleanup; not console Ctrl-C' : null,
			},
			null,
			2,
		),
	)
	if (clean) rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
	assert.ok(clean, 'owned dev fixture could not be joined; scratch retained')
})

test('live reads without a server never start workers or create runtime state', () => {
	const f = fixture()
	for (const args of [['targets'], ['session', 'list'], ['session', 'status', 'sess_absent']]) {
		const result = cli(f, args)
		assert.equal(result.error.code, 'disconnected_runtime')
		assert.equal(result.status, 6)
	}
	assert.equal(existsSync(f.cache), false)
	assert.equal(existsSync(join(f.app, 'engine-starts.log')), false)
	for (const args of [
		['session', 'start', 'web'],
		['session', 'end', 'sess_absent'],
		['runtime', 'build'],
		['job', 'cancel', 'job_absent'],
		['_owner'],
	]) {
		assert.equal(cli(f, args).error.code, 'invalid_selection')
	}
	assert.equal(existsSync(f.cache), false)
})

test(
	'an explicit foreground dev server survives short clients and canonical aliases',
	{ timeout: 90000 },
	async () => {
		const f = fixture(true)
		const ambiguous = spawnSync(binary, ['dev', '--project', f.project, '--targets', 'web'], {
			cwd: f.project,
			env: f.env,
			encoding: 'utf8',
			timeout: 10000,
		})
		assert.notEqual(ambiguous.status, 0)
		assert.match(ambiguous.stderr, /selected app|--app/)
		assert.equal(existsSync(f.cache), false)
		const owned = start(f, ['--project', f.project, '--app', 'apps/one'])
		const info = await until(
			() => record(f),
			() => 'explicit dev did not publish discovery: ' + owned.stdout + ' ' + owned.stderr,
		)
		const address = await until(
			() => stripVTControlCharacters(owned.stdout).match(/http:\/\/127\.0\.0\.1:[0-9]+\//)?.[0],
			() => 'actual Vite did not report its URL: ' + owned.stdout + ' ' + owned.stderr,
		)
		assert.match(await (await fetch(address)).text(), /Explicit foreground dev server/)
		const alias = join(f.base, 'app-alias')
		symlinkSync(realpathSync(f.app), alias, process.platform === 'win32' ? 'junction' : 'dir')
		mkdirSync(join(f.app, 'nested'), { recursive: true })
		for (const cwd of [f.app, alias, join(f.app, 'nested')]) {
			const result = cli(f, ['targets'], cwd)
			assert.equal(result.status, 0, JSON.stringify(result.error))
			assert.equal(result.data.targets.length, 1)
			assert.equal(result.data.targets[0].platform, 'web')
			assert.deepEqual(result.data.targets[0].apps, [])
			assert.equal(cli(f, ['session', 'list'], cwd).data.sessions.length, 0)
		}
		assert.equal(owned.ended, false)
		assert.match(await (await fetch(address)).text(), /Explicit foreground dev server/)
		assert.equal(
			readFileSync(join(f.app, 'engine-starts.log'), 'utf8').trim().split('\n').length,
			1,
		)
		const duplicate = spawnSync(binary, ['dev', '--targets', 'web'], {
			cwd: alias,
			env: f.env,
			encoding: 'utf8',
			timeout: 10000,
		})
		assert.notEqual(duplicate.status, 0)
		assert.equal(
			readFileSync(join(f.app, 'engine-starts.log'), 'utf8').trim().split('\n').length,
			1,
		)
		assert.ok(!owned.stdout.includes(info.token) && !owned.stderr.includes(info.token))
		evidence.push({
			workflow:
				'real Vite HTTP; short clients, nested cwd and symlink/junction aliases; duplicate explicit start rejected',
			instanceId: info.instanceId,
			appRoot: info.appRoot,
		})
		const outcome = await stop(owned)
		evidence.push({
			shutdown: outcome,
			scope:
				process.platform === 'win32' ? 'forced process/Job cleanup' : 'SIGINT foreground cleanup',
		})
		await until(
			async () => {
				try {
					await fetch(address, { signal: AbortSignal.timeout(500) })
					return false
				} catch {
					return true
				}
			},
			'owned Vite endpoint remained alive after stop',
			10000,
		)
		assert.equal(cli(f, ['targets']).error.code, 'disconnected_runtime')
	},
)
