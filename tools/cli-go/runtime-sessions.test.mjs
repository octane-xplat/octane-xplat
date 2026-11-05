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
import { rm } from 'node:fs/promises'
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

const scratch = realpathSync(scratchRun(root, 'go-runtime-sessions'))
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
			FORCE_COLOR: '1',
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
	const module =
		mode === 'failure'
			? "throw new Error('EXPECTED_SESSION_FAILURE')"
			: `import fs from 'node:fs'; import {spawn} from 'node:child_process';
export default {server:{port:0,host:'127.0.0.1'},plugins:[{name:'native-session-proof',async configureServer(server){
 ${mode === 'gate' ? "while(!fs.existsSync('release'))await new Promise(r=>setTimeout(r,30));" : ''}
 ${mode === 'resistant' ? `process.on('SIGTERM',()=>{});const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});console.log('armed');setInterval(()=>{},1000)"],{stdio:['ignore','pipe','ignore']});await new Promise(resolve=>child.stdout.once('data',resolve));fs.writeFileSync('armed.json',JSON.stringify([process.pid,child.pid]));child.stdout.resume();` : ''}
 server.httpServer.once('listening',()=>console.log('SESSION_APP_READY'));
 }}]}`
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
	const timer = setTimeout(() => child.kill(), 45000)
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

// A DevTools listener alone does not prove a sandboxed renderer loaded the app.
async function browserText(devtoolsUrl, address, observed) {
	const targets = await (await fetch(devtoolsUrl + '/json/list')).json()
	observed.targets = targets.slice(0, 16).map(({ type, url, title }) => ({ type, url, title }))
	const page = targets.find((target) => target.type === 'page' && target.url === address)
	if (!page) return ''
	const endpoint = new URL(page.webSocketDebuggerUrl)
	assert.equal(endpoint.protocol, 'ws:')
	assert.equal(endpoint.hostname, '127.0.0.1')
	assert.equal(endpoint.port, new URL(devtoolsUrl).port)
	assert.match(endpoint.pathname, /^\/devtools\/page\/[a-zA-Z0-9-]+$/)
	const socket = new WebSocket(endpoint)
	try {
		return await new Promise((resolve, reject) => {
			const timer = setTimeout(() => reject(new Error('owned renderer did not answer')), 5000)
			const finish = (error, value) => {
				clearTimeout(timer)
				if (error) reject(error)
				else resolve(value)
			}
			socket.addEventListener('error', () => finish(new Error('owned renderer connection failed')))
			socket.addEventListener('open', () => socket.send(JSON.stringify({
				id: 1, method: 'Runtime.evaluate', params: { expression: 'document.body?.innerText ?? ""', returnByValue: true },
			})))
			socket.addEventListener('message', (event) => {
				try {
					assert.ok(event.data.length <= 65536)
					const reply = JSON.parse(event.data)
					if (reply.id !== 1) return
					assert.equal(reply.error, undefined)
					assert.equal(reply.result.exceptionDetails, undefined)
					observed.text = String(reply.result.result.value).slice(0, 2048)
					finish(null, reply.result.result.value)
				} catch (error) { finish(error) }
			})
		})
	} finally { socket.close() }
}

async function session(f, id) {
	const reply = await cli(f, ['session', 'status', id])
	assert.equal(reply.code, 0, JSON.stringify(reply))
	return reply.data.session
}

async function ready(f, id) {
	return until(async () => {
		const value = await session(f, id)
		assert.notEqual(value.state, 'failed', JSON.stringify(value))
		return value.state === 'ready' && value
	}, 'session did not reach readiness')
}

async function end(f, id) {
	const reply = await cli(f, ['session', 'end', id])
	assert.equal(reply.code, 0, JSON.stringify(reply))
	assert.equal(reply.data.result.ended, true)
	const value = await session(f, id)
	assert.equal(value.cleanupConfirmed, true)
	return value
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
		join(work, `runtime-sessions-${target}.json`),
		JSON.stringify({ target, binarySha256: build.sha256, evidence }, null, 2),
	)
	if (safe) {
		rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
	}
	assert.ok(safe, 'Owned runtime fixture could not be retired; scratch retained')
})

test('session reads and targets need no Node and do not start an absent owner', async () => {
	const f = fixture()
	const list = await cli(f, ['session', 'list'], { PATH: '' })
	assert.equal(list.code, 0)
	assert.deepEqual(list.data.sessions, [])
	const targets = await cli(f, ['targets'], { PATH: '' })
	assert.equal(targets.code, 0)
	assert.equal(targets.data.platforms[0].targets[0].busy, false)
	const status = await cli(f, ['session', 'status', 'sess_missing'], { PATH: '' })
	assert.equal(status.error.code, 'not_found')
	assert.equal(existsSync(f.cache), false)
})

test(
	'owned web session survives client exit, answers HTTP and ends with cleanup proof',
	{ timeout: 90000 },
	async () => {
		const f = fixture()
		const accepted = await cli(f, ['session', 'start', 'web'])
		assert.equal(accepted.code, 0, JSON.stringify(accepted))
		const id = accepted.data.session.sessionId
		const current = await ready(f, id)
		if (process.env.XPLAT_MCP_CHROMIUM) {
			assert.equal(current.launch.browser?.executable, process.env.XPLAT_MCP_CHROMIUM, 'requested browser override was not selected')
		}
		assert.equal(current.ownership, 'owned')
		assert.equal(current.launch.readiness, 'http-confirmed')
		const address = current.launch.message.split(' ')[0]
		assert.match(await (await fetch(address)).text(), /Native owned build/)
		if (current.launch.browser) {
			const info = await (await fetch(current.launch.browser.devtoolsUrl + '/json/version')).json()
			assert.ok(info.Browser)
			const navigation = { expected: address }
			try {
				await until(async () => (await browserText(current.launch.browser.devtoolsUrl, address, navigation)).includes('Native owned build'), 'owned browser did not render the selected app', 15000)
			} finally { evidence.push({ browserNavigation: navigation }) }
			evidence.push({
				browser: 'actual owned Chromium DevTools and rendered app text verified',
				executable: current.launch.browser.executable,
				version: info.Browser,
				userAgent: info['User-Agent'],
				protocolVersion: info['Protocol-Version'],
			})
		}
		const targets = await cli(f, ['targets'])
		assert.equal(targets.data.platforms[0].targets[0].busy, true)
		assert.equal(targets.data.platforms[0].targets[0].session.sessionId, id)
		const busy = await cli(f, ['session', 'start', 'web'])
		assert.equal(busy.error.code, 'target_busy')
		const listed = await cli(f, ['session', 'list'])
		assert.ok(listed.data.sessions.some((s) => s.sessionId === id && s.historical === false))
		assert.equal((await end(f, id)).state, 'stopped')
		assert.equal((await end(f, id)).state, 'stopped')
		assert.equal((await cli(f, ['targets'])).data.platforms[0].targets[0].busy, false)
		await assert.rejects(fetch(address, { signal: AbortSignal.timeout(2000) }))
		const restarted = await cli(f, ['session', 'start', 'web'])
		assert.equal(restarted.code, 0, JSON.stringify(restarted))
		assert.notEqual(restarted.data.session.sessionId, id)
		await ready(f, restarted.data.session.sessionId)
		await end(f, restarted.data.session.sessionId)
	},
)

test(
	'pending session starts dedupe atomically and cancellation preserves its target claim',
	{ timeout: 90000 },
	async () => {
		const f = fixture('gate')
		const replies = await Promise.all(
			Array.from({ length: 4 }, () => cli(f, ['session', 'start', 'web', '--request-key', 'same'])),
		)
		assert.ok(
			replies.every((r) => r.code === 0),
			JSON.stringify(replies),
		)
		assert.equal(new Set(replies.map((r) => r.data.session.sessionId)).size, 1)
		assert.equal(replies.filter((r) => !r.data.deduplicated).length, 1)
		const id = replies[0].data.session.sessionId
		const busy = await cli(f, ['session', 'start', 'web', '--request-key', 'different'])
		assert.equal(busy.error.code, 'target_busy')
		assert.equal((await end(f, id)).state, 'stopped')
	},
)

test(
	'session end reaps a resistant engine and descendant and keeps failed history readable',
	{ timeout: 90000 },
	async () => {
		const f = fixture('resistant')
		const accepted = await cli(f, ['session', 'start', 'web'])
		assert.equal(accepted.code, 0)
		const id = accepted.data.session.sessionId
		await until(() => existsSync(join(f.app, 'armed.json')), 'session descendant never armed')
		const pids = JSON.parse(readFileSync(join(f.app, 'armed.json')))
		await ready(f, id)
		await end(f, id)
		assert.ok(
			pids.every((pid) => {
				try {
					process.kill(pid, 0)
					return false
				} catch (e) {
					return e.code === 'ESRCH'
				}
			}),
			'owned session descendant survived end',
		)
		const broken = fixture('failure')
		const start = await cli(broken, ['session', 'start', 'web'])
		assert.equal(start.code, 0)
		const failed = await until(async () => {
			const value = await session(broken, start.data.session.sessionId)
			return value.state === 'failed' && value
		}, 'failed launch never became terminal')
		assert.equal(failed.cleanupConfirmed, true)
		assert.equal(failed.launch.error.code, 'execution_failure')
		await end(broken, failed.sessionId)
	},
)

async function retire(f) {
	for (const { path, value } of descriptors(f)) {
		const reply = await fetch(value.address, {
			method: 'POST',
			headers: { Authorization: 'Bearer ' + value.token, 'X-Octane-Owner': value.generation },
			body: JSON.stringify({ method: 'host.shutdown' }),
			signal: AbortSignal.timeout(5000),
		})

		assert.equal(reply.status, 200)
		await until(() => !existsSync(join(path, 'owner.json')), 'owner did not retire')
		await until(
			() =>
				readdirSync(path)
					.filter((n) => n.startsWith('launch-'))
					.every((n) => JSON.parse(readFileSync(join(path, n, 'launch.json'))).cleanupConfirmed),
			'retirement cleanup unconfirmed',
		)
	}
}

test(
	'retained session reads survive owner retirement without restarting it',
	{ timeout: 90000 },
	async () => {
		const f = fixture()
		const start = await cli(f, ['session', 'start', 'web'])
		assert.equal(start.code, 0)
		const id = start.data.session.sessionId
		await ready(f, id)
		await end(f, id)
		await retire(f)
		const status = await cli(f, ['session', 'status', id], { PATH: '' })
		assert.equal(status.code, 0)
		assert.equal(status.data.session.historical, true)
		assert.equal(status.data.session.state, 'stopped')
		const list = await cli(f, ['session', 'list'], { PATH: '' })
		assert.equal(list.data.host.state, 'absent')
		assert.ok(list.data.sessions.some((s) => s.sessionId === id))
		const ended = await cli(f, ['session', 'end', id], { PATH: '' })
		assert.equal(ended.data.result.ended, true)
		assert.equal(ended.data.result.historical, true)
		assert.equal(descriptors(f).length, 0)
	},
)

test(
	'actual macOS owned session observes initialized app code and releases its host',
	{ skip: process.platform !== 'darwin', timeout: 180000 },
	async () => {
		const f = fixture(),
			packs = join(scratch, 'session-macos-packs')
		mkdirSync(packs)
		const packed = spawnSync('bun', ['pm', 'pack', '--ignore-scripts', '--destination', packs], {
			cwd: join(root, 'packages/macos-build'),
			encoding: 'utf8',
			timeout: 30000,
		})
		assert.equal(packed.status, 0, packed.stderr)
		const archive = join(
				packs,
				readdirSync(packs).find((n) => n.endsWith('.tgz')),
			),
			catalog = JSON.parse(readFileSync(join(root, 'package.json'))).workspaces.catalog
		const pkg = JSON.parse(readFileSync(join(f.app, 'package.json')))
		pkg.dependencies = {
			'@octane-xplat/macos-build': 'file:' + archive,
			vite: tools.packages.vite,
			octane: catalog.octane,
			'@nativescript/macos-node-api': catalog['@nativescript/macos-node-api'],
		}
		pkg.xplat = {
			targets: {
				macos: {
					runtime: 'appkit-node-api',
					renderer: 'appkit',
					dev: { viteConfig: 'vite.config.mjs', bundleFile: 'dist/main.cjs' },
					package: {
						productName: 'Go session fixture',
						bundleIdentifier: 'org.octane.xplat.go-session-fixture',
						executableName: 'GoSessionFixture',
						minimumSystemVersion: '13.5',
					},
				},
			},
		}
		put(f.app, 'package.json', pkg)
		const installed = spawnSync('bun', ['install', '--ignore-scripts', '--linker', 'isolated'], {
			cwd: f.app,
			encoding: 'utf8',
			timeout: 120000,
		})
		assert.equal(installed.status, 0, installed.stderr)
		put(
			f.app,
			'vite.config.mjs',
			`export default {build:{outDir:'dist',lib:{entry:'main.js',formats:['cjs'],fileName:()=> 'main.cjs'},rollupOptions:{external:['@nativescript/macos-node-api',/^node:/]}}}`,
		)
		put(
			f.app,
			'main.js',
			`import '@nativescript/macos-node-api';const app=NSApplication.sharedApplication;app.setActivationPolicy(2);console.log('GO_SESSION_APP_INITIALIZED');setInterval(()=>{},1000)`,
		)
		const start = await cli(f, ['session', 'start', 'macos'])
		assert.equal(start.code, 0, JSON.stringify(start))
		const id = start.data.session.sessionId
		const current = await ready(f, id)
		assert.equal(current.launch.readiness, 'host-spawned')
		const history = join(f.cache, 'cli-go/history-go-v1')
		let records = []
		await until(() => {
			for (const key of readdirSync(history)) {
				const file = join(history, key, id, 'current.jsonl')
				if (existsSync(file)) {
					records = readFileSync(file, 'utf8')
						.split('\n')
						.filter(Boolean)
						.flatMap((line) => {
							try {
								return [JSON.parse(line)]
							} catch {
								return []
							}
						})

					if (records.some((r) => r.line.includes('GO_SESSION_APP_INITIALIZED'))) {
						return true
					}
				}
			}
			return false
		}, 'actual AppKit app code never initialized')
		const native = await session(f, id)
		assert.ok(native.nativeIdentity?.processes?.length)
		await end(f, id)
		for (const process of native.nativeIdentity.processes) {
			assert.equal(existsSync(process.executable), false)
			assert.throws(() => globalThis.process.kill(process.pid, 0), { code: 'ESRCH' })
		}
		evidence.push({ macos: 'actual initialized AppKit app code and owned host cleanup verified' })
	},
)

test('manifest edits cannot hide or trap a known owned session', { timeout: 90000 }, async () => {
	const f = fixture()
	const accepted = await cli(f, ['session', 'start', 'web'])
	assert.equal(accepted.code, 0)
	const id = accepted.data.session.sessionId
	await ready(f, id)
	put(f.app, 'package.json', { name: 'metadata-removed', private: true })
	const list = await cli(f, ['session', 'list'])
	assert.equal(list.code, 0)
	assert.ok(list.data.sessions.some((s) => s.sessionId === id))
	await end(f, id)
})

test(
	'workspace removal cannot trap a known owned session',
	{ timeout: 90000 },
	async () => {
		const f = fixture()
		const accepted = await cli(f, ['session', 'start', 'web'])
		assert.equal(accepted.code, 0)
		const id = accepted.data.session.sessionId
		await ready(f, id)
		let removedBeforeEnd = true
		try {
			await rm(f.project, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
		} catch (error) {
			// Windows keeps a live process's working directory busy. Its files
			// can already be gone; cleanup must still use the registered binding.
			assert.equal(process.platform, 'win32')
			assert.equal(error.code, 'EBUSY')
			assert.ok(existsSync(f.project))
			removedBeforeEnd = false
		}
		const ended = await cli(f, ['session', 'end', id])
		assert.equal(ended.code, 0, JSON.stringify(ended))
		assert.equal(ended.data.result.ended, true)
		await rm(f.project, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
		assert.equal(existsSync(f.project), false)
		const status = await cli(f, ['session', 'status', id])
		assert.equal(status.code, 0, JSON.stringify(status))
		assert.equal(status.data.session.cleanupConfirmed, true)
		evidence.push({ workspaceRemoval: { removedBeforeEnd, retainedReadAfterDeletion: true } })
	},
)

test(
	'unrelated corrupt retained history cannot prevent ending a known live session',
	{ timeout: 90000 },
	async () => {
		const f = fixture()
		const accepted = await cli(f, ['session', 'start', 'web'])
		assert.equal(accepted.code, 0)
		const id = accepted.data.session.sessionId
		const current = await ready(f, id)
		const history = join(f.cache, 'cli-go/history-go-v1')
		const key = readdirSync(history).find((n) => existsSync(join(history, n, id)))
		put(join(history, key, 'sess_00000000-0000-4000-a000-000000000000'), 'session.json', '{}')
		const ended = await end(f, id)
		assert.equal(ended.cleanupConfirmed, true)
		await assert.rejects(
			fetch(current.launch.message.split(' ')[0], { signal: AbortSignal.timeout(2000) }),
		)
	},
)
