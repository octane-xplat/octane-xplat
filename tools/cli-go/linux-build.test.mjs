import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { spawnSync, spawn } from 'node:child_process'
import {
	readFileSync,
	writeFileSync,
	mkdirSync,
	mkdtempSync,
	rmSync,
	realpathSync,
	symlinkSync,
	readdirSync,
	statSync,
	existsSync,
} from 'node:fs'

import { join, resolve, dirname } from 'node:path'
import { homedir } from 'node:os'
import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { pathToFileURL } from 'node:url'
import { projectToolFixture } from './project-fixtures.mjs'
const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')

const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `xplat-go-${host}-cli${process.platform === 'win32' ? '.exe' : ''}`)
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
const build = JSON.parse(readFileSync(binary + '.json'))
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
	assert.equal(sha(readFileSync(join(root, file))), hash, `Stale Linux build source: ${file}`)
}

const base = join(homedir(), 'agent-scratch/octane-xplat/go-cli-stoic-forge')
mkdirSync(base, { recursive: true })
const scratch = realpathSync(mkdtempSync(join(base, 'linux-build-')))
after(() => rmSync(scratch, { recursive: true, force: true }))
const tools = projectToolFixture(root, work, scratch)
const { packageLinux } = await import(
	pathToFileURL(join(dirname(tools.worker), 'linux/package.js')).href
)

const hostRoot = join(dirname(tools.worker), 'linux/host')
let sequence = 0
const posix = { skip: process.platform === 'win32' }
function put(dir, file, value) {
	const path = join(dir, file)
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value))
	return path
}

function project(runtime = 'gtk') {
	const dir = join(scratch, `app ${sequence++} π`)
	put(dir, 'package.json', {
		name: 'go-linux-build-fixture',
		private: true,
		type: 'module',
		version: '0.1.0',
		xplat: {
			targets: {
				linux: {
					runtime,
					package: {
						applicationId: 'org.octane.go-fixture',
						productName: 'Go Linux fixture',
						executableName: 'previous',
						version: '0.1.0',
						viteConfig: 'vite.linux.config.mjs',
					},
				},
			},
		},
	})
	symlinkSync(
		tools.nodeModules,
		join(dir, 'node_modules'),
		process.platform === 'win32' ? 'junction' : 'dir',
	)
	if (runtime === 'gtk') {
		put(dir, 'main.js', 'export const value=42\n')
		put(
			dir,
			'vite.linux.config.mjs',
			`export default{build:{lib:{entry:'main.js',formats:['es'],fileName:()=> 'app.js'}}}`,
		)
	} else {
		put(dir, 'index.html', '<script type="module" src="/main.js"></script>')
		put(dir, 'main.js', 'console.log(42)')
		put(dir, 'vite.linux.config.mjs', 'export default {}')
	}
	return dir
}

function run(dir, args = ['--targets', 'linux']) {
	return spawnSync(binary, ['build', ...args], {
		cwd: dir,
		encoding: 'utf8',
		timeout: 30000,
		maxBuffer: 8 << 20,
	})
}

function status(result, code) {
	assert.equal(result.status, code, result.stdout + result.stderr)
}

function files(directory) {
	const result = {}
	function visit(dir) {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const file = join(dir, entry.name)
			if (entry.isDirectory()) {
				visit(file)
			} else {
				result[file.slice(directory.length + 1).replaceAll('\\', '/')] =
					readFileSync(file).toString('base64')
			}
		}
	}
	visit(directory)
	return result
}

test('Linux schema advertises the worker and unsupported Windows host fails before outputs', () => {
	const dir = project()
	const schema = run(dir, ['--schema'])
	status(schema, 0)
	assert.equal(JSON.parse(schema.stdout).data.engines.linux, 'project-packaging-worker')
	if (process.platform === 'win32') {
		const r = run(dir)
		status(r, 1)
		assert.match(r.stderr, /POSIX build host/)
		assert.equal(existsSync(join(dir, 'dist')), false)
	}
})

for (const runtime of ['gtk', 'webkitgtk']) {
	test(
		`actual ${runtime} package matches canonical Node construction and a relocatable tar archive`,
		posix,
		async () => {
			const dir = project(runtime)
			const stage = join(dir, 'dist/linux/.xplat-linux-reference')
			mkdirSync(stage, { recursive: true })
			const canonical = await packageLinux(dir, { stagingRoot: stage, publish: false, hostRoot })
			const expected = files(canonical.appDir)
			const r = run(dir)
			status(r, 0)
			assert.match(r.stdout, /Build complete/)
			const release = join(dir, 'dist/linux'),
				app = join(release, 'previous'),
				archive = join(release, 'previous-0.1.0.tar.gz')
			assert.deepEqual(files(app), expected)
			assert.ok(statSync(join(app, 'previous')).mode & 0o111)
			const extract = join(scratch, `extracted-${sequence++}`)
			mkdirSync(extract)
			const tar = spawnSync('tar', ['-xzf', archive, '-C', extract], { encoding: 'utf8' })
			status(tar, 0)
			assert.deepEqual(files(join(extract, 'previous')), expected)
			assert.ok(statSync(join(extract, 'previous/previous')).mode & 0o111)
			const launcher = readFileSync(join(app, 'previous'), 'utf8')
			assert.doesNotMatch(launcher, new RegExp(dir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
			assert.match(launcher, /APP_DIR/)
			assert.equal(
				readdirSync(release).some(
					(name) => name.startsWith('.xplat-linux-') && name !== '.xplat-linux-reference',
				),
				false,
			)
			rmSync(stage, { recursive: true })
		},
	)
}

test(
	'failed actual compilation preserves the previous app/archive and cleans native staging',
	posix,
	() => {
		const dir = project()
		status(run(dir), 0)
		const release = join(dir, 'dist/linux'),
			before = files(join(release, 'previous')),
			archive = readFileSync(join(release, 'previous-0.1.0.tar.gz'))
		put(dir, 'main.js', 'export const = ;')
		const failure = run(dir)
		status(failure, 1)
		assert.doesNotMatch(failure.stdout, /Build complete/)
		assert.deepEqual(files(join(release, 'previous')), before)
		assert.deepEqual(readFileSync(join(release, 'previous-0.1.0.tar.gz')), archive)
		assert.equal(
			readdirSync(release).some((name) => name.startsWith('.xplat-linux-')),
			false,
		)
	},
)

test('an escaping worker plan cannot replace an existing Linux release', posix, () => {
	const dir = project()
	rmSync(join(dir, 'node_modules'))
	put(dir, 'node_modules/vite/package.json', { name: 'vite', bin: { vite: './run.mjs' } })
	put(dir, 'node_modules/vite/run.mjs', '')
	put(dir, 'node_modules/@octane-xplat/cli/package.json', {
		name: '@octane-xplat/cli',
		exports: { './worker': './run.mjs' },
	})
	put(
		dir,
		'node_modules/@octane-xplat/cli/run.mjs',
		`import{readFileSync,writeFileSync}from'node:fs';const[i,o]=process.argv.slice(2);const r=JSON.parse(readFileSync(i));writeFileSync(o,JSON.stringify({protocol:r.protocol,version:1,id:r.id,ok:true,data:{version:1,runtime:'gtk',executableName:'previous',packageVersion:'0.1.0',appDir:process.cwd(),archive:process.cwd()+'/outside.tar.gz'}}))`,
	)
	put(dir, 'dist/linux/previous/marker', 'keep')
	put(dir, 'dist/linux/previous-0.1.0.tar.gz', 'keep archive')
	const r = run(dir)
	status(r, 1)
	assert.match(r.stderr, /staging/)
	assert.equal(readFileSync(join(dir, 'dist/linux/previous/marker'), 'utf8'), 'keep')
	assert.equal(readFileSync(join(dir, 'dist/linux/previous-0.1.0.tar.gz'), 'utf8'), 'keep archive')
})

test(
	'incompatible existing archive destination is rejected before replacing the app',
	posix,
	() => {
		const dir = project()
		status(run(dir), 0)
		const release = join(dir, 'dist/linux'),
			before = files(join(release, 'previous')),
			archive = join(release, 'previous-0.1.0.tar.gz')
		rmSync(archive)
		mkdirSync(archive)
		put(archive, 'keep', 'archive directory remains')
		put(dir, 'main.js', 'export const value=43\n')
		const result = run(dir)
		status(result, 1)
		assert.match(result.stderr, /incompatible package destination/)
		assert.deepEqual(files(join(release, 'previous')), before)
		assert.equal(readFileSync(join(archive, 'keep'), 'utf8'), 'archive directory remains')
		assert.equal(
			readdirSync(release).some((name) => name.startsWith('.xplat-linux-')),
			false,
		)
	},
)

test(
	'Linux output ownership excludes a second worker and cancellation removes staging',
	posix,
	async () => {
		const dir = project()
		rmSync(join(dir, 'node_modules'))
		put(dir, 'node_modules/vite/package.json', { name: 'vite', bin: { vite: './run.mjs' } })
		put(dir, 'node_modules/vite/run.mjs', '')
		put(dir, 'node_modules/@octane-xplat/cli/package.json', {
			name: '@octane-xplat/cli',
			exports: { './worker': './run.mjs' },
		})
		put(
			dir,
			'node_modules/@octane-xplat/cli/run.mjs',
			`import{writeFileSync}from'node:fs';writeFileSync('linux-ready','ready');setInterval(()=>{},1000)`,
		)
		const child = spawn(binary, ['build', '--targets', 'linux'], {
			cwd: dir,
			stdio: ['ignore', 'pipe', 'pipe'],
		})
		child.stdout.resume()
		child.stderr.resume()
		const exited = once(child, 'close')
		const timer = setTimeout(() => child.kill('SIGTERM'), 5000)
		try {
			for (let i = 0; i < 100 && !existsSync(join(dir, 'linux-ready')); i++) {
				await new Promise((resolve) => setTimeout(resolve, 20))
			}

			assert.ok(existsSync(join(dir, 'linux-ready')))
			const second = run(dir)
			status(second, 1)
			assert.match(second.stderr, /another Go build, clean or patches apply owns/)
			child.kill('SIGTERM')
			assert.deepEqual(await exited, [143, null])
			assert.equal(
				readdirSync(join(dir, 'dist/linux')).some((name) => name.startsWith('.xplat-linux-')),
				false,
			)
		} finally {
			clearTimeout(timer)
			if (child.exitCode === null && child.signalCode === null) {
				child.kill('SIGTERM')
			}

			await exited
		}
	},
)
