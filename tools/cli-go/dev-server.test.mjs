import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import {
	readFileSync,
	cpSync,
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
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { projectToolFixture } from './project-fixtures.mjs'
import { scratchRun } from './scratch.mjs'

const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')

const target = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `xplat-go-${target}-cli${process.platform === 'win32' ? '.exe' : ''}`)
const sha = (value) => createHash('sha256').update(value).digest('hex')
const build = JSON.parse(readFileSync(binary + '.json'))
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
	assert.equal(sha(readFileSync(join(root, file))), hash, file)
}

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
			XPLAT_PERMISSIONS: '',
			FORCE_COLOR: '1',
		},
	}
	if (multi) {
		put(project, 'package.json', {
			name: 'workspace',
			private: true,
			packageManager: 'bun@1.4.4',
			workspaces: ['apps/*'],
		})
	}
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
		if (value) {
			return value
		}

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
	if (!existsSync(namespace)) {
		return null
	}
	for (const name of readdirSync(namespace)) {
		const file = join(namespace, name, 'server.json')
		if (existsSync(file)) {
			return JSON.parse(readFileSync(file))
		}
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
	if (!owned.ended) {
		owned.child.kill(process.platform === 'win32' ? 'SIGTERM' : 'SIGINT')
	}
	return await Promise.race([
		owned.completion,
		delay(15000, undefined, { ref: false }).then(() => {
			throw new Error('owned foreground dev did not stop')
		}),
	])
}

after(async () => {
	let clean = true
	for (const f of fixtures) {
		for (const child of f.children) {
			try {
				await stop(child)
			} catch {
				clean = false
			}
		}
	}
	for (const f of fixtures) {
		for (const child of f.children) {
			evidence.push({
				foregroundOutput: stripVTControlCharacters(child.stdout),
				foregroundDiagnostics: stripVTControlCharacters(child.stderr),
			})
		}
	}
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
	if (clean) {
		rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
	}
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
		const captures = cli(f, ['diagnostics']).data.sessions
		assert.equal(captures.length, 1)
		const capture = captures[0]
		assert.equal(capture.historical, false)
		assert.equal(capture.ownerId, info.instanceId)
		const liveLogs = cli(f, ['diagnostics', '--session', capture.sessionId, '--limit', '1']).data
		assert.equal(liveLogs.logs.historical, false)
		assert.equal(liveLogs.logs.records.length, 1)
		assert.equal(liveLogs.coverage.nativeReports.status, 'unsupported')
		const unsupportedReport = cli(f, [
			'diagnostics',
			'--session',
			capture.sessionId,
			'--report',
			'native',
		])
		assert.equal(unsupportedReport.error.code, 'invalid_selection')
		assert.equal(unsupportedReport.status, 2)
		assert.equal(cli(f, ['diagnostics', '--job', 'removed']).error.code, 'invalid_selection')
		assert.equal(
			cli(f, ['diagnostics', '--session', capture.sessionId, '--platform', 'ios']).error.code,
			'invalid_selection',
		)
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
		const endedLogs = cli(f, ['diagnostics', '--session', capture.sessionId]).data
		assert.equal(endedLogs.logs.historical, true)
		// Forced Windows termination can leave the last metadata snapshot unfinished;
		// it must never infer cleanup from an absent server or recorded PID.
		if (process.platform !== 'win32') {
			assert.equal(endedLogs.session.cleanupConfirmed, true)
		}
		assert.ok(endedLogs.logs.records.length > 0)
		assert.equal(cli(f, ['diagnostics']).data.sessions[0].sessionId, capture.sessionId)
	},
)

test('project Vite device relay preserves actual Go app authentication', { timeout: 60000 }, async () => {
	const f = fixture()
	const require = createRequire(join(f.app, 'package.json'))
	const plugin = pathToFileURL(join(dirname(require.resolve('@octane-xplat/cli/vite')), 'mcp/dev-socket.js')).href
	put(f.app, 'vite.config.mjs', `import{writeFileSync}from'node:fs';import{nativeDevSocketPlugin}from ${JSON.stringify(plugin)};writeFileSync('app-grant.json',process.env.XPLAT_DEV_APP_BRIDGE,{mode:0o600});export default{server:{host:'127.0.0.1',port:0},plugins:[nativeDevSocketPlugin({deviceRelay:true})]}`)
	const owned = start(f)
	try {
		await until(() => existsSync(join(f.app, 'app-grant.json')), () => owned.stdout + owned.stderr)
		const grant = JSON.parse(readFileSync(join(f.app, 'app-grant.json')))
		const info = record(f)
		const origin = await until(() => stripVTControlCharacters(owned.stdout).match(/http:\/\/127\.0\.0\.1:[0-9]+\//)?.[0], () => owned.stdout + owned.stderr)
		const relay = new URL('/__xplat_dev__/app' + new URL(grant.socket).search, origin)
		relay.protocol = 'ws:'
		for (const allowed of [false, true]) {
			const client = new WebSocket(relay)
			try {
				const state = await new Promise((resolve, reject) => {
					const timer = setTimeout(() => reject(new Error('Relayed app authentication timed out')), 5000)
					const finish = (value) => { clearTimeout(timer); resolve(value) }
					client.onopen = () => client.send(JSON.stringify({ protocol: 'octane-app-debug', version: 1, instanceId: grant.instanceId, targetId: grant.targetId, token: allowed ? grant.token : info.token, registry: { protocol: 'xplat-dev-actions', version: 1, appInstanceId: 'relay-fixture', platform: 'web', revision: 1, actions: [] } }))
					client.onmessage = (event) => { if (JSON.parse(event.data).type === 'registered') {finish('registered')} }
					client.onclose = () => finish('closed')
					client.onerror = () => finish('error')
				})
				if (allowed) {
					assert.equal(state, 'registered')
					await until(() => cli(f, ['actions', 'list']).data?.instances?.some((instance) => instance.appInstanceId === 'relay-fixture'), 'Relayed app was not visible through native RPC')
				} else {
					assert.notEqual(state, 'registered', 'The private CLI credential must not authenticate an app')
					assert.equal(cli(f, ['actions', 'list']).data.instances.length, 0)
				}
			} finally {
				if (client.readyState !== WebSocket.CLOSED) {
					const closed = new Promise((resolve) => client.addEventListener('close', resolve, { once: true }))
					client.close()
					await closed
				}
			}
		}
		assert.equal(owned.ended, false, 'Closing relayed clients stopped the foreground server')
		assert.equal((await fetch(origin)).status, 200)
		assert.ok(!owned.stdout.includes(info.token) && !owned.stderr.includes(info.token))
		evidence.push({ workflow: 'Actual Go app authentication through real project Vite WS proxy; private CLI token rejected, app grant accepted, short clients preserve foreground ownership. Web target is a transport carrier; no NativeScript device qualification.' })
	} finally { await stop(owned) }
})

test(
	'real framework action registry connects through project Vite and survives client attachment',
	{ timeout: 90000 },
	async () => {
		const f = fixture()
		for (const name of [
			'dev-actions-registry.ts',
			'dev-actions-schema.ts',
			'dev-bridge-socket.ts',
		]) {
			cpSync(join(root, 'packages/platform/src', name), join(f.app, name))
		}
		cpSync(join(root, 'packages/platform/src/dev-bridge.web.ts'), join(f.app, 'dev-bridge.ts'))
		put(
			f.app,
			'app-debug.ts',
			`import vm from 'node:vm';
 import {registerDevAction,startDevActionBridge} from './dev-actions-registry';
 let origin='';export function setOrigin(value){origin=value}
 let calls=0;
 const action=registerDevAction({id:'fixture.read',title:'Read fixture',description:'Read fixture state',effects:{summary:'Reads state'},input:{fields:{value:{type:'string',pattern:'(?<=a)b',default:'ab'},emoji:{type:'string',maxLength:2,default:'😀'}}},result:{fields:{value:{type:'integer'},echoed:{type:'string'}}},run:(input)=>({value:++calls,echoed:input.value+input.emoji})});
 const others=[
 registerDevAction({id:'fixture.mapped',title:'Mapped failure',description:'Throws from a real served module',effects:{summary:'Local fixture only'},run:async()=>{const source=await(await fetch(origin+'mapped.ts')).text();vm.runInNewContext(source,{}, {filename:origin+'mapped.ts'})}}),
 registerDevAction({id:'fixture.bad',title:'Bad result',description:'Returns an invalid result',effects:{summary:'Local fixture'},result:{fields:{value:{type:'integer'}}},run:()=>{calls++;return {value:'wrong'}}}),
 registerDevAction({id:'fixture.external',title:'Declared external',description:'Local counter with external declaration',effects:{summary:'Local fixture only',externalEffects:true},result:{fields:{value:{type:'integer'}}},run:()=>({value:++calls})}),
 registerDevAction({id:'fixture.slow',title:'Cancellable',description:'Waits for cooperative cancellation',effects:{summary:'Local wait'},execution:{cancellable:true,timeoutMs:1000},run:(_input,context)=>new Promise((_resolve,reject)=>context.signal.addEventListener('abort',()=>reject(Object.assign(new Error('cancelled'),{name:'AbortError'})),{once:true}))}),
 registerDevAction({id:'fixture.drop',title:'Disconnect',description:'Drops only its app socket after a local effect',effects:{summary:'Local fixture effect'},result:{fields:{value:{type:'integer'}}},run:async()=>{const value=++calls;setTimeout(()=>globalThis['octane-xplat.dev-actions'].bridge.socket.close(),30);await new Promise(resolve=>setTimeout(resolve,1000));return {value}}})
 ];
 let bridge=startDevActionBridge({appLabel:'Real framework registry'});
 export function clear(){action.dispose();for(const other of others)other.dispose()}
 export function count(){return calls}
 export function stop(){bridge.stop()}
 export function reconnect(){bridge=startDevActionBridge({appLabel:'Real framework registry'})}
 `,
		)
		put(
			f.app,
			'vite.config.mjs',
			`import {xplatDevBridge} from '@octane-xplat/cli/vite';
 export default {server:{host:'127.0.0.1',port:0},plugins:[xplatDevBridge(),{name:'real-app-debug',configureServer(server){let app;
 server.httpServer.once('listening',()=>{app=server.ssrLoadModule('/app-debug.ts');app.then(value=>value.setOrigin('http://127.0.0.1:'+server.httpServer.address().port+'/')).catch(error=>console.error(error.message))});
 server.middlewares.use(async(req,res,next)=>{const operation={'/fixture/count':'count','/fixture/clear':'clear','/fixture/stop':'stop','/fixture/reconnect':'reconnect'}[req.url];if(!operation)return next();try{const value=(await app)[operation]();res.end(value===undefined?'ok':JSON.stringify(value))}catch(error){res.statusCode=500;res.end(error.message)}})
 }}]}
 `,
		)
		put(f.app, 'mapped.ts', 'const value: number = 1;\nthrow new Error("mapped action failure");\n')
		const owned = start(f)
		await until(
			() => record(f),
			() => owned.stdout + ' ' + owned.stderr,
		)
		const address = await until(
			() => stripVTControlCharacters(owned.stdout).match(/http:\/\/127\.0\.0\.1:[0-9]+\//)?.[0],
			() => owned.stdout + ' ' + owned.stderr,
		)
		// Execute the real injected client without a browser dependency on portable
		// hosts. This proves client/HTTP/worker/native retention, not browser APIs.
		const html = await (await fetch(address)).text()
		const script = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
			.map((match) => match[1])
			.find((text) => text.includes('__XPLAT_LOGS_INSTALLED__'))
		assert.ok(script, 'native dev did not inject the canonical browser logger')
		const listeners = new Map(),
			sent = []
		const context = vm.createContext({
			Error,
			console: { warn() {}, error() {} },
			addEventListener: (name, handler) => listeners.set(name, handler),
			setTimeout,
			fetch: async (path, init) => {
				sent.push(init)
				return fetch(new URL(path, address), init)
			},
		})
		vm.runInContext(script, context)
		vm.runInContext(
			"console.warn('native-browser-fixture', {privateValue:'do-not-serialize'})",
			context,
		)
		listeners.get('error')({ message: 'native-runtime-error' })
		listeners.get('unhandledrejection')({ reason: 'native-rejected-fixture' })
		const capture = cli(f, ['diagnostics']).data.sessions[0]
		const readConsole = () => cli(f, ['diagnostics', '--session', capture.sessionId]).data
		await until(
			() =>
				['native-browser-fixture', 'native-runtime-error', 'native-rejected-fixture'].every(
					(text) =>
						readConsole().logs.records.some(
							(record) => record.source === 'browser' && record.line.includes(text),
						),
				),
			'browser client logs did not reach native capture',
		)
		assert.equal(readConsole().coverage.appConsole.status, 'captured')
		assert.ok(!JSON.stringify(readConsole()).includes('do-not-serialize'))
		const headers = sent[0].headers
		assert.equal(
			(
				await fetch(new URL('/__xplat_dev__/logs', address), {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: '{}',
				})
			).status,
			403,
		)
		assert.equal(
			(
				await fetch(new URL('/__xplat_dev__/logs', address), {
					method: 'POST',
					headers: { ...headers, origin: 'http://foreign.invalid' },
					body: '{}',
				})
			).status,
			403,
		)
		assert.equal(
			(
				await fetch(new URL('/__xplat_dev__/logs', address), {
					method: 'POST',
					headers,
					body: JSON.stringify({ records: [{ level: 'info', line: 'must-not-retain' }] }),
				})
			).status,
			400,
		)
		if (process.env.XPLAT_GO_BROWSER_LOGS === '1') {
			const requireWeb = createRequire(join(root, 'apps/web/package.json'))
			const browser = await requireWeb('playwright').chromium.launch({ headless: true })
			try {
				const page = await browser.newPage()
				await page.goto(address)
				await page.evaluate(() => {
					console.warn('chromium-native-warning')
					setTimeout(() => {
						throw new Error('chromium-native-uncaught')
					}, 0)
					Promise.reject('chromium-native-rejection')
				})

				await until(
					() =>
						[
							'chromium-native-warning',
							'chromium-native-uncaught',
							'chromium-native-rejection',
						].every((text) =>
							readConsole().logs.records.some(
								(record) => record.source === 'browser' && record.line.includes(text),
							),
						),
					'actual Chromium logs were not retained',
				)

				evidence.push({
					workflow:
						'actual headless Chromium console warning, uncaught error and rejected promise through injected native plugin; no images captured',
				})
			} finally {
				await browser.close()
			}
		}
		const inventory = () => cli(f, ['actions', 'list'])
		let registered
		await until(
			() => {
				const result = inventory()
				registered = result.data?.instances?.[0]
				return registered?.actions?.some((action) => action.id === 'fixture.read')
			},
			() => owned.stdout + ' ' + owned.stderr,
		)
		assert.equal(registered.appLabel, 'Real framework registry')
		await delay(12000)
		assert.equal(
			cli(f, ['session', 'status', registered.sessionId]).data.session.state,
			'ready',
			'app heartbeat did not survive HTTP timeout defaults',
		)
		assert.equal(
			cli(f, ['session', 'status', registered.sessionId]).data.session.connectedAt,
			registered.connectedAt,
			'the app silently reconnected during the heartbeat window',
		)
		const attached = cli(f, [
			'session',
			'attach',
			'--platform',
			'web',
			'--instance',
			registered.appInstanceId,
		])
		assert.equal(attached.status, 0, JSON.stringify(attached.error))
		assert.equal(attached.data.session.sessionId, registered.sessionId)
		assert.equal(attached.data.session.ownership, 'observed')
		assert.equal(cli(f, ['targets']).data.targets[0].apps.length, 1)
		const invoke = (id, key, input = '{}', extra = []) =>
			cli(f, [
				'actions',
				'invoke',
				'--action',
				id,
				'--instance',
				registered.appInstanceId,
				'--input',
				input,
				'--request-key',
				key,
				...extra,
			])
		const finished = async (accepted) => {
			assert.equal(accepted.status, 0, JSON.stringify(accepted.error))
			let job
			await until(
				() => {
					job = cli(f, ['actions', 'status', accepted.data.job.jobId]).data?.job
					return job && !['queued', 'running', 'cancelling'].includes(job.state)
				},
				'action did not finish',
				15000,
			)
			return job
		}

		const mapped = await finished(invoke('fixture.mapped', 'mapped-failure'))
		assert.equal(mapped.state, 'failed')
		assert.equal(mapped.error.context.stackResolution, 'vite-current', JSON.stringify(mapped.error))
		assert.match(mapped.error.context.failures[0].sourceStack, /mapped\.ts:2:\d+/)
		assert.ok(mapped.error.context.failures[0].stack.includes(address + 'mapped.ts:'))
		const count = async () => JSON.parse(await (await fetch(address + 'fixture/count')).text())
		assert.equal(
			invoke('fixture.read', 'stale', '{}', ['--revision', '0']).error.code,
			'stale_identity',
		)
		assert.equal(
			invoke('fixture.read', 'invalid', '{"value":"no"}').error.code,
			'invalid_selection',
		)
		assert.equal(
			invoke('fixture.read', 'utf16', '{"emoji":"😀😀"}').error.code,
			'invalid_selection',
		)
		const accepted = invoke('fixture.read', 'read-once')
		const success = await finished(accepted)
		assert.equal(success.state, 'succeeded')
		assert.equal(
			success.result.outcome.result.echoed,
			'ab😀',
			'JS lookbehind/default/UTF-16 semantics were not retained',
		)
		assert.equal(await count(), 1)
		const repeated = invoke('fixture.read', 'read-once')
		assert.equal(repeated.data.job.jobId, accepted.data.job.jobId)
		assert.equal(repeated.data.deduplicated, true)
		assert.equal(
			invoke('fixture.read', 'read-once', '{"value":"ab","emoji":"x"}').error.code,
			'stale_identity',
		)
		assert.equal(await count(), 1)
		const bad = await finished(invoke('fixture.bad', 'bad-once'))
		assert.equal(bad.state, 'failed')
		assert.equal(
			await count(),
			2,
			'completed invalid-result effect was silently rolled back/repeated',
		)
		assert.equal(invoke('fixture.external', 'external-once').error.code, 'permission_denied')
		assert.equal(await count(), 2)
		const allowed = cli({ ...f, env: { ...f.env, XPLAT_PERMISSIONS: 'external-effects' } }, [
			'actions',
			'invoke',
			'--action',
			'fixture.external',
			'--instance',
			registered.appInstanceId,
			'--request-key',
			'external-once',
		])
		assert.equal((await finished(allowed)).state, 'succeeded')
		assert.equal(await count(), 3)
		const cancelled = await finished(invoke('fixture.slow', 'cancel-once'))
		assert.equal(cancelled.state, 'cancelled')
		assert.equal(cancelled.result.outcome.status, 'cancelled')
		const dropped = invoke('fixture.drop', 'drop-once')
		const unknown = await finished(dropped)
		assert.equal(unknown.state, 'failed')
		assert.equal(unknown.error.context.outcome, 'unknown')
		await until(
			() => inventory().data.instances[0]?.sessionId === registered.sessionId,
			'app did not reconnect after transport loss',
			10000,
		)
		const retryUnknown = invoke('fixture.drop', 'drop-once')
		assert.equal(retryUnknown.data.job.jobId, dropped.data.job.jobId)
		assert.equal(retryUnknown.data.deduplicated, true)
		await delay(1200)
		assert.equal(await count(), 4, 'unknown in-flight action was replayed')

		assert.equal(owned.ended, false)
		const transformed = await (await fetch(address + 'dev-bridge.ts')).text()
		assert.ok(!transformed.includes(record(f).token), 'private CLI credential entered app code')
		assert.equal((await fetch(address + 'fixture/clear')).status, 200)
		await until(
			() => inventory().data.instances[0]?.actions?.length === 0,
			'connected empty registry was not observed',
		)
		assert.equal((await fetch(address + 'fixture/stop')).status, 200)
		await until(
			() =>
				cli(f, ['session', 'status', registered.sessionId]).data?.session.state === 'disconnected',
			'app disconnection was not observed',
		)
		assert.equal(owned.ended, false)
		assert.equal((await fetch(address)).status, 200)
		assert.equal((await fetch(address + 'fixture/reconnect')).status, 200)
		await until(
			() => inventory().data.instances[0]?.sessionId === registered.sessionId,
			'framework registry did not reconnect with stable identity',
		)
		assert.equal(cli(f, ['session', 'attach']).status, 0)
		evidence.push({
			workflow:
				'actual framework registry, project Vite SSR, native socket attachment; empty registry, app disconnect/reconnect and short-lived clients',
			sessionId: registered.sessionId,
		})
		await stop(owned)
		await until(
			async () => {
				try {
					await fetch(address, { signal: AbortSignal.timeout(500) })
					return false
				} catch {
					return true
				}
			},
			'app-debug Vite listener survived foreground shutdown',
			10000,
		)
	},
)

test(
	'connected browser inspection and explicit handler dispatch preserve app lifetime',
	{ skip: process.env.XPLAT_GO_BROWSER_LOGS !== '1', timeout: 90000 },
	async () => {
		const f = fixture()
		for (const name of [
			'dev-actions-registry.ts',
			'dev-actions-schema.ts',
			'dev-bridge-socket.ts',
		]) {
			cpSync(join(root, 'packages/platform/src', name), join(f.app, name))
		}
		cpSync(join(root, 'packages/platform/src/dev-bridge.web.ts'), join(f.app, 'dev-bridge.ts'))
		put(
			f.app,
			'index.html',
			`<!doctype html><html><body>
 <button id="button" data-testid="counter.increment">Increment fixture</button>
 <div id="value">Visible count 0</div>
 <input id="password" type="password" value="never-return-password">
 <section id="private" data-xplat-private><span>never-return-private-text</span></section>
 <input id="hidden" type="hidden" value="never-return-hidden">
 <button data-testid="duplicate">First</button><button data-testid="duplicate">Second</button>
 <button id="disabled" disabled>Disabled fixture</button>
 <button id="hidden-button" style="display:none">Hidden fixture</button>
 <button id="obscured" style="position:absolute;top:300px;left:10px;width:100px;height:30px">Covered fixture</button>
 <div style="position:absolute;top:300px;left:10px;width:150px;height:40px;z-index:99999">Fixed cover</div>
 <script type="module">import {registerDevAction,startDevActionBridge} from '/dev-actions-registry.ts';globalThis.fixtureAllClicks=0;globalThis.fixtureCount=0;
 document.addEventListener('click',()=>globalThis.fixtureAllClicks++);
 document.getElementById('button').addEventListener('click',(event)=>{globalThis.fixtureCount++;globalThis.fixtureTrusted=event.isTrusted;document.getElementById('value').textContent='Visible count '+globalThis.fixtureCount});
 registerDevAction({id:'fixture.browser.read',title:'Read browser fixture',description:'Reads current fixture text',effects:{summary:'Read only'},result:{fields:{value:{type:'string'}}},run:()=>({value:document.getElementById('value').textContent})});
 startDevActionBridge({appLabel:'Actual browser inspector'});</script>
 </body></html>`,
		)
		put(
			f.app,
			'vite.config.mjs',
			`import {xplatDevBridge} from '@octane-xplat/cli/vite';export default{server:{host:'127.0.0.1',port:0},plugins:[xplatDevBridge()]}`,
		)
		const owned = start(f)
		const address = await until(
			() => stripVTControlCharacters(owned.stdout).match(/http:\/\/127\.0\.0\.1:[0-9]+\//)?.[0],
			() => owned.stdout + ' ' + owned.stderr,
		)
		const requireWeb = createRequire(join(root, 'apps/web/package.json'))
		const browser = await requireWeb('playwright').chromium.launch({ headless: true })
		let retainedId

		try {
			const page = await browser.newPage()
			await page.goto(address)
			let session
			await until(
				() => {
					session = cli(f, ['session', 'list']).data?.sessions.find(
						(value) => value.inspection?.version === 1 && value.state === 'ready',
					)
					return session
				},
				() => owned.stdout + ' ' + owned.stderr,
			)

			const inspect = (...args) => cli(f, ['inspect', session.sessionId, ...args])
			const all = inspect()
			assert.equal(all.status, 0, JSON.stringify(all.error))
			assert.equal(all.data.total, 10)
			assert.equal(all.data.documentId, session.inspection.documentId)
			assert.ok(
				all.data.controls.some(
					(control) => control.id === 'value' && control.text === 'Visible count 0',
				),
			)

			assert.ok(!JSON.stringify(all).includes('never-return-'))
			for (const id of ['password', 'private', 'hidden']) {
				const control = all.data.controls.find((control) => control.id === id)
				assert.equal(control.sensitive, true)
				assert.equal(control.text, '[redacted]')
				assert.equal(control.value, '[redacted]')
			}

			const focused = await page.evaluate(() => document.activeElement?.id)
			const selected = inspect('--id', 'button')
			assert.equal(selected.status, 0)
			assert.equal(selected.data.controls.length, 1)
			assert.equal(
				await page.evaluate(() => document.activeElement?.id),
				focused,
				'read-only inspection changed focus',
			)

			const bounded = inspect('--limit', '2')
			assert.equal(bounded.data.controls.length, 2)
			assert.equal(bounded.data.nextOffset, 2)
			assert.equal(inspect('--offset', '2', '--limit', '2').data.controls[0].id, 'password')
			assert.equal(inspect('--testid', 'duplicate').error.code, 'ambiguous_selection')
			assert.equal(inspect('--id', 'absent').error.code, 'not_found')
			assert.equal(
				inspect('--id', 'button', '--testid', 'duplicate').error.code,
				'invalid_selection',
			)

			assert.ok(session.inspection.mechanisms.includes('handler-dispatch'))
			const interact = (id, key, documentId = all.data.documentId) =>
				cli(f, [
					'interact',
					session.sessionId,
					'--document',
					documentId,
					'--id',
					id,
					'--mechanism',
					'handler-dispatch',
					'--request-key',
					key,
				])

			assert.equal(
				cli(f, [
					'interact',
					session.sessionId,
					'--document',
					all.data.documentId,
					'--id',
					'button',
					'--request-key',
					'missing-mechanism',
				]).error.code,
				'invalid_selection',
			)

			assert.equal(
				cli(f, [
					'interact',
					session.sessionId,
					'--document',
					all.data.documentId,
					'--id',
					'button',
					'--mechanism',
					'handler-dispatch',
				]).error.code,
				'invalid_selection',
			)

			const stale = interact('button', 'stale-click', 'stale-document')
			assert.equal(stale.error.code, 'stale_identity')
			assert.equal(stale.error.context.outcome, 'not-run')
			for (const id of ['disabled', 'hidden-button', 'obscured', 'password', 'private', 'hidden']) {
				const blocked = interact(id, 'blocked-' + id)
				assert.equal(blocked.error.code, 'unavailable', JSON.stringify(blocked))
				assert.equal(blocked.error.context.outcome, 'not-run')
			}

			assert.equal(await page.evaluate(() => globalThis.fixtureAllClicks), 0)
			const click = interact('button', 'click-once')
			assert.equal(click.status, 0, JSON.stringify(click.error))
			assert.equal(click.data.inputSent, true)
			assert.equal(click.data.eventTrusted, false)
			assert.equal(click.data.evidence.provenance.mechanism, 'handler-dispatch')
			assert.equal(await page.evaluate(() => globalThis.fixtureTrusted), false)
			assert.equal(inspect('--id', 'value').data.controls[0].text, 'Visible count 1')
			assert.equal(interact('button', 'click-once').data.evidence.id, click.data.evidence.id)
			assert.equal(interact('value', 'click-once').error.code, 'stale_identity')
			assert.equal(
				await page.evaluate(() => globalThis.fixtureAllClicks),
				1,
				'a repeated or rebound key dispatched again',
			)

			for (const mechanism of ['dom-event', 'os-input']) {
				assert.equal(
					cli(f, [
						'interact',
						session.sessionId,
						'--document',
						all.data.documentId,
						'--id',
						'button',
						'--mechanism',
						mechanism,
						'--request-key',
						'wrong-' + mechanism,
					]).error.code,
					'invalid_selection',
				)
			}

			assert.equal(
				await page.evaluate(() => globalThis.fixtureAllClicks),
				1,
				'unsupported mechanism fell back to a click',
			)

			const expired = await page.evaluate(
				(documentId) =>
					globalThis['octane-xplat.dev-inspector'].interact({
						documentId,
						control: { kind: 'id', name: 'button' },
						mechanism: 'handler-dispatch',
						expiresAt: Date.now() - 1,
					}),
				all.data.documentId,
			)

			assert.equal(expired.outcome, 'not-run')
			assert.equal(await page.evaluate(() => globalThis.fixtureAllClicks), 1)
			// Qualify real browser action work separately from inspection traffic.
			const action = cli(f, [
				'actions',
				'invoke',
				'--instance',
				session.appInstanceId,
				'--action',
				'fixture.browser.read',
				'--request-key',
				'browser-read-once',
			])

			assert.equal(action.status, 0, JSON.stringify(action.error))
			let actionResult
			await until(() => {
				actionResult = cli(f, ['actions', 'status', action.data.job.jobId]).data?.job
				return actionResult?.state === 'succeeded'
			}, 'real browser action did not finish')

			assert.equal(actionResult.result.outcome.result.value, 'Visible count 1')
			assert.equal(
				cli(f, [
					'actions',
					'invoke',
					'--instance',
					session.appInstanceId,
					'--action',
					'fixture.browser.read',
					'--request-key',
					'browser-read-once',
				]).data.job.jobId,
				action.data.job.jobId,
			)

			retainedId = inspect('--id', 'value').data.evidence.id
			const deniedRetention = cli(f, ['evidence', 'retain', retainedId])
			assert.equal(deniedRetention.error.code, 'permission_denied')
			const granted = { ...f, env: { ...f.env, XPLAT_PERMISSIONS: 'evidence-retain' } }
			assert.equal(
				cli(granted, ['evidence', 'retain', retainedId, '--expires-at', 'yesterday']).error.code,
				'invalid_selection',
			)

			const retained = cli(granted, ['evidence', 'retain', retainedId])
			assert.equal(retained.status, 0, JSON.stringify(retained.error))
			assert.equal(retained.data.record.retention.scope, 'retained')
			assert.equal(retained.data.record.retention.expiresAt, null)
			assert.equal(retained.data.record.data.controls[0].text, 'Visible count 1')

			const evidenceId = all.data.evidence.id
			const inventory = cli(f, ['evidence', 'list'])
			assert.equal(inventory.status, 0, JSON.stringify(inventory.error))
			assert.ok(
				inventory.data.evidence.some(
					(record) => record.id === evidenceId && record.provenance.sessionId === session.sessionId,
				),
			)

			assert.ok(!JSON.stringify(inventory).includes('never-return-'))
			assert.equal(cli(f, ['evidence', 'delete', evidenceId]).status, 0)
			assert.equal(cli(f, ['evidence', 'delete', evidenceId]).error.code, 'not_found')
			const previous = session.sessionId,
				document = all.data.documentId

			await page.reload()
			await until(
				() =>
					cli(f, ['session', 'list']).data?.sessions.some(
						(value) =>
							value.sessionId !== previous &&
							value.inspection?.documentId !== document &&
							value.state === 'ready',
					),
				'new browser document not observed',
			)

			assert.equal(cli(f, ['inspect', previous]).error.code, 'disconnected_runtime')
			assert.equal(owned.ended, false)
			assert.equal((await fetch(address)).status, 200)
			evidence.push({
				workflow:
					'actual headless Chromium inspection and programmatic handler-dispatch, blocked private/hidden/disabled/obscured hosts, idempotent receipts and real browser action invocation; no images, CDP input or OS input',
				documentId: document,
			})
		} finally {
			await browser.close()
			await stop(owned)
		}

		const offline = { ...f, env: { ...f.env, PATH: '' } }
		const historical = cli(offline, ['evidence', 'list'])
		assert.equal(historical.status, 0, JSON.stringify(historical.error))
		assert.equal(historical.data.evidence.length, 1, 'ephemeral records survived server exit')
		assert.equal(historical.data.evidence[0].id, retainedId)
		assert.equal(historical.data.evidence[0].data.controls[0].text, 'Visible count 1')
		assert.equal(record(f), null, 'offline read started a dev server')
		const renewed = cli(
			{ ...offline, env: { ...offline.env, XPLAT_PERMISSIONS: 'evidence-retain' } },
			[
				'evidence',
				'retain',
				retainedId,
				'--expires-at',
				new Date(Date.now() + 3600000).toISOString(),
			],
		)
		assert.equal(renewed.status, 0, JSON.stringify(renewed.error))
		assert.ok(renewed.data.record.retention.expiresAt)
		assert.equal(cli(offline, ['evidence', 'delete', retainedId]).status, 0)
		assert.equal(cli(offline, ['evidence', 'list']).data.evidence.length, 0)
		assert.equal(cli(offline, ['evidence', 'delete', retainedId]).error.code, 'not_found')
		evidence.push({
			workflow:
				'actual browser text evidence retention grant, dev exit, native offline reads/renew/delete with empty PATH; no Node or server bootstrap',
		})
	},
)
