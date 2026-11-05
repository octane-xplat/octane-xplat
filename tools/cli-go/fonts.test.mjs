import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import {
	mkdirSync,
	writeFileSync,
	readFileSync,
	rmSync,
	realpathSync,
	symlinkSync,
	existsSync,
} from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { spawnSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'
import { scratchRun } from './scratch.mjs'
import { projectToolFixture } from './project-fixtures.mjs'
import { fontCase, fontCases, fontTree } from './font-fixtures.mjs'
const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli'),
	host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `xplat-go-${host}-cli${process.platform === 'win32' ? '.exe' : ''}`),
	build = JSON.parse(readFileSync(binary + '.json')),
	sha = (b) => createHash('sha256').update(b).digest('hex')
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
	assert.equal(sha(readFileSync(join(root, file))), hash, file)
}
const scratch = realpathSync(scratchRun(root, 'go-fonts'))
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }))
const tools = projectToolFixture(root, work, scratch, {
	vite: false,
	packageManagement: true,
	fontConverter: true,
})
let sequence = 0
function put(dir, file, data) {
	const path = join(dir, file)
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(
		path,
		typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data),
	)
	return path
}
function fixture(id = 'ttf') {
	const dir = join(scratch, 'app ' + sequence++ + ' π')
	mkdirSync(dir)
	const data = fontCase(root, dir, id)
	const dest = join(dir, 'node_modules/@octane-xplat/cli')
	mkdirSync(dirname(dest), { recursive: true })
	symlinkSync(
		realpathSync(join(tools.nodeModules, '@octane-xplat/cli')),
		dest,
		process.platform === 'win32' ? 'junction' : 'dir',
	)
	return { dir, ...data }
}
function args(data) {
	return [
		...data.inputs,
		...Object.entries(data.options).flatMap(([key, value]) => [
			'--' + key,
			Array.isArray(value) ? value.join(',') : String(value),
		]),
	]
}
function run(dir, argv = [], env = {}) {
	return spawnSync(binary, ['fonts', ...argv], {
		cwd: dir,
		encoding: 'utf8',
		timeout: 60000,
		env: { ...process.env, NODE_OPTIONS: '', NODE_PATH: '', ...env },
		maxBuffer: 8 << 20,
	})
}
function success(r) {
	assert.ifError(r.error)
	assert.equal(r.status, 0, r.stdout + r.stderr)
	assert.equal(r.signal, null)
}
const referenceEntry = join(root, 'packages/cli/dist/fonts.js')

test('font help/schema and no-input errors remain native', () => {
	const { dir } = fixture()
	success(run(dir, ['--help'], { PATH: '' }))
	success(run(dir, ['add', '--help'], { PATH: '' }))
	const r = run(dir, ['add', '--schema'], { PATH: '' })
	success(r)
	assert.equal(JSON.parse(r.stdout).data.status, 'implemented')
	assert.notEqual(run(dir, ['add'], { PATH: '' }).status, 0)
})
test('real TTF/WOFF/WOFF2 and Fontsource registration preserves existing files', () => {
	for (const id of fontCases) {
		const data = fixture(id)
		const result = run(data.dir, ['add', ...args(data)])
		success(result)
		const manifest = JSON.parse(readFileSync(join(data.source, 'fonts/fonts.json')))
		const family = Object.values(manifest.tokens)[0].faces[0].names[0]
		assert.ok(result.stdout.includes('web ' + JSON.stringify(family)), result.stdout)
		assert.ok(Object.keys(manifest.tokens).length)
		assert.ok(existsSync(join(data.source, 'fonts.css')))
		if (id === 'woff' || id === 'woff2') {
			assert.ok(
				readFileSync(join(data.source, 'fonts', id === 'woff' ? 'geist.ttf' : 'inter.ttf')).length >
					1000,
			)
		}
		const before = fontTree(data.dir)
		success(run(data.dir, ['add', ...args(data)]))
		assert.deepEqual(fontTree(data.dir), before, id + ' idempotence')
	}
})
test(
	'native results match the actual TypeScript engine across the complete case matrix',
	{ skip: !existsSync(referenceEntry) },
	async () => {
		const { addFontInputs } = await import(pathToFileURL(referenceEntry).href)
		for (const id of fontCases) {
			const native = fixture(id),
				reference = fixture(id)
			success(run(native.dir, ['add', ...args(native)]))
			const report = await addFontInputs(reference.dir, reference.inputs, reference.options)
			assert.equal(report.error, undefined)
			assert.deepEqual(fontTree(native.dir), fontTree(reference.dir), id)
		}
	},
)
test('custom entries/font files survive and source/output aliases never publish outside the app', () => {
	for (const target of ['fonts', 'fonts.css', 'style.css', 'main.web.tsrx']) {
		const data = fixture(),
			outside = join(scratch, 'outside ' + sequence++)
		mkdirSync(outside)
		const dest = target === 'fonts' ? outside : put(outside, 'keep', 'private')
		rmSync(join(data.source, target), { recursive: true, force: true })
		symlinkSync(
			dest,
			join(data.source, target),
			process.platform === 'win32' && target === 'fonts' ? 'junction' : undefined,
		)
		const before = fontTree(outside),
			r = run(data.dir, ['add', ...args(data)])
		assert.notEqual(r.status, 0, target)
		assert.deepEqual(fontTree(outside), before)
		assert.equal(existsSync(join(data.source, 'fonts/fonts.json')), false)
	}
	const data = fixture()
	put(data.dir, 'nativescript.config.ts', "export default {appPath:'../outside'}")
	const r = run(data.dir, ['add', ...args(data)])
	assert.notEqual(r.status, 0)
})
test('invalid weights, unsupported/malicious specs and malformed fonts fail without source mutation', () => {
	for (const argv of [
		['--weights', 'NaN'],
		['--weights', 'bad'],
		['--subset', 'missing'],
	]) {
		const data = fixture(argv.includes('--subset') ? 'fontsource' : 'ttf'),
			before = fontTree(data.dir),
			r = run(data.dir, ['add', ...data.inputs, ...argv])
		assert.notEqual(r.status, 0)
		assert.deepEqual(fontTree(data.dir), before)
	}
	for (const input of [
		'@fontsource/demo&echo>font-injection.marker',
		'@fontsource/demo;bad',
		'inputs/broken.woff',
	]) {
		const data = fixture()
		put(data.dir, 'inputs/broken.woff', 'not a font')
		const before = fontTree(data.dir),
			r = run(data.dir, ['add', input, '--install'])
		assert.notEqual(r.status, 0)
		assert.deepEqual(fontTree(data.dir), before)
		assert.equal(existsSync(join(data.dir, 'font-injection.marker')), false)
	}
})
function fakeWorker(data, source) {
	const pkg = join(data.dir, 'node_modules/@octane-xplat/cli')
	rmSync(pkg, { recursive: true, force: true })
	put(pkg, 'package.json', {
		name: '@octane-xplat/cli',
		type: 'module',
		exports: { './worker': './fake.mjs' },
	})
	put(pkg, 'fake.mjs', source)
	return pkg
}
function fakePlan(data, mutation) {
	fakeWorker(
		data,
		`import{readFileSync,writeFileSync,existsSync}from'node:fs';import{join}from'node:path';import{createHash}from'node:crypto';const[input,output]=process.argv.slice(2),r=JSON.parse(readFileSync(input)),project=process.cwd(),hash=p=>existsSync(p)?createHash('sha256').update(readFileSync(p)).digest('hex'):null;const paths=['package.json','nativescript.config.ts','src/fonts/fonts.json','src/fonts.css'];const data={version:1,project,plan:{version:1,project,sourceDirectory:join(project,'src'),files:[{path:join(project,'src/fonts.css'),before:null,content:Buffer.from('generated').toString('base64'),mode:420}],inputs:paths.map(p=>({path:join(project,p),before:hash(join(project,p))})),report:{copied:[],edited:[],warnings:[],installed:[],faces:[],names:{family:'x',ios:[],android:[]}}}};${mutation};writeFileSync(output,JSON.stringify({protocol:r.protocol,version:r.version,id:r.id,ok:true,data}));`,
	)
}
test('valid synthetic plans publish and forged plans cannot broaden ownership', () => {
	const valid = fixture()
	fakePlan(valid, '')
	success(run(valid.dir, ['add', ...args(valid)]))
	assert.equal(readFileSync(join(valid.source, 'fonts.css'), 'utf8'), 'generated')
	for (const mutation of [
		'delete data.project',
		"data.project=''",
		'data.plan.files.push(data.plan.files[0])',
		"data.plan.files[0].path=join(project,'package.json')",
		"data.plan.files[0].content='bad base64'",
		'data.plan.inputs=[]',
		'data.plan.files[0].mode=4095',
	]) {
		const data = fixture()
		fakePlan(data, mutation)
		const before = fontTree(data.dir),
			r = run(data.dir, ['add', ...args(data)])
		assert.notEqual(r.status, 0)
		assert.doesNotMatch(r.stderr, /SyntaxError|ReferenceError/)
		assert.deepEqual(fontTree(data.dir), before)
	}
	const stale = fixture()
	fakePlan(
		stale,
		"writeFileSync(join(project,'package.json'),readFileSync(join(project,'package.json'),'utf8')+'\\n')",
	)
	const r = run(stale.dir, ['add', ...args(stale)])
	assert.notEqual(r.status, 0)
	assert.match(r.stderr, /changed during planning/)
	assert.equal(existsSync(join(stale.source, 'fonts.css')), false)
	const data = fixture()
	put(data.dir, 'src/fonts/Geist-Variable.ttf', 'user-owned-font')
	const userBefore = fontTree(data.dir)
	assert.notEqual(run(data.dir, ['add', ...args(data)]).status, 0)
	assert.deepEqual(fontTree(data.dir), userBefore)
})
test('cancelling an unresponsive font worker cleans descendants and permits retry', async (t) => {
	const data = fixture(),
		pkg = fakeWorker(
			data,
			`import{spawn}from'node:child_process';import{writeFileSync}from'node:fs';process.on('SIGTERM',()=>{});const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"],{stdio:'ignore'});writeFileSync('pids.json',JSON.stringify([process.pid,child.pid]));setInterval(()=>{},1000)`,
		)
	const child = spawn(binary, ['fonts', 'add', ...args(data)], {
		cwd: data.dir,
		env: { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' },
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	let output = ''
	child.stdout.on('data', (b) => (output += b))
	child.stderr.on('data', (b) => (output += b))
	t.after(() => {
		if (child.exitCode === null && child.signalCode === null) {
			child.kill('SIGKILL')
		}
	})
	const deadline = Date.now() + 15000
	while (!existsSync(join(data.dir, 'pids.json')) && Date.now() < deadline) {
		await delay(25)
	}
	assert.ok(existsSync(join(data.dir, 'pids.json')), output)
	const pids = JSON.parse(readFileSync(join(data.dir, 'pids.json'))),
		closed = once(child, 'close')
	child.kill('SIGTERM')
	const [code] = await closed
	if (process.platform !== 'win32') {
		assert.equal(code, 143)
	}
	const alive = (pid) => {
		try {
			process.kill(pid, 0)
			return true
		} catch {
			return false
		}
	}
	for (const pid of pids) {
		const until = Date.now() + 6000
		while (alive(pid) && Date.now() < until) {
			await delay(25)
		}
		assert.equal(alive(pid), false, 'font descendant survived ' + pid)
	}
	assert.equal(existsSync(join(data.source, 'fonts')), false)
	rmSync(pkg, { recursive: true, force: true })
	symlinkSync(
		realpathSync(join(tools.nodeModules, '@octane-xplat/cli')),
		pkg,
		process.platform === 'win32' ? 'junction' : 'dir',
	)
	success(run(data.dir, ['add', ...args(data)]))
})

test('real Bun Fontsource installation runs in the selected app with live streams', async (t) => {
	const data = fixture(),
		packageDir = join(scratch, 'package ' + sequence++),
		name = '@fontsource/demoinstall'
	put(packageDir, 'package.json', {
		name,
		version: '1.0.0',
		license: 'OFL-1.1',
		files: ['files', 'latin-400.css'],
	})
	const { asWoff } = await import('./font-fixtures.mjs')
	put(
		packageDir,
		'files/demoinstall-latin-400-normal.woff',
		asWoff(readFileSync(join(root, 'packages/app/src/assets/fonts/Geist-Variable.ttf'))),
	)
	put(packageDir, 'latin-400.css', "@font-face {font-family: 'Demo Install';}\n")
	const pack = spawnSync('bun', ['pm', 'pack', '--ignore-scripts', '--destination', packageDir], {
		cwd: packageDir,
		encoding: 'utf8',
		timeout: 30000,
	})
	success(pack)
	const tar = readFileSync(join(packageDir, 'fontsource-demoinstall-1.0.0.tgz')),
		requests = []
	const server = createServer((req, res) => {
		requests.push(req.url)
		if (req.url === '/font.tgz') {
			res.writeHead(200, {
				'Content-Type': 'application/octet-stream',
				'Content-Length': tar.length,
			})
			res.end(tar)
			return
		}
		if (decodeURIComponent(req.url).split('?')[0] === '/' + name) {
			const origin = 'http://127.0.0.1:' + server.address().port
			res.writeHead(200, { 'Content-Type': 'application/json' })
			res.end(
				JSON.stringify({
					name,
					'dist-tags': { latest: '1.0.0' },
					versions: {
						'1.0.0': {
							name,
							version: '1.0.0',
							dist: {
								tarball: origin + '/font.tgz',
								integrity: 'sha512-' + createHash('sha512').update(tar).digest('base64'),
							},
						},
					},
				}),
			)
			return
		}
		res.writeHead(404)
		res.end('{}')
	})
	server.listen(0, '127.0.0.1')
	await once(server, 'listening')
	t.after(() => new Promise((resolve) => server.close(resolve)))
	put(data.dir, '.npmrc', '@fontsource:registry=http://127.0.0.1:' + server.address().port + '\n')
	const pkg = JSON.parse(readFileSync(join(data.dir, 'package.json'))),
		cli = tools.packages.packages.find((p) => p.name === '@octane-xplat/cli')
	pkg.devDependencies = {
		'@octane-xplat/cli': 'file:' + join(tools.archiveDirectory, cli.file).replaceAll('\\', '/'),
	}
	pkg.scripts = { postinstall: 'node hook.mjs' }
	put(data.dir, 'package.json', pkg)
	put(
		data.dir,
		'hook.mjs',
		"import{writeFileSync}from'node:fs';console.log('FONT_INSTALL_STDOUT');console.error('FONT_INSTALL_STDERR');writeFileSync('installed.marker','yes')",
	)
	const initial = spawnSync('bun', ['install', '--ignore-scripts', '--linker', 'isolated'], {
		cwd: data.dir,
		encoding: 'utf8',
		timeout: 120000,
	})
	success(initial)
	const child = spawn(binary, ['fonts', 'add', name, '--install'], {
		cwd: data.dir,
		env: { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' },
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	let stdout = '',
		stderr = ''
	child.stdout.on('data', (b) => (stdout += b))
	child.stderr.on('data', (b) => (stderr += b))
	const timer = setTimeout(() => child.kill('SIGTERM'), 60000)
	const [code, signal] = await once(child, 'close')
	clearTimeout(timer)
	assert.equal(code, 0, stdout + stderr)
	assert.equal(signal, null)
	assert.match(stdout, /FONT_INSTALL_STDOUT/)
	assert.match(stderr, /FONT_INSTALL_STDERR/)
	assert.equal(readFileSync(join(data.dir, 'installed.marker'), 'utf8'), 'yes')
	assert.ok(requests.includes('/font.tgz'), JSON.stringify(requests))
	assert.ok(existsSync(join(data.source, 'fonts/fonts.json')))
})

test('WOFF2 conversion has an explicit optional-tool prerequisite', () => {
	const other = join(scratch, 'without converter')
	mkdirSync(other)
	const minimal = projectToolFixture(root, work, other, { vite: false, packageManagement: true })
	const data = fixture('woff2'),
		pkg = join(data.dir, 'node_modules/@octane-xplat/cli')
	rmSync(pkg, { recursive: true, force: true })
	symlinkSync(
		realpathSync(join(minimal.nodeModules, '@octane-xplat/cli')),
		pkg,
		process.platform === 'win32' ? 'junction' : 'dir',
	)
	const before = fontTree(data.dir),
		r = run(data.dir, ['add', ...args(data)])
	assert.notEqual(r.status, 0)
	assert.match(r.stderr, /Install wawoff2@2.0.1/)
	assert.deepEqual(fontTree(data.dir), before)
})

test('an invalid existing registration manifest is preserved rather than reset', () => {
	const data = fixture()
	put(data.dir, 'src/fonts/fonts.json', '{ user-edit-not-finished')
	const before = fontTree(data.dir),
		r = run(data.dir, ['add', ...args(data)])
	assert.notEqual(r.status, 0)
	assert.match(r.stderr, /font manifest/)
	assert.deepEqual(fontTree(data.dir), before)
})

test('registered font replacement refreshes bytes and managed family metadata', () => {
	const replacement = fixture('woff2')
	success(run(replacement.dir, ['add', ...args(replacement)]))
	const next = readFileSync(join(replacement.source, 'fonts/inter.ttf')),
		expected = JSON.parse(readFileSync(join(replacement.source, 'fonts/fonts.json'))).tokens.sans
			.faces[0]
	const data = fixture()
	success(run(data.dir, ['add', ...args(data)]))
	success(run(data.dir, ['add', ...args(data), '--token', 'mono']))
	put(data.dir, 'inputs/Geist-Variable.ttf', next)
	success(run(data.dir, ['add', ...args(data)]))
	assert.deepEqual(readFileSync(join(data.source, 'fonts/Geist-Variable.ttf')), next)
	const registered = JSON.parse(readFileSync(join(data.source, 'fonts/fonts.json'))).tokens.sans
		.faces
	assert.equal(registered.length, 1)
	assert.equal(registered[0].names[0], expected.names[0])
	assert.equal(registered[0].names[1], expected.names[1])
	const mono = JSON.parse(readFileSync(join(data.source, 'fonts/fonts.json'))).tokens.mono.faces
	assert.equal(mono[0].names[0], expected.names[0])
	assert.ok(
		readFileSync(join(data.source, 'style.css'), 'utf8')
			.split('/* xplat-fonts:mono:start */')[1]
			.includes(expected.names[0]),
	)
	assert.ok(
		readFileSync(join(data.source, 'fonts.css'), 'utf8').includes(
			"font-family: '" + expected.names[0] + "'",
		),
	)
	const before = fontTree(data.dir)
	success(run(data.dir, ['add', ...args(data)]))
	assert.deepEqual(fontTree(data.dir), before)
})

test('different local fonts with the same destination name fail without publication', () => {
	const other = fixture('woff2')
	success(run(other.dir, ['add', ...args(other)]))
	const data = fixture(),
		second = put(
			data.dir,
			'more/Geist-Variable.ttf',
			readFileSync(join(other.source, 'fonts/inter.ttf')),
		),
		before = fontTree(data.dir)
	const r = run(data.dir, ['add', ...data.inputs, second, '--token', 'none'])
	assert.notEqual(r.status, 0)
	assert.match(r.stderr, /Conflicting font inputs/)
	assert.deepEqual(fontTree(data.dir), before)
})

test('a custom unchanged web face remains intact on repeat registration', () => {
	const data = fixture()
	success(run(data.dir, ['add', ...args(data)]))
	const path = join(data.source, 'fonts.css'),
		custom = readFileSync(path, 'utf8').replace('font-display: swap;', 'font-display: block;')
	writeFileSync(path, custom)
	success(run(data.dir, ['add', ...args(data)]))
	assert.equal(readFileSync(path, 'utf8'), custom)
})
