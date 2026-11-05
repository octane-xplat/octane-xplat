import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import {
	readFileSync,
	writeFileSync,
	mkdirSync,
	symlinkSync,
	realpathSync,
	rmSync,
	readdirSync,
	existsSync,
} from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { scratchRun } from '../cli-nim/scratch.mjs'
import { projectToolFixture } from './project-fixtures.mjs'
const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')
const target = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `xplat-go-${target}-cli${process.platform === 'win32' ? '.exe' : ''}`)
const build = JSON.parse(readFileSync(binary + '.json'))
const sha = (b) => createHash('sha256').update(b).digest('hex')
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs))
	assert.equal(sha(readFileSync(join(root, file))), hash, file)
const scratch = realpathSync(scratchRun(root, 'go-dev'))
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }))
const tools = projectToolFixture(root, work, scratch)
let sequence = 0
function put(dir, name, value) {
	const file = join(dir, name)
	mkdirSync(dirname(file), { recursive: true })
	writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value))
	return file
}
function fixture({ close = false, installed = true, multi = false } = {}) {
	const app = join(scratch, `app ${sequence++} π`),
		home = join(scratch, `home ${sequence}`)
	mkdirSync(home)
	put(app, 'package.json', {
		name: 'dev-test',
		private: true,
		type: 'module',
		packageManager: 'bun@1.4.4',
		xplat: { targets: { web: {} } },
		...(multi
			? { scripts: { dev: 'node fail.mjs' }, xplat: { targets: { linux: { runtime: 'gtk' } } } }
			: {}),
	})
	put(app, 'index.html', '<h1>Native dev HTTP fixture</h1>')
	put(
		app,
		'vite.config.mjs',
		`export default {server:{port:0,host:'127.0.0.1'},plugins:[{name:'native-dev-receipt',configureServer(server){server.httpServer.once('listening',()=>{console.log('DEV_TEST_LISTENING http://127.0.0.1:'+server.httpServer.address().port);${close ? 'setTimeout(()=>server.close(),700)' : ''}})}}]}`,
	)
	if (installed) {
		const destination = join(app, 'node_modules/vite')
		mkdirSync(dirname(destination), { recursive: true })
		symlinkSync(
			realpathSync(join(tools.nodeModules, 'vite')),
			destination,
			process.platform === 'win32' ? 'junction' : 'dir',
		)
	} else put(app, 'node_modules/vite/package.json', { name: 'broken-vite' })
	if (multi) put(app, 'fail.mjs', "console.log('SCRIPT_FAILED_SEVEN');process.exit(7)")
	const cache = process.platform === 'darwin' ? join(home, 'Library/Caches') : join(home, 'cache')
	return {
		app,
		home,
		cache,
		env: {
			...process.env,
			HOME: home,
			LOCALAPPDATA: cache,
			XDG_CACHE_HOME: cache,
			NODE_OPTIONS: '',
			NODE_PATH: '',
		},
	}
}
function sessions(f) {
	const project = realpathSync(f.app),
		key = sha(Buffer.from(process.platform === 'win32' ? project.toLowerCase() : project))
	const directory = join(f.cache, 'octane-xplat/cli-go/history-go-v1', key)
	return readdirSync(directory)
		.filter((n) => n.startsWith('sess_'))
		.map((id) => ({ id, ...JSON.parse(readFileSync(join(directory, id, 'session.json'))) }))
}
test('Go main dev serves actual project Vite and stops its owned listener', async () => {
	const f = fixture(),
		child = spawn(binary, ['dev', 'web'], {
			cwd: f.app,
			env: f.env,
			stdio: ['ignore', 'pipe', 'pipe'],
		})
	let output = ''
	child.stdout.on('data', (b) => (output += b))
	child.stderr.on('data', (b) => (output += b))
	const exited = once(child, 'exit')
	let address
	try {
		for (let n = 0; n < 1200; n++) {
			address = output.match(/DEV_TEST_LISTENING (http:\/\/127\.0\.0\.1:\d+)/)?.[1]
			if (address) break
			if (child.exitCode !== null) assert.fail(output)
			await delay(25)
		}
		assert.ok(address, output)
		assert.match(output, /\[web\] session sess_/)
		const response = await fetch(address)
		assert.equal(response.status, 200)
		assert.match(await response.text(), /Native dev HTTP fixture/)
		child.kill('SIGTERM')
		const [code, signal] = await exited
		if (process.platform === 'win32') assert.equal(signal, 'SIGTERM')
		else {
			assert.equal(signal, null)
			assert.equal(code, 143, output)
		}
		for (let n = 0; n < 100; n++) {
			try {
				await fetch(address)
				await delay(25)
			} catch {
				break
			}
		}
		await assert.rejects(fetch(address))
		const records = sessions(f)
		assert.equal(records.length, 1)
		if (process.platform !== 'win32') {
			assert.equal(records[0].cleanupConfirmed, true)
			assert.ok(records[0].endedAt)
		} else {
			assert.equal(records[0].cleanupConfirmed, false)
		}
	} finally {
		if (child.exitCode === null && child.signalCode === null) {
			child.kill('SIGTERM')
			await exited
		}
		writeFileSync(join(work, `dev-${target}-output.txt`), output)
	}
})
test('all engines preflight before route generation or session creation', () => {
	const f = fixture({ installed: false })
	put(f.app, 'app/index.ts', 'export default function Page() {}')
	const result = spawnSync(binary, ['dev', 'web'], {
		cwd: f.app,
		env: f.env,
		encoding: 'utf8',
		timeout: 15000,
	})
	assert.equal(result.status, 1, result.stdout + result.stderr)
	assert.match(result.stderr, /vite/)
	assert.ok(!readdirSync(f.app).some((n) => n.startsWith('routes.gen')))
	assert.doesNotMatch(result.stdout, /session sess_/)
})
test(
	'main dev retains the first target failure after a later successful target exit',
	{ skip: process.platform === 'win32' },
	() => {
		const f = fixture({ close: true, multi: true })
		const result = spawnSync(binary, ['dev', '--targets', 'web,linux'], {
			cwd: f.app,
			env: f.env,
			encoding: 'utf8',
			timeout: 20000,
		})
		assert.equal(result.status, 7, result.stdout + result.stderr)
		assert.match(result.stdout, /SCRIPT_FAILED_SEVEN/)
		assert.match(result.stdout, /DEV_TEST_LISTENING/)
		const records = sessions(f)
		assert.equal(records.length, 2)
		assert.ok(records.every((r) => r.cleanupConfirmed && r.endedAt))
		assert.deepEqual(records.map((r) => r.state).sort(), ['failed', 'stopped'])
	},
)

async function until(check, evidence, timeout = 30000) {
	const end = Date.now() + timeout
	while (!check()) {
		assert.ok(Date.now() < end, evidence())
		await delay(25)
	}
}
test('main dev publishes initial routes before Vite and recovers later invalid configuration', async () => {
	const f = fixture()
	const cliPackage = join(f.app, 'node_modules/@octane-xplat/cli')
	mkdirSync(dirname(cliPackage), { recursive: true })
	symlinkSync(
		realpathSync(join(tools.nodeModules, '@octane-xplat/cli')),
		cliPackage,
		process.platform === 'win32' ? 'junction' : 'dir',
	)
	put(f.app, 'app/index.tsx', 'export default () => null')
	const config = readFileSync(join(f.app, 'vite.config.mjs'), 'utf8')
	put(
		f.app,
		'vite.config.mjs',
		"import {existsSync} from 'node:fs';if(!existsSync('routes.gen.manifest.json'))throw Error('routes missing before engine');" +
			config,
	)
	const child = spawn(binary, ['dev', 'web'], {
		cwd: f.app,
		env: f.env,
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	const exited = once(child, 'exit')
	let output = ''
	child.stdout.on('data', (b) => (output += b))
	child.stderr.on('data', (b) => (output += b))
	try {
		await until(
			() => output.includes('DEV_TEST_LISTENING'),
			() => output,
		)
		const manifest = () => readFileSync(join(f.app, 'routes.gen.manifest.json'), 'utf8')
		const initial = manifest()
		put(f.app, 'xplat.routes.json', '{bad')
		await until(
			() => /routing config|invalid character|JSON/i.test(output),
			() => output,
		)
		assert.equal(manifest(), initial)
		put(f.app, 'xplat.routes.json', { directory: 'app' })
		put(f.app, 'app/added.tsx', 'export default () => null')
		await until(
			() => manifest().includes('added'),
			() => output,
		)
		assert.equal(child.exitCode, null)
	} finally {
		child.kill('SIGTERM')
		await exited
	}
})
test(
	'main dev macOS worker runs actual AppKit app code and cleans launch resources',
	{ skip: process.platform !== 'darwin', timeout: 180000 },
	async () => {
		const f = fixture(),
			packs = join(scratch, 'macos-pack')
		mkdirSync(packs)
		const packed = spawnSync('bun', ['pm', 'pack', '--ignore-scripts', '--destination', packs], {
			cwd: join(root, 'packages/macos-build'),
			encoding: 'utf8',
			timeout: 30000,
		})
		assert.equal(packed.status, 0, packed.stderr)
		const archive = join(
			packs,
			readdirSync(packs).find((p) => p.endsWith('.tgz')),
		)
		const pkg = JSON.parse(readFileSync(join(f.app, 'package.json')))
		pkg.dependencies = {
			'@octane-xplat/macos-build': 'file:' + archive,
			'@octane-xplat/cli':
				'file:' +
				join(
					tools.archiveDirectory,
					tools.packages.packages.find((item) => item.name === '@octane-xplat/cli').file,
				),
			vite: tools.packages.vite,
			octane: '0.16.3',
			'@nativescript/macos-node-api': '0.4.4-next.2026-08-09-31292056208',
		}
		pkg.overrides = {
			'@octane-xplat/lib':
				'file:' +
				join(
					tools.archiveDirectory,
					tools.packages.packages.find((item) => item.name === '@octane-xplat/lib').file,
				),
		}
		pkg.xplat = {
			targets: {
				macos: {
					runtime: 'appkit-node-api',
					renderer: 'appkit',
					dev: { viteConfig: 'vite.config.mjs', bundleFile: 'dist/main.cjs' },
					package: {
						productName: 'Go dev fixture',
						bundleIdentifier: 'org.octane.xplat.go-dev-fixture',
						executableName: 'GoDevFixture',
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
			`import {xplatDevBridge} from '@octane-xplat/cli/vite';export default {plugins:[xplatDevBridge()],build:{outDir:'dist',lib:{entry:'main.js',formats:['cjs'],fileName:()=> 'main.cjs'},rollupOptions:{external:['@nativescript/macos-node-api',/^node:/]}}}`,
		)
		for (const name of ['dev-actions-registry.ts', 'dev-actions-schema.ts', 'dev-bridge-socket.ts'])
			put(f.app, name, readFileSync(join(root, 'packages/platform/src', name), 'utf8'))
		put(
			f.app,
			'dev-bridge.ts',
			readFileSync(join(root, 'packages/platform/src/dev-bridge.macos.ts'), 'utf8'),
		)
		for (const mode of ['exit', 'cancel', ...(process.env.XPLAT_GO_APPLE_REPORTS_REAL === '1' ? ['abort'] : [])]) {
			const active = mode === 'abort' ? { ...f, cache: join(process.env.HOME, 'Library/Caches'), env: { ...f.env, HOME: process.env.HOME } } : f
			const reportCache = join(active.cache, 'octane-xplat/cli-go/history-go-v1', sha(Buffer.from(realpathSync(f.app))))
			if (mode === 'abort') assert.equal(existsSync(reportCache), false, 'owned report fixture cache unexpectedly exists')
			put(
				f.app,
				'main.js',
				`import '@nativescript/macos-node-api';import {registerDevAction} from './dev-actions-registry';registerDevAction({id:'fixture.macos.read',title:'Read macOS app',description:'Observe app fixture',effects:{summary:'Read only'},result:{fields:{value:{type:'integer'}}},run:()=>({value:1})});const app=NSApplication.sharedApplication;app.setActivationPolicy(2);console.log('GO_DEV_APP_INITIALIZED');${mode === 'exit' ? 'setTimeout(()=>app.terminate(null),300)' : mode === 'abort' ? 'setTimeout(()=>abort(),1500)' : 'setInterval(()=>{},1000)'}`,
			)
			const child = spawn(binary, ['dev', 'macos'], {
				cwd: f.app,
				env: active.env,
				stdio: ['ignore', 'pipe', 'pipe'],
			})
			const exited = once(child, 'exit')
			let output = ''
			child.stdout.on('data', (b) => (output += b))
			child.stderr.on('data', (b) => (output += b))
			try {
				await until(
					() => { if (child.exitCode !== null) assert.fail(output); return output.includes('GO_DEV_APP_INITIALIZED') },
					() => output,
					90000,
				)
				if (mode === 'cancel') {
					let live
					const query = (args) => {
						const result = spawnSync(binary, [...args, '--json'], {
							cwd: f.app,
							env: active.env,
							encoding: 'utf8',
							timeout: 10000,
						})
						return JSON.parse(result.stdout)
					}
					await until(
						() => {
							live = query(['actions', 'list'])
							return live.data?.instances?.[0]?.actions?.some(
								(action) => action.id === 'fixture.macos.read',
							)
						},
						() => output + ' ' + JSON.stringify(live),
						15000,
					)
					const appInstance = live.data.instances[0]
					assert.equal(appInstance.platform, 'macos')
					const observed = query(['session', 'attach', '--instance', appInstance.appInstanceId])
					assert.equal(observed.ok, true, JSON.stringify(observed))
					assert.equal(observed.data.session.ownership, 'observed')
					const accepted = query([
						'actions',
						'invoke',
						'--action',
						'fixture.macos.read',
						'--instance',
						appInstance.appInstanceId,
						'--request-key',
						'macos-observed-action',
					])
					assert.equal(accepted.ok, true, JSON.stringify(accepted))
					let job
					await until(
						() => {
							job = query(['actions', 'status', accepted.data.job.jobId]).data?.job
							return job && !['queued', 'running', 'cancelling'].includes(job.state)
						},
						() => output + ' ' + JSON.stringify(job),
						10000,
					)
					assert.equal(job.state, 'succeeded', JSON.stringify(job))
					assert.equal(job.result.outcome.result.value, 1)

					assert.equal(child.exitCode, null, 'observer client ended the AppKit host')
					child.kill('SIGTERM')
				}
				const [code, signal] = await exited
				assert.equal(signal, null, output)
				assert.equal(code, mode === 'exit' ? 0 : mode === 'abort' ? 1 : 143, output)
				if (mode === 'abort') assert.match(output, /macOS host exited: SIGABRT/)
				const records = sessions(active)
				const record = records.find(
					(r) => r.sessionId === output.match(/session (sess_[a-f0-9-]+)/)?.[1],
				)
				assert.ok(record, output)
				assert.equal(record.cleanupConfirmed, true)
				assert.equal(record.nativeIdentity.appId, 'org.octane.xplat.go-dev-fixture')
				if (mode === 'abort') {
					const query = (args) => {
						const response = spawnSync(binary, ['diagnostics', '--session', record.sessionId, ...args, '--json'], {cwd:f.app,env:active.env,encoding:'utf8',timeout:15000,maxBuffer:32*1024*1024})
						assert.equal(response.status, 0, response.stderr)
						return JSON.parse(response.stdout)
					}
					let diagnostics
					await until(() => { diagnostics=query([]); return diagnostics.data?.reports?.some(report=>report.association==='confirmed') }, () => JSON.stringify(diagnostics?.data?.coverage), 45000)
					const report=diagnostics.data.reports.find(report=>report.association==='confirmed')
					const original=query(['--report',report.id])
					assert.match(original.data.report.content,/SIGABRT/)
					assert.equal('report_'+sha(Buffer.from(original.data.report.content)),report.id)
					writeFileSync(join(work,'apple-native-original.json'),JSON.stringify(original),{mode:0o600})
					writeFileSync(join(work,'apple-native-report.json'),JSON.stringify({binarySha256:build.sha256,sessionId:record.sessionId,report,coverage:diagnostics.data.coverage,source:'actual macOS AppKit fixture host abort() and OS .ips report',passed:true},null,2),{mode:0o600})
				}
				for (const launch of record.nativeIdentity.processes) {
					assert.equal(existsSync(launch.executable), false)
					assert.throws(() => process.kill(launch.pid, 0), { code: 'ESRCH' })
				}
			} finally {
				if (child.exitCode === null && child.signalCode === null) {
					child.kill('SIGTERM')
					await exited
				}
				writeFileSync(join(work, `dev-macos-${mode}-output.txt`), output)
				if (mode === 'abort') rmSync(reportCache, {recursive:true,force:true})
			}
		}
	},
)

test(
	'POSIX main dev forwards SIGINT and cleans up after a broken stdout pipe',
	{ skip: process.platform === 'win32', timeout: 60000 },
	async () => {
		for (const mode of ['interrupt', 'broken-pipe']) {
			const f = fixture()
			const base = readFileSync(join(f.app, 'vite.config.mjs'), 'utf8')
			put(
				f.app,
				'vite.config.mjs',
				"import {writeFileSync} from 'node:fs';process.on('SIGINT',()=>{writeFileSync('saw-int','yes');process.exit(0)});const pulse=setInterval(()=>console.log('DEV_PULSE'),25);" +
					base,
			)
			const child = spawn(binary, ['dev', 'web'], {
				cwd: f.app,
				env: f.env,
				stdio: ['ignore', 'pipe', 'pipe'],
			})
			const exited = once(child, 'exit')
			let output = ''
			child.stdout.on('data', (b) => (output += b))
			child.stderr.on('data', (b) => (output += b))
			try {
				await until(
					() => output.includes('DEV_TEST_LISTENING'),
					() => output,
				)
				if (mode === 'interrupt') child.kill('SIGINT')
				else child.stdout.destroy()
				const [code, signal] = await exited
				assert.equal(signal, null, output)
				assert.equal(code, mode === 'interrupt' ? 130 : 141, output)
				if (mode === 'interrupt') assert.equal(readFileSync(join(f.app, 'saw-int'), 'utf8'), 'yes')
				const address = output.match(/DEV_TEST_LISTENING (http:\/\/127\.0\.0\.1:\d+)/)?.[1]
				assert.ok(address, output)
				await assert.rejects(fetch(address))
				assert.ok(sessions(f).every((r) => r.cleanupConfirmed))
			} finally {
				if (child.exitCode === null && child.signalCode === null) {
					child.kill('SIGTERM')
					await exited
				}
			}
		}
	},
)
