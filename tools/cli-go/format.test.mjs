import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
	readFileSync,
	writeFileSync,
	mkdirSync,
	mkdtempSync,
	rmSync,
	realpathSync,
	symlinkSync,
	statSync,
	chmodSync,
	readdirSync,
} from 'node:fs'

import { join, resolve, dirname } from 'node:path'
import { homedir } from 'node:os'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { once } from 'node:events'
import { projectToolFixture } from './project-fixtures.mjs'

const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')

const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `xplat-go-${host}-cli${process.platform === 'win32' ? '.exe' : ''}`)
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
const build = JSON.parse(readFileSync(binary + '.json'))
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
	assert.equal(sha(readFileSync(join(root, file))), hash, `Stale format source: ${file}`)
}

const base = join(homedir(), 'agent-scratch/octane-xplat/go-cli-stoic-forge')
mkdirSync(base, { recursive: true })
const scratch = realpathSync(mkdtempSync(join(base, 'format-')))
after(() => rmSync(scratch, { recursive: true, force: true }))
const tools = projectToolFixture(root, work, scratch, { vite: false, formatter: true })
const { planFormat } = await import(pathToFileURL(join(dirname(tools.worker), 'fmt-plan.js')).href)
const req = createRequire(join(tools.nodeModules, '../package.json'))
const { createFormatter } = await import(pathToFileURL(req.resolve('@octane-xplat/fmt')).href)
let next = 0
const messy = 'if (a) b()\nconst x = 1\n'
function put(dir, path, value) {
	const file = join(dir, path)
	mkdirSync(dirname(file), { recursive: true })
	writeFileSync(
		file,
		typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value),
	)
	return file
}

function project(files = {}, fake) {
	const dir = join(scratch, `project ${next++} π`)
	put(dir, 'package.json', { private: true, type: 'module' })
	for (const [path, bytes] of Object.entries(files)) {
		put(dir, path, bytes)
	}
	if (fake) {
		put(dir, 'node_modules/@octane-xplat/cli/package.json', {
			name: '@octane-xplat/cli',
			exports: { './worker': './worker.mjs' },
		})

		put(
			dir,
			'node_modules/@octane-xplat/cli/worker.mjs',
			`import{readFileSync,writeFileSync,statSync}from'node:fs';import{join}from'node:path';const[input,output]=process.argv.slice(2);const request=JSON.parse(readFileSync(input));${fake}`,
		)
	} else {
		symlinkSync(
			tools.nodeModules,
			join(dir, 'node_modules'),
			process.platform === 'win32' ? 'junction' : 'dir',
		)
	}
	return dir
}

function run(dir, args = [], input, env = {}) {
	return spawnSync(binary, ['fmt', ...args], {
		cwd: dir,
		input,
		encoding: 'utf8',
		env: { ...process.env, NODE_OPTIONS: '', NODE_PATH: '', NO_COLOR: '1', ...env },
		timeout: 20000,
		maxBuffer: 24 << 20,
	})
}

async function expected(dir, inputs = [], stdin = null) {
	return planFormat(dir, inputs, stdin, () => createFormatter({ cwd: dir }))
}

function response(data) {
	return `writeFileSync(output,JSON.stringify({protocol:request.protocol,version:1,id:request.id,ok:true,data:${data}}))`
}

test('format help/schema are native and usage failures use exit 2', () => {
	const dir = project()
	for (const arg of ['--help', '--schema']) {
		const r = run(dir, [arg], undefined, { PATH: '' })
		assert.equal(r.status, 0, r.stderr)
		assert.match(r.stdout, /fmt/)
	}
	for (const args of [['--unknown'], ['--stdin-filepath'], ['--stdin-filepath', 'a.ts', 'b.ts']]) {
		assert.equal(run(dir, args).status, 2)
	}
})

test('actual formatter discovery, Git ignores and nested repository boundaries match canonical plan', async () => {
	const dir = project({
		'a.ts': messy,
		'src/b.tsrx': 'const B=()=> <view/>\n',
		'.gitignore': 'ignored.ts\n',
		'ignored.ts': messy,
		'dist/out.ts': messy,
		'nested/.git': 'gitdir: elsewhere',
		'nested/a.ts': messy,
	})
	const plan = await expected(dir)
	assert.equal(plan.diagnostics.length, 0)
	const before = readFileSync(join(dir, 'a.ts'))
	const check = run(dir, ['--check'])
	assert.equal(check.status, 1, check.stderr)
	assert.equal(check.stdout, '')
	assert.deepEqual(readFileSync(join(dir, 'a.ts')), before)
	const result = run(dir)
	assert.equal(result.status, 0, result.stderr)
	assert.equal(result.stdout, '')
	for (const entry of plan.files) {
		assert.equal(readFileSync(entry.file, 'utf8'), entry.code)
	}
	for (const file of ['ignored.ts', 'dist/out.ts', 'nested/a.ts']) {
		assert.equal(readFileSync(join(dir, file), 'utf8'), messy)
	}
	assert.equal(run(dir, ['--check']).status, 0)
})

test('multiple explicit files preserve permissions and no-op timestamps', async () => {
	const dir = project({ 'a.ts': messy, 'b.ts': messy })
	if (process.platform !== 'win32') {
		chmodSync(join(dir, 'a.ts'), 0o640)
	}
	const plan = await expected(dir, ['a.ts', 'b.ts'])
	const result = run(dir, ['a.ts', 'b.ts'])
	assert.equal(result.status, 0, result.stderr)
	for (const entry of plan.files) {
		assert.equal(readFileSync(entry.file, 'utf8'), entry.code)
	}
	if (process.platform !== 'win32') {
		assert.equal(statSync(join(dir, 'a.ts')).mode & 0o777, 0o640)
	}
	const before = statSync(join(dir, 'a.ts')).mtimeMs
	assert.equal(run(dir, ['a.ts']).status, 0)
	assert.equal(statSync(join(dir, 'a.ts')).mtimeMs, before)
})

test('stdin formatting and check have reference output/exit semantics without writes', async () => {
	const dir = project({ 'a.ts': messy })
	const plan = await expected(dir, [], { path: 'a.ts', source: messy })
	const result = run(dir, ['--stdin-filepath', 'a.ts'], messy)
	assert.equal(result.status, 0, result.stderr)
	assert.equal(result.stdout, plan.code)
	assert.equal(run(dir, ['--stdin-filepath=a.ts', '--check'], messy).status, 1)
	assert.equal(run(dir, ['--stdin-filepath=a.ts', '--check'], plan.code).status, 0)
	assert.equal(readFileSync(join(dir, 'a.ts'), 'utf8'), messy)
})

test('formatter diagnostics suppress all writes and take priority over check differences', async () => {
	const dir = project({ 'a.ts': messy, 'b.ts': 'const = ;' })
	const plan = await expected(dir)
	assert.ok(plan.diagnostics.length)
	for (const args of [[], ['--check']]) {
		const r = run(dir, args)
		assert.equal(r.status, 2, r.stderr)
		assert.equal(r.stdout, '')
		assert.equal(readFileSync(join(dir, 'a.ts'), 'utf8'), messy)
	}
})

test('formatting requires the selected installed formatter, never Vite or a global CLI fallback', () => {
	const dir = project(
		{ 'a.ts': messy },
		response('{version:1,kind:"files",diagnostics:[],files:[]}'),
	)
	const worker = join(dir, 'node_modules/@octane-xplat/cli')
	rmSync(worker, { recursive: true })
	mkdirSync(dirname(worker), { recursive: true })
	symlinkSync(
		dirname(dirname(tools.worker)),
		worker,
		process.platform === 'win32' ? 'junction' : 'dir',
	)
	const r = run(dir)
	assert.equal(r.status, 2, r.stderr)
	assert.match(r.stderr, /Install @octane-xplat\/fmt/)
	assert.equal(readFileSync(join(dir, 'a.ts'), 'utf8'), messy)
	assert.equal(
		readdirSync(join(tools.nodeModules, '.bun')).some((name) => name.startsWith('vite@')),
		false,
	)
})

test('complete malformed, duplicate and escaping format plans cannot publish an earlier valid entry', () => {
	for (const variant of ['valid', 'null', 'duplicate', 'escape', 'stale', 'mode']) {
		const code = `const file=join(process.cwd(),'a.ts');const entry={file,sourceSha256:'${sha(Buffer.from(messy))}',mode:statSync(file).mode,code:'changed\\n',changed:true};const bad=${variant === 'null' ? '{...entry,file:join(process.cwd(),"b.ts"),changed:null}' : variant === 'duplicate' ? 'entry' : variant === 'escape' ? '{...entry,file:join(process.cwd(),"../outside.ts")}' : variant === 'stale' ? '{...entry,file:join(process.cwd(),"b.ts"),sourceSha256:"0"}' : '{...entry,file:join(process.cwd(),"b.ts"),mode:entry.mode^128}'};${response('{version:1,kind:"files",diagnostics:[],files:' + (variant === 'valid' ? '[entry]' : '[entry,bad]') + '}')}`
		const dir = project({ 'a.ts': messy, 'b.ts': messy }, code)
		put(dirname(dir), 'outside.ts', messy)
		const r = run(dir)
		assert.equal(r.status, variant === 'valid' ? 0 : 2, variant + ': ' + r.stderr)
		assert.equal(readFileSync(join(dir, 'a.ts'), 'utf8'), variant === 'valid' ? 'changed\n' : messy)
	}
})

test('worker stdout remains diagnostic stderr when stdout carries formatted stdin', () => {
	const dir = project(
		{},
		`console.log('library noise');${response('{version:1,kind:"stdin",diagnostics:[],files:[],code:"formatted\\n",changed:true}')}`,
	)
	const r = run(dir, ['--stdin-filepath', 'a.ts'], 'source')
	assert.equal(r.status, 0, r.stderr)
	assert.equal(r.stdout, 'formatted\n')
	assert.match(r.stderr, /library noise/)
})

test(
	'SIGTERM cancels an idle stdin reader without waiting for EOF',
	{ skip: process.platform === 'win32' },
	async () => {
		const dir = project()
		const child = spawn(binary, ['fmt', '--stdin-filepath', 'a.ts'], {
			cwd: dir,
			stdio: ['pipe', 'pipe', 'pipe'],
		})
		const timer = setTimeout(() => child.kill('SIGKILL'), 5000)
		try {
			await new Promise((resolve) => setTimeout(resolve, 100))
			child.kill('SIGTERM')
			assert.deepEqual(await once(child, 'close'), [143, null])
		} finally {
			clearTimeout(timer)
			child.stdin.destroy()
		}
	},
)

test(
	'SIGTERM cancels formatted stdout blocked by an unread downstream pipe',
	{ skip: process.platform === 'win32' },
	async () => {
		const dir = project(
			{},
			response(
				'{version:1,kind:"stdin",diagnostics:[],files:[],code:"x".repeat(8<<20),changed:true}',
			),
		)
		const child = spawn(binary, ['fmt', '--stdin-filepath', 'a.ts'], {
			cwd: dir,
			stdio: ['pipe', 'pipe', 'pipe'],
		})
		child.stdin.end('source')
		let errors = ''
		child.stderr.on('data', (bytes) => (errors += bytes))
		const timer = setTimeout(() => child.kill('SIGKILL'), 5000)
		try {
			await new Promise((resolve) => setTimeout(resolve, 300))
			child.kill('SIGTERM')
			assert.deepEqual(await once(child, 'close'), [143, null], errors)
		} finally {
			clearTimeout(timer)
			child.stdout.destroy()
		}
	},
)

test('copied repository TypeScript and declaration sources use the actual formatter', async () => {
	const dir = project({
		'fmt-plan.ts': readFileSync(join(root, 'packages/cli/src/fmt-plan.ts')),
		'contracts.d.ts': 'export const contract:{value:string}\n',
	})
	const plan = await expected(dir)
	assert.equal(plan.diagnostics.length, 0)
	const result = run(dir)
	assert.equal(result.status, 0, result.stderr)
	for (const entry of plan.files) {
		assert.equal(readFileSync(entry.file, 'utf8'), entry.code)
	}
	assert.equal(run(dir, ['--check']).status, 0)
})

test('an explicitly selected external file authorizes only that file', async () => {
	const dir = project()
	const outside = put(scratch, `external-${next++}.ts`, messy)
	const plan = await expected(dir, [outside])
	const result = run(dir, [outside])
	assert.equal(result.status, 0, result.stderr)
	assert.equal(readFileSync(outside, 'utf8'), plan.files[0].code)
})
