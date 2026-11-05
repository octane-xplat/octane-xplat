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
			XPLAT_PERMISSIONS: '',
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
		const captures = cli(f, ['diagnostics']).data.sessions
		assert.equal(captures.length, 1)
		const capture = captures[0]
		assert.equal(capture.historical, false)
		assert.equal(capture.ownerId, info.instanceId)
		const liveLogs = cli(f, ['diagnostics', '--session', capture.sessionId, '--limit', '1']).data
		assert.equal(liveLogs.logs.historical, false)
		assert.equal(liveLogs.logs.records.length, 1)
		assert.equal(liveLogs.coverage.nativeReports.status, 'unsupported')
		const unsupportedReport = cli(f, ['diagnostics', '--session', capture.sessionId, '--report', 'native'])
		assert.equal(unsupportedReport.error.code, 'invalid_selection')
		assert.equal(unsupportedReport.status, 2)
		assert.equal(cli(f, ['diagnostics', '--job', 'removed']).error.code, 'invalid_selection')
		assert.equal(cli(f, ['diagnostics', '--session', capture.sessionId, '--platform', 'ios']).error.code, 'invalid_selection')
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
		if (process.platform !== 'win32') assert.equal(endedLogs.session.cleanupConfirmed, true)
		assert.ok(endedLogs.logs.records.length > 0)
		assert.equal(cli(f, ['diagnostics']).data.sessions[0].sessionId, capture.sessionId)
	},
)

test(
	'real framework action registry connects through project Vite and survives client attachment',
	{ timeout: 90000 },
	async () => {
		const f = fixture()
		for (const name of ['dev-actions-registry.ts', 'dev-actions-schema.ts', 'dev-bridge-socket.ts'])
			cpSync(join(root, 'packages/platform/src', name), join(f.app, name))
		cpSync(join(root, 'packages/platform/src/dev-bridge.web.ts'), join(f.app, 'dev-bridge.ts'))
		put(
			f.app,
			'app-debug.ts',
			`import {registerDevAction,startDevActionBridge} from './dev-actions-registry';
 let calls=0;
 const action=registerDevAction({id:'fixture.read',title:'Read fixture',description:'Read fixture state',effects:{summary:'Reads state'},input:{fields:{value:{type:'string',pattern:'(?<=a)b',default:'ab'},emoji:{type:'string',maxLength:2,default:'😀'}}},result:{fields:{value:{type:'integer'},echoed:{type:'string'}}},run:(input)=>({value:++calls,echoed:input.value+input.emoji})});
 const others=[
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
 server.httpServer.once('listening',()=>{app=server.ssrLoadModule('/app-debug.ts');app.catch(error=>console.error(error.message))});
 server.middlewares.use(async(req,res,next)=>{const operation={'/fixture/count':'count','/fixture/clear':'clear','/fixture/stop':'stop','/fixture/reconnect':'reconnect'}[req.url];if(!operation)return next();try{const value=(await app)[operation]();res.end(value===undefined?'ok':JSON.stringify(value))}catch(error){res.statusCode=500;res.end(error.message)}})
 }}]}
 `,
		)
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
