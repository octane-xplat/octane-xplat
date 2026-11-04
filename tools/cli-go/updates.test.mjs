import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import {
	readFileSync,
	writeFileSync,
	mkdirSync,
	rmSync,
	symlinkSync,
	realpathSync,
	existsSync,
	readdirSync,
	statSync,
	chmodSync,
} from 'node:fs'
import { join, dirname, resolve, relative } from 'node:path'
import { spawnSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { scratchRun } from '../cli-nim/scratch.mjs'
import { projectToolFixture } from './project-fixtures.mjs'
import { updatesHook } from '../../packages/cli/src/updates-hook.ts'

const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')
const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `xplat-go-${host}-cli${process.platform === 'win32' ? '.exe' : ''}`),
	build = JSON.parse(readFileSync(binary + '.json'))
const sha = (b) => createHash('sha256').update(b).digest('hex')
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
	assert.equal(sha(readFileSync(join(root, file))), hash, file)
}
const scratch = realpathSync(scratchRun(root, 'go-updates'))
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }))
const tools = projectToolFixture(root, work, scratch, { vite: false, packageManagement: true })
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
function install(dir) {
	for (const [name, exports] of [
		['updates', { './prepare': { require: './prepare.cjs', default: './wrong.js' } }],
		['fingerprint', './index.js'],
	]) {
		const pkg = join(dir, 'node_modules/@octane-xplat', name)
		put(pkg, 'package.json', { name: '@octane-xplat/' + name, exports })
		put(
			pkg,
			name === 'updates' ? 'prepare.cjs' : 'index.js',
			"throw Error('dependency must not execute')",
		)
	}
}
function fixture(dependencies = true) {
	const dir = join(scratch, 'app ' + sequence++ + ' π')
	put(dir, 'package.json', { name: 'updates-app', private: true })
	const dest = join(dir, 'node_modules/@octane-xplat/cli')
	mkdirSync(dirname(dest), { recursive: true })
	symlinkSync(
		realpathSync(join(tools.nodeModules, '@octane-xplat/cli')),
		dest,
		process.platform === 'win32' ? 'junction' : 'dir',
	)
	if (dependencies) {
		install(dir)
	}
	return dir
}
function run(dir, args = [], env = {}) {
	return spawnSync(binary, ['updates', ...args], {
		cwd: dir,
		env: { ...process.env, NODE_OPTIONS: '', NODE_PATH: '', ...env },
		encoding: 'utf8',
		timeout: 30000,
	})
}
function success(r) {
	assert.ifError(r.error)
	assert.equal(r.status, 0, r.stdout + r.stderr)
	assert.equal(r.signal, null)
}
function tree(dir) {
	const result = {}
	function walk(path) {
		for (const f of readdirSync(path, { withFileTypes: true })) {
			if (f.name === 'node_modules') {
				continue
			}
			const file = join(path, f.name)
			if (f.isDirectory()) {
				walk(file)
			} else if (f.isFile()) {
				result[relative(dir, file).replaceAll('\\', '/')] = sha(readFileSync(file))
			}
		}
	}
	walk(dir)
	return result
}

test('updates group help and native init schema need no Node or project', () => {
	const dir = fixture(false)
	success(run(dir, ['--help'], { PATH: '' }))
	success(run(dir, ['init', '--help'], { PATH: '' }))
	const r = run(dir, ['init', '--schema'], { PATH: '' })
	success(r)
	assert.equal(JSON.parse(r.stdout).data.status, 'implemented')
	assert.equal(run(dir).status, 1)
	assert.equal(run(dir, ['unknown']).status, 1)
})
test('native updates generates the exact reference hook and appends ignore data once', () => {
	for (const ignored of [
		'',
		'node_modules',
		'node_modules\r\n',
		' # note π\n / .xplat/\n',
		'\ufeff/.xplat/\r\n',
		'.xplat/\n',
		'  /.xplat/  \r\n',
	]) {
		const dir = fixture()
		put(dir, '.gitignore', ignored)
		const r = run(dir, ['init'])
		success(r)
		assert.match(r.stdout, /rebuild your iOS\/Android binaries/)
		const file = join(dir, 'hooks/after-prepare/xplat-updates.cjs')
		assert.equal(readFileSync(file, 'utf8'), updatesHook)
		const expected = ignored.split(/\r?\n/).some((l) => ['.xplat/', '/.xplat/'].includes(l.trim()))
			? ignored
			: ignored + (ignored && !ignored.endsWith('\n') ? '\n' : '') + '.xplat/\n'
		assert.equal(readFileSync(join(dir, '.gitignore'), 'utf8'), expected)
		const before = tree(dir),
			mtime = statSync(file).mtimeMs
		success(run(dir, ['init']))
		assert.deepEqual(tree(dir), before)
		assert.equal(statSync(file).mtimeMs, mtime)
	}
})
test('explicit app selection and workspace package resolution never execute optional modules', () => {
	const project = fixture(false)
	install(project)
	const app = join(project, 'apps/mobile')
	put(app, 'package.json', { name: 'app' })
	success(run(scratch, ['init', '--dir', app]))
	assert.equal(existsSync(join(app, 'hooks/after-prepare/xplat-updates.cjs')), true)
	assert.equal(existsSync(join(project, 'hooks')), false)
	put(app, 'node_modules/@octane-xplat/updates/package.json', {
		name: '@octane-xplat/updates',
		exports: { './prepare': './missing.cjs' },
	})
	const before = tree(app),
		r = run(scratch, ['init', '--dir', app])
	assert.notEqual(r.status, 0)
	assert.deepEqual(tree(app), before)
})
test('missing dependencies and custom hooks fail without changing the app', () => {
	for (const custom of [null, '// edited hook']) {
		const dir = fixture(custom !== null)
		if (custom) {
			put(dir, 'hooks/after-prepare/xplat-updates.cjs', custom)
		}
		const before = tree(dir),
			r = run(dir, ['init'])
		assert.notEqual(r.status, 0)
		assert.match(r.stderr, custom ? /Existing OTA hook differs/ : /Install @octane-xplat\/updates/)
		assert.deepEqual(tree(dir), before)
	}
	const dir = fixture()
	put(dir, 'hooks/after-prepare/xplat-updates.cjs', '')
	success(run(dir, ['init']))
})
test('hook and ignore aliases cannot write outside the selected app', () => {
	for (const name of ['hooks', '.gitignore']) {
		const dir = fixture(),
			outside = join(scratch, 'outside ' + sequence++)
		put(outside, 'keep', 'private')
		const dest = name === 'hooks' ? outside : put(outside, 'ignore', 'private')
		symlinkSync(
			dest,
			join(dir, name),
			process.platform === 'win32' && name === 'hooks' ? 'junction' : undefined,
		)
		const before = tree(outside),
			r = run(dir, ['init'])
		assert.notEqual(r.status, 0)
		assert.deepEqual(tree(outside), before)
		if (name === '.gitignore') {
			assert.equal(existsSync(join(dir, 'hooks')), false)
		}
	}
})
test(
	'ignore bytes and source modes survive initialization',
	{ skip: process.platform === 'win32' },
	() => {
		const dir = fixture()
		const file = put(dir, '.gitignore', Buffer.from([0xff, 10]))
		chmodSync(file, 0o640)
		success(run(dir, ['init']))
		assert.deepEqual(
			readFileSync(file),
			Buffer.concat([Buffer.from([0xff, 10]), Buffer.from('.xplat/\n')]),
		)
		assert.equal(statSync(file).mode & 0o777, 0o640)
	},
)
test('malformed worker identity/results cannot authorize publication', () => {
	for (const mutation of [
		'delete data.project',
		'data.project=null',
		"data.project=''",
		"data.project=project+'/missing'",
		'data.resolved=[]',
		'data.resolved.reverse()',
		"data.resolved[0].entry=''",
		'data.version=2',
	]) {
		const dir = fixture(),
			pkg = join(dir, 'node_modules/@octane-xplat/cli')
		rmSync(pkg, { recursive: true, force: true })
		put(pkg, 'package.json', {
			name: '@octane-xplat/cli',
			type: 'module',
			exports: { './worker': './fake.mjs' },
		})
		put(
			pkg,
			'fake.mjs',
			`import{readFileSync,writeFileSync}from'node:fs';const[input,output]=process.argv.slice(2),r=JSON.parse(readFileSync(input)),project=process.cwd();const data={version:1,project,resolved:[{specifier:'@octane-xplat/updates/prepare',entry:import.meta.filename},{specifier:'@octane-xplat/fingerprint',entry:import.meta.filename}]};${mutation};writeFileSync(output,JSON.stringify({protocol:r.protocol,version:r.version,id:r.id,ok:true,data}));`,
		)
		const before = tree(dir),
			r = run(dir, ['init'])
		assert.notEqual(r.status, 0)
		assert.doesNotMatch(r.stderr, /SyntaxError|ReferenceError/)
		assert.deepEqual(tree(dir), before)
	}
})

const referenceEntry = join(root, 'packages/cli/dist/commands/updates.js')
test(
	'native outputs match the actual built TypeScript initializer',
	{ skip: !existsSync(referenceEntry) },
	async () => {
		const { initializeUpdates } = await import(pathToFileURL(referenceEntry).href)
		for (const text of [
			'',
			'node_modules',
			'node_modules\r\n',
			'\ufeff/.xplat/\r\n',
			'  .xplat/  \n',
		]) {
			const native = fixture(),
				reference = fixture()
			put(native, '.gitignore', text)
			put(reference, '.gitignore', text)
			success(run(native, ['init']))
			await initializeUpdates(reference)
			assert.deepEqual(tree(native), tree(reference))
		}
	},
)

test('cancellation waits for blocked resolution worker descendants before returning', async (t) => {
	const dir = fixture(),
		pkg = join(dir, 'node_modules/@octane-xplat/cli')
	rmSync(pkg, { recursive: true, force: true })
	put(pkg, 'package.json', {
		name: '@octane-xplat/cli',
		type: 'module',
		exports: { './worker': './wait.mjs' },
	})
	put(
		pkg,
		'wait.mjs',
		`import{spawn}from'node:child_process';import{writeFileSync}from'node:fs';process.on('SIGTERM',()=>{});const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"],{stdio:'ignore'});writeFileSync('pids.json',JSON.stringify([process.pid,child.pid]));setInterval(()=>{},1000)`,
	)
	const child = spawn(binary, ['updates', 'init'], {
		cwd: dir,
		env: { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' },
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	let diagnostic = ''
	child.stdout.on('data', (b) => (diagnostic += b))
	child.stderr.on('data', (b) => (diagnostic += b))
	t.after(() => {
		if (child.exitCode === null && child.signalCode === null) {
			child.kill('SIGKILL')
		}
	})
	const deadline = Date.now() + 15000
	while (!existsSync(join(dir, 'pids.json')) && Date.now() < deadline) {
		await delay(25)
	}
	assert.equal(existsSync(join(dir, 'pids.json')), true, diagnostic)
	const pids = JSON.parse(readFileSync(join(dir, 'pids.json'))),
		closed = once(child, 'close')
	child.kill('SIGTERM')
	await closed
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
		assert.equal(alive(pid), false, 'resolution descendant survived ' + pid)
	}
	assert.equal(existsSync(join(dir, 'hooks')), false)
	install(dir)
	// Replace the owned fake worker with the real operation and verify recovery.
	rmSync(pkg, { recursive: true, force: true })
	symlinkSync(
		realpathSync(join(tools.nodeModules, '@octane-xplat/cli')),
		pkg,
		process.platform === 'win32' ? 'junction' : 'dir',
	)
	success(run(dir, ['init']))
})
