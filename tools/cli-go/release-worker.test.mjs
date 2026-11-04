import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { spawnSync } from 'node:child_process'
import {
	readFileSync,
	writeFileSync,
	mkdirSync,
	cpSync,
	rmSync,
	realpathSync,
	existsSync,
} from 'node:fs'

import { join, resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { scratchRun } from '../cli-nim/scratch.mjs'
const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')

const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary =
	process.env.XPLAT_GO_RELEASE_BINARY ??
	join(work, `xplat-go-${host}-cli${process.platform === 'win32' ? '.exe' : ''}`)

const build = JSON.parse(readFileSync(binary + '.json'))
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
	assert.equal(sha(readFileSync(join(root, file))), hash, file)
}

const scratch = realpathSync(scratchRun(root, 'go-release-worker'))
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }))
let sequence = 0
function put(dir, file, data) {
	const path = join(dir, file)
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(
		path,
		typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data, null, 2) + '\n',
	)
	return path
}

function pkg() {
	const dir = join(scratch, 'CLI ' + sequence++ + ' π')
	put(dir, 'package.json', { name: '@octane-xplat/cli', version: build.cliVersion })
	const exe = join(dir, 'bin/xplat.exe')
	mkdirSync(dirname(exe))
	cpSync(binary, exe)
	// Explicit inventory copies also avoid Node 24.13.1 Windows recursive cpSync's
	// observed non-ASCII destination corruption; retain the Unicode fixture.
	put(dir, 'native-worker/manifest.json', build.releaseWorker)
	for (const file of Object.keys(build.releaseWorker.files)) {
		put(dir, 'native-worker/' + file, readFileSync(join(work, 'release-worker', file)))
	}
	return { dir, exe }
}

function project() {
	const dir = join(scratch, 'app ' + sequence++ + ' π')
	put(dir, 'package.json', {
		name: 'old-app',
		private: true,
		packageManager: 'bun@1.4.4',
		dependencies: { '@octane-xplat/ui': '0.18.0' },
		devDependencies: { '@octane-xplat/cli': '0.18.0' },
	})
	return dir
}

function run(exe, dir, args = [], overlay = {}) {
	return spawnSync(exe, ['upgrade', ...args], {
		cwd: dir,
		env: { ...process.env, NODE_OPTIONS: '', NODE_PATH: '', ...overlay },
		encoding: 'utf8',
		timeout: 30000,
		maxBuffer: 16 << 20,
	})
}

function success(r) {
	assert.ifError(r.error)
	assert.equal(r.status, 0, String(r.stdout ?? '') + String(r.stderr ?? ''))
	assert.equal(r.signal, null)
}

test('release-owned worker previews and upgrades an older project without installed CLI helpers', () => {
	const { exe } = pkg(),
		dir = project(),
		before = readFileSync(join(dir, 'package.json'))
	const preview = run(exe, dir, ['--check'])
	assert.equal(preview.status, 1, preview.stdout + preview.stderr)
	assert.ok(
		preview.stdout.includes(`Xplat ${build.releaseWorker.frameworkVersion} compatibility set`),
	)
	assert.match(preview.stdout, /Alignment needed/)
	assert.deepEqual(readFileSync(join(dir, 'package.json')), before)
	success(run(exe, dir, ['--no-install']))
	const manifest = JSON.parse(readFileSync(join(dir, 'package.json')))
	assert.equal(manifest.devDependencies['@octane-xplat/cli'], 'catalog:xplat')
	assert.equal(
		manifest.workspaces.catalogs.xplat['@octane-xplat/cli'],
		build.releaseWorker.frameworkVersion,
	)
	success(run(exe, dir, ['--check']))
})

test('invoked release wins over an older or broken project worker', () => {
	const { exe } = pkg(),
		dir = project()
	put(dir, 'node_modules/@octane-xplat/cli/package.json', {
		name: '@octane-xplat/cli',
		version: '0.18.0',
		exports: { './worker': './bad.mjs' },
	})
	put(
		dir,
		'node_modules/@octane-xplat/cli/bad.mjs',
		"import{writeFileSync}from'node:fs';writeFileSync('old-worker-ran','bad');throw Error('old release')",
	)
	success(run(exe, dir, ['--no-install']))
	assert.equal(existsSync(join(dir, 'old-worker-ran')), false)
})

test('broken invoked worker metadata or bytes never fall back to a project worker', () => {
	for (const corrupt of [
		(dir) => put(dir, 'package.json', { name: '@octane-xplat/cli', version: '0.18.0' }),
		(dir) => rmSync(join(dir, 'native-worker/manifest.json')),
		(dir) =>
			writeFileSync(join(dir, 'native-worker/dist/upgrade-worker.mjs'), 'throw Error("corrupt")'),
	]) {
		const { dir: install, exe } = pkg(),
			dir = project(),
			before = readFileSync(join(dir, 'package.json'))

		corrupt(install)
		const r = run(exe, dir, ['--no-install'])
		assert.equal(r.status, 1, r.stdout + r.stderr)
		assert.deepEqual(readFileSync(join(dir, 'package.json')), before)
	}
})

test('a packaged release still needs no Node for help and schema', () => {
	const { exe } = pkg(),
		dir = project()
	success(run(exe, dir, ['--help'], { PATH: '' }))
	success(run(exe, dir, ['--schema'], { PATH: '' }))
	const result = run(exe, dir, ['--check'], { PATH: '' })
	assert.notEqual(result.status, 0)
	assert.match(result.stderr, /Node is required/)
})

test('a real install can replace invoked worker files while its staged copy completes verification', () => {
	const { dir: install, exe } = pkg(),
		dir = join(scratch, 'install target ' + sequence++ + ' π')
	put(dir, 'package.json', {
		name: 'install-target',
		private: true,
		packageManager: 'bun@1.4.4',
		scripts: { postinstall: 'node replace-worker.mjs' },
	})
	put(
		dir,
		'replace-worker.mjs',
		`import{rmSync,writeFileSync}from'node:fs';rmSync(${JSON.stringify(join(install, 'native-worker'))},{recursive:true});writeFileSync('hook-ran','yes')`,
	)
	success(run(exe, dir))
	assert.equal(readFileSync(join(dir, 'hook-ran'), 'utf8'), 'yes')
	assert.equal(existsSync(join(install, 'native-worker')), false)
})

test('the actual standalone archive upgrades without a project worker or npm launcher', () => {
	const dir = join(scratch, 'download ' + sequence++),
		app = project()
	mkdirSync(dir)
	const unpack = spawnSync('tar', ['-xzf', binary + '.tgz', '-C', dir], { encoding: 'utf8' })
	success(unpack)
	const exe = join(dir, process.platform === 'win32' ? 'xplat-go.exe' : 'xplat-go')
	success(run(exe, app, ['--no-install']))
	success(run(exe, app, ['--check']))
})

test('a real install can replace the native executable and policy before verification', () => {
	const { dir: install, exe } = pkg(),
		dir = join(scratch, 'native replacement ' + sequence++ + ' π')
	put(dir, 'package.json', {
		name: 'native-replacement',
		private: true,
		packageManager: 'bun@1.4.4',
		scripts: { postinstall: 'node replace-native.mjs' },
	})
	put(
		dir,
		'replace-native.mjs',
		`import{renameSync,writeFileSync,rmSync}from'node:fs';renameSync(${JSON.stringify(exe)},${JSON.stringify(exe + '.previous')});writeFileSync(${JSON.stringify(exe)},${JSON.stringify('replacement native image must never run\n')},{mode:0o755});rmSync(${JSON.stringify(join(install, 'native-worker'))},{recursive:true});writeFileSync('native-replaced','yes')`,
	)
	const r = run(exe, dir)
	success(r)
	assert.equal(readFileSync(join(dir, 'native-replaced'), 'utf8'), 'yes')
	assert.match(readFileSync(exe, 'utf8'), /replacement native image/)
	assert.equal(existsSync(join(install, 'native-worker')), false)
	assert.match(r.stdout, /Installed and checked the compatibility set/)
})
