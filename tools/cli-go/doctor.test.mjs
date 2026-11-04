import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { spawnSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import { createRequire } from 'node:module'
import {
	readFileSync,
	writeFileSync,
	mkdirSync,
	rmSync,
	existsSync,
	symlinkSync,
	realpathSync,
	cpSync,
} from 'node:fs'

import { join, resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { scratchRun } from '../cli-nim/scratch.mjs'
import { projectToolFixture } from './project-fixtures.mjs'

const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')

const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `xplat-go-${host}-cli${process.platform === 'win32' ? '.exe' : ''}`)
const probe = join(work, `xplat-go-${host}${process.platform === 'win32' ? '.exe' : ''}`)
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
const build = JSON.parse(readFileSync(binary + '.json'))
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
	assert.equal(sha(readFileSync(join(root, file))), hash, `Stale doctor source: ${file}`)
}
const probeBuild = JSON.parse(readFileSync(probe + '.json'))
assert.equal(sha(readFileSync(probe)), probeBuild.sha256)
assert.deepEqual(probeBuild.inputs, build.inputs, 'Reference containment must use the same source')

const scratch = realpathSync(scratchRun(root, 'go-doctor'))
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }))
const tools = projectToolFixture(root, work, scratch, { vite: false, packageManagement: true })
const env = {
	...process.env,
	NODE_OPTIONS: '',
	NODE_PATH: '',
	HOME: join(scratch, 'home'),
	XDG_CACHE_HOME: join(scratch, 'cache'),
	LOCALAPPDATA: join(scratch, 'local-app-data'),
	MACOS_SIGNING_IDENTITY: '',
	MACOS_NOTARY_PROFILE: '',
}

const compatibility = JSON.parse(
	readFileSync(join(dirname(tools.worker), 'compatibility-data/compatibility.json')),
)

let sequence = 0
function put(dir, path, data) {
	const file = join(dir, path)
	mkdirSync(dirname(file), { recursive: true })
	writeFileSync(file, typeof data === 'string' ? data : JSON.stringify(data))
	return file
}

function fixture(manifest = {}, files = {}, installed = true) {
	const dir = join(scratch, 'project ' + sequence++ + ' π')
	put(dir, 'package.json', {
		private: true,
		packageManager: `bun@${compatibility.tools.bun}`,
		...manifest,
	})
	if (installed) {
		symlinkSync(
			tools.nodeModules,
			join(dir, 'node_modules'),
			process.platform === 'win32' ? 'junction' : 'dir',
		)
	}
	for (const [path, data] of Object.entries(files)) {
		put(dir, path, data)
	}
	return dir
}

function run(dir, args = [], overlay = {}) {
	return spawnSync(binary, ['doctor', ...args], {
		cwd: dir,
		env: { ...env, ...overlay },
		encoding: 'utf8',
		timeout: 30000,
		maxBuffer: 16 << 20,
	})
}

function success(r) {
	assert.equal(r.status, 0, r.stdout + r.stderr)
	assert.equal(r.signal, null)
}

function oracle(dir, overlay = {}, macosChecks) {
	const module = pathToFileURL(join(dirname(tools.worker), 'doctor-checks.js')).href
	const source = `import {inspectDoctor} from ${JSON.stringify(module)};const report=await inspectDoctor(${macosChecks ? `{macosChecks:async()=>${JSON.stringify(macosChecks)}}` : ''});console.log(JSON.stringify(report));`
	// The canonical report probes installed tools, which can leave descendants
	// after their leader exits. Contain the reference too: direct Node execution
	// reproducibly kept Windows fixture directories busy after successful reports.
	const r = spawnSync(
		probe,
		['exec', '--project', dir, '--', process.execPath, '--input-type=module', '-e', source],
		{
			cwd: dir,
			env: { ...env, ...overlay },
			encoding: 'utf8',
			timeout: 30000,
			maxBuffer: 16 << 20,
		},
	)
	success(r)
	assert.equal(r.stderr, '')
	const result = JSON.parse(r.stdout)
	assert.equal(result.exitCode, 0, result.stderr)
	assert.equal(result.cancelled, false)
	assert.equal(result.truncated, false)
	assert.equal(result.stderr, '')
	return JSON.parse(result.stdout)
}

function compare(dir, overlay = {}, macosChecks) {
	const expected = oracle(dir, overlay, macosChecks),
		actual = run(dir, [], overlay)
	assert.equal(actual.status, expected.exitCode, actual.stdout + actual.stderr)
	for (const row of expected.rows) {
		const detail = row.detail || (row.ok ? 'ok' : 'missing')
		assert.ok(actual.stdout.includes(`${row.name} — ${detail}`), row.name + '\n' + actual.stdout)
	}
	for (const message of expected.messages) {
		assert.ok(actual.stdout.includes(message.text), actual.stdout)
	}
	assert.ok(actual.stdout.includes(expected.summary), actual.stdout)
	if (expected.exitCode && expected.diagnosticStderr) {
		assert.ok(actual.stderr.includes(expected.diagnosticStderr))
	}
	return { expected, actual }
}

const macNames = [
	'macOS host',
	'macOS architecture',
	'macOS dev script',
	'macOS package config',
	'macOS NativeScript declarations',
	'macOS JavaScriptCore package host',
	'macOS native leaf toolchain',
	'codesign',
	'hdiutil',
]

const macRows = macNames.map((name) => ({
	name,
	ok: false,
	detail: 'fixture platform observation',
}))

function fake(dir, name, operation, body) {
	const prefix = 'node_modules/' + name
	put(dir, prefix + '/package.json', {
		name,
		type: 'module',
		exports: { [name === '@octane-xplat/cli' ? './worker' : './doctor-worker']: './worker.mjs' },
	})
	put(
		dir,
		prefix + '/worker.mjs',
		`import {readFileSync,writeFileSync} from 'node:fs';import {spawn} from 'node:child_process';const [input,output]=process.argv.slice(2),r=JSON.parse(readFileSync(input));if(r.operation!==${JSON.stringify(operation)})throw Error('wrong operation');let data={version:1,root:r.project,rows:[{name:'node',ok:true},{name:'bun',ok:true},{name:'compatibility fixture',ok:true}],messages:[],summary:'fixture healthy',exitCode:0,diagnosticStderr:''};${body};writeFileSync(output,JSON.stringify({protocol:r.protocol,version:r.version,id:r.id,ok:true,data}));`,
	)
}

function ownModules(dir) {
	mkdirSync(join(dir, 'node_modules/@octane-xplat'), { recursive: true })
	symlinkSync(
		realpathSync(join(tools.nodeModules, '@octane-xplat/cli')),
		join(dir, 'node_modules/@octane-xplat/cli'),
		process.platform === 'win32' ? 'junction' : 'dir',
	)
}

test('doctor help/schema needs no Node and does not start project workers', () => {
	const dir = fixture()
	success(run(dir, ['--help'], { PATH: '' }))
	const schema = run(dir, ['--schema'], { PATH: '' })
	success(schema)
	assert.equal(JSON.parse(schema.stdout).data.status, 'implemented')
	for (const args of [['--fix'], ['--project', '.'], ['unexpected']]) {
		assert.notEqual(run(dir, args, { PATH: '' }).status, 0)
	}
	const missing = run(dir, [], { PATH: '' })
	assert.notEqual(missing.status, 0)
	assert.match(missing.stderr, /Node is required/)
})

test('actual minimal worker diagnoses a plain project without creator, compiler/parser or Vite installs', () => {
	const require = createRequire(tools.worker)
	for (const name of [
		'create-octane-xplat/compatibility',
		'vite',
		'@babel/core',
		'@tsrx/core',
		'@octane-xplat/lib',
	]) {
		assert.throws(() => require.resolve(name))
	}
	const dir = fixture()
	const { expected } = compare(dir)
	assert.equal(expected.rows.find((row) => row.name === 'compatibility packageManager').ok, true)
})

test('native source and platform diagnostics preserve canonical rows, warnings and severity', () => {
	const native = fixture(
		{ dependencies: { '@octane-xplat/ui': 'workspace:*' } },
		{
			'nativescript.config.ts': 'export default {}',
			'src/main.ts': "import '@octane-xplat/ui'",
			'node_modules-marker': 'unrelated',
		},
	)
	// Use an independent package tree for the authored native peer fixture.
	rmSync(join(native, 'node_modules'), { recursive: true, force: true })
	ownModules(native)
	put(native, 'node_modules/@octane-xplat/ui/package.json', {
		name: '@octane-xplat/ui',
		version: compatibility.frameworkVersion,
		peerDependencies: { '@nativescript/camera': '1.0.0' },
	})
	const { expected } = compare(native)
	assert.ok(expected.messages.some((row) => row.text.includes('native plugin declaration')))
	const linux = fixture({ xplat: { targets: { linux: { runtime: 'gtk', package: {} } } } })
	compare(linux)
	const windows = fixture(
		{ devDependencies: { '@nativescript/windows': '0.0.1' } },
		{ 'nativescript.config.ts': 'export default {}' },
	)
	compare(windows)
})

test('repeated singleton-copy labels retain every physical-version conflict', () => {
	const dir = fixture(
		{ dependencies: { octane: compatibility.packages.octane.version, 'fixture-parent': '1.0.0' } },
		{},
		false,
	)
	ownModules(dir)
	put(dir, 'node_modules/octane/package.json', {
		name: 'octane',
		version: compatibility.packages.octane.version,
	})
	put(dir, 'node_modules/fixture-parent/package.json', {
		name: 'fixture-parent',
		version: '1.0.0',
		dependencies: { octane: '0.0.1' },
	})
	put(dir, 'node_modules/fixture-parent/node_modules/octane/package.json', {
		name: 'octane',
		version: '0.0.1',
	})
	const { expected } = compare(dir)
	assert.ok(
		expected.rows.filter((row) => row.name === 'compatibility installed octane').length >= 2,
	)
	assert.ok(expected.rows.some((row) => row.name === 'compatibility singleton octane' && !row.ok))
})

test('missing/corrupt selected tools fail explicitly and never use a parent worker fallback', () => {
	const dir = fixture({}, {}, false)
	assert.match(run(dir).stderr, /install @octane-xplat\/cli/)
	const mac = fixture({ xplat: { targets: { macos: { runtime: 'appkit-node-api' } } } })
	assert.match(run(mac).stderr, /@octane-xplat\/macos-build/)
	const broken = fixture({}, {}, false)
	put(broken, 'node_modules/@octane-xplat/cli/package.json', { name: 'wrong' })
	assert.match(run(broken).stderr, /reinstall|lacks worker/)
})

test('separate macOS report handoff retains lower-case states and canonical common-check output', () => {
	const dir = fixture({ xplat: { targets: { macos: { runtime: 'appkit-node-api' } } } }, {}, false)
	ownModules(dir)
	fake(dir, '@octane-xplat/macos-build', 'macos-doctor', `data.rows=${JSON.stringify(macRows)}`)
	const { actual } = compare(dir, {}, macRows)
	assert.ok(actual.stdout.includes('macOS native leaf toolchain — fixture platform observation'))
})

test('malformed/foreign reports and silently omitted platform observations cannot look healthy', () => {
	for (const body of [
		'data.rows=[]',
		`data.root='missing-project'`,
		`data.exitCode=null`,
		`data.rows=[{name:'node'}]`,
		`data.messages=[{level:'unknown',text:'bad'}]`,
	]) {
		const dir = fixture({}, {}, false)
		fake(dir, '@octane-xplat/cli', 'doctor', body)
		const r = run(dir)
		assert.equal(r.status, 1)
		assert.doesNotMatch(r.stdout, /fixture healthy/)
	}
	const mac = fixture({ xplat: { targets: { macos: { runtime: 'appkit-node-api' } } } }, {}, false)
	ownModules(mac)
	fake(mac, '@octane-xplat/macos-build', 'macos-doctor', 'data.rows=[]')
	assert.match(run(mac).stderr, /omitted required check/)
})

for (const phase of ['common', 'macos']) {
	test(`cancellation during ${phase} checks waits for descendants and releases the output lease`, async (t) => {
		const dir = fixture(
			phase === 'macos' ? { xplat: { targets: { macos: { runtime: 'appkit-node-api' } } } } : {},
			{},
			false,
		)
		put(dir, 'dist/previous', 'preserve')
		const hang = `const c=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"],{stdio:'inherit'});writeFileSync('ready.json',JSON.stringify({pid:process.pid,child:c.pid}));process.on('SIGTERM',()=>{});await new Promise(()=>{})`
		fake(
			dir,
			'@octane-xplat/cli',
			'doctor',
			phase === 'common' ? hang : "writeFileSync('unexpected-common-worker','ran')",
		)
		if (phase === 'macos') {
			fake(dir, '@octane-xplat/macos-build', 'macos-doctor', hang)
		}
		const child = spawn(binary, ['doctor'], { cwd: dir, env, stdio: ['ignore', 'pipe', 'pipe'] }),
			exited = once(child, 'exit')
		let output = ''
		child.stdout.on('data', (b) => (output += b))
		child.stderr.on('data', (b) => (output += b))
		t.after(async () => {
			if (child.exitCode === null && child.signalCode === null) {
				child.kill('SIGTERM')
				await exited
			}
		})
		for (let i = 0; i < 200 && !existsSync(join(dir, 'ready.json')); i++) {
			await new Promise((r) => setTimeout(r, 25))
		}
		assert.ok(existsSync(join(dir, 'ready.json')), output)
		const busy = run(dir)
		assert.notEqual(busy.status, 0)
		assert.match(busy.stderr, /another Go project operation owns/)
		const clean = spawnSync(binary, ['clean'], { cwd: dir, env, encoding: 'utf8', timeout: 10000 })
		assert.notEqual(clean.status, 0)
		child.kill('SIGTERM')
		const [code] = await exited
		if (process.platform !== 'win32') {
			assert.equal(code, 143, output)
		}
		for (const pid of Object.values(JSON.parse(readFileSync(join(dir, 'ready.json'))))) {
			for (let i = 0; i < 100; i++) {
				try {
					process.kill(pid, 0)
				} catch {
					break
				}

				await new Promise((r) => setTimeout(r, 25))
			}

			assert.throws(() => process.kill(pid, 0), 'diagnostic child survived')
		}
		if (phase === 'macos') {
			assert.equal(
				existsSync(join(dir, 'unexpected-common-worker')),
				false,
				'cancellation must not start the next diagnostic phase',
			)

			fake(dir, '@octane-xplat/macos-build', 'macos-doctor', `data.rows=${JSON.stringify(macRows)}`)
		}
		fake(dir, '@octane-xplat/cli', 'doctor', '')
		success(run(dir))
	})
}

for (const channel of ['stdout', 'stderr']) {
	test(
		`SIGTERM interrupts doctor output blocked on unread ${channel}`,
		{ skip: process.platform === 'win32' },
		async (t) => {
			const dir = fixture({}, {}, false)
			fake(
				dir,
				'@octane-xplat/cli',
				'doctor',
				channel === 'stdout'
					? `data.rows.push(...Array.from({length:8},(_,i)=>({name:'large diagnostic '+i,ok:true,detail:'X'.repeat(1<<20)})))`
					: `process.stdout.write('D'.repeat(8<<20))`,
			)
			const child = spawn(binary, ['doctor'], { cwd: dir, env, stdio: ['ignore', 'pipe', 'pipe'] }),
				exited = once(child, 'exit')
			const blocked = child[channel],
				other = child[channel === 'stdout' ? 'stderr' : 'stdout']
			let observed = 0,
				trace = '',
				prefix = ''
			other.on('data', (bytes) => (trace += bytes.toString()))
			const writing = new Promise((resolve) =>
				blocked.on('data', (bytes) => {
					if (prefix.length < 1024) {
						prefix += bytes.toString().slice(0, 1024 - prefix.length)
					}
					observed += bytes.length
					if (observed >= 128 << 10) {
						blocked.pause()
						resolve()
					}
				}),
			)
			let timer
			const stalled = new Promise((_, reject) => {
				timer = setTimeout(() => reject(Error('large output was never observed: ' + trace)), 10000)
			})
			t.after(async () => {
				clearTimeout(timer)
				if (child.exitCode === null && child.signalCode === null) {
					child.kill('SIGKILL')
					await exited
				}
				child.stdout.destroy()
				child.stderr.destroy()
			})
			await Promise.race([writing, stalled])
			clearTimeout(timer)
			if (channel === 'stderr') {
				assert.match(prefix, /capture limit per stream; output is truncated/)
			}
			const busy = run(dir)
			assert.notEqual(busy.status, 0)
			assert.match(busy.stderr, /another Go project operation owns/)
			child.kill('SIGTERM')
			const ended = await Promise.race([
				exited,
				new Promise((resolve) => {
					timer = setTimeout(() => resolve(null), 3000)
				}),
			])
			clearTimeout(timer)
			assert.ok(ended, 'doctor did not cancel while the downstream pipe was unread')
			assert.equal(ended[0], 143, trace)
			fake(dir, '@octane-xplat/cli', 'doctor', '')
			success(run(dir))
		},
	)
}

test(
	'actual packed macOS diagnostic worker verifies payloads and inspects the installed C leaf toolchain',
	{
		skip:
			process.platform !== 'darwin' ||
			!existsSync(join(root, 'packages/macos-build/dist/macos/doctor-worker.js')),
	},
	() => {
		const packs = join(scratch, 'sdk-pack')
		mkdirSync(packs)
		const packed = spawnSync('bun', ['pm', 'pack', '--ignore-scripts', '--destination', packs], {
			cwd: join(root, 'packages/macos-build'),
			encoding: 'utf8',
			timeout: 30000,
		})
		success(packed)
		const pkg = JSON.parse(readFileSync(join(root, 'packages/macos-build/package.json'))),
			archive = join(packs, `octane-xplat-macos-build-${pkg.version}.tgz`)
		success(spawnSync('tar', ['-xzf', archive, '-C', packs], { encoding: 'utf8' }))
		const sdk = join(packs, 'package'),
			dir = fixture(
				{
					dependencies: {
						'@nativescript/macos-node-api': 'file:fixture',
						'xplat-native-c-fixture': 'file:fixture',
					},
					scripts: { dev: 'fixture' },
					xplat: {
						targets: {
							macos: {
								runtime: 'appkit-node-api',
								package: {
									productName: 'Doctor fixture',
									bundleIdentifier: 'org.octane.xplat.doctor',
									executableName: 'doctor-fixture',
									version: '0.1.0',
									minimumSystemVersion: '13.5',
									viteConfig: 'vite.config.mjs',
									bundleFile: 'dist/main.cjs',
								},
							},
						},
					},
				},
				{ 'vite.config.mjs': 'export default {}' },
				false,
			)
		ownModules(dir)
		symlinkSync(sdk, join(dir, 'node_modules/@octane-xplat/macos-build'), 'dir')
		mkdirSync(join(dir, 'node_modules/@nativescript'), { recursive: true })
		symlinkSync(
			realpathSync(join(root, 'apps/macos/node_modules/@nativescript/macos-node-api')),
			join(dir, 'node_modules/@nativescript/macos-node-api'),
			'dir',
		)
		cpSync(
			join(root, 'packages/cli/test/fixtures/macos-native-leaves/c'),
			join(dir, 'node_modules/xplat-native-c-fixture'),
			{ recursive: true },
		)
		const result = run(dir)
		success(result)
		assert.match(
			result.stdout,
			/macOS JavaScriptCore package host — pinned universal host and addon verified/,
		)
		assert.match(result.stdout, /macOS native leaf toolchain — 1 leaves; SDK/)
		assert.match(result.stdout, /macOS native dev runner — missing/)
		assert.equal(
			existsSync(join(dir, 'artifacts')),
			false,
			'diagnostics must not package or launch an app',
		)
		const record = {
			binarySha256: build.sha256,
			workerTarballSha256: sha(readFileSync(archive)),
			workerTarballBytes: readFileSync(archive).length,
			exitCode: result.status,
			stdout: result.stdout,
			stderr: result.stderr,
			scope:
				'Actual macOS payload/toolchain inspection and metadata generator load; no C compilation, app launch or visual analysis.',
		}
		writeFileSync(join(work, 'doctor-macos-real.json'), JSON.stringify(record, null, 2) + '\n')
	},
)
