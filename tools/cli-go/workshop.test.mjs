import assert from 'node:assert/strict'
import { after, test } from 'node:test'
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
import { join, dirname, resolve } from 'node:path'
import { spawnSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { createHash } from 'node:crypto'
import { scratchRun } from '../cli-nim/scratch.mjs'
import { projectToolFixture } from './project-fixtures.mjs'

const root = resolve(import.meta.dirname, '../..'),
	work = join(root, 'research/go-cli')
const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch === 'x64' ? 'amd64' : process.arch}`
const binary = join(work, `xplat-go-${host}-cli${process.platform === 'win32' ? '.exe' : ''}`)
const build = JSON.parse(readFileSync(binary + '.json'))
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
assert.equal(sha(readFileSync(binary)), build.sha256)
for (const [file, hash] of Object.entries(build.inputs)) {
	assert.equal(sha(readFileSync(join(root, file))), hash, file)
}
const scratch = realpathSync(scratchRun(root, 'go-workshop'))
after(() => rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }))
const tools = projectToolFixture(root, work, scratch)
let sequence = 0
function put(dir, file, content) {
	const path = join(dir, file)
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(
		path,
		typeof content === 'string' || Buffer.isBuffer(content) ? content : JSON.stringify(content),
	)
	return path
}
function link(source, destination) {
	mkdirSync(dirname(destination), { recursive: true })
	symlinkSync(realpathSync(source), destination, process.platform === 'win32' ? 'junction' : 'dir')
}
function fixture({ workshop = true } = {}) {
	const dir = join(scratch, `app ${sequence++} π`)
	put(dir, 'package.json', { name: 'workshop-consumer', type: 'module', private: true })
	for (const name of ['@octane-xplat/cli', 'vite']) {
		link(join(tools.nodeModules, name), join(dir, 'node_modules', name))
	}
	if (workshop) {
		// Stage the actual built backend beside the curated CLI: resolving from
		// the source-workspace symlink would accidentally use its full old CLI.
		const source = join(root, 'packages/workshop')
		const destination = join(dir, 'node_modules/@octane-xplat/workshop')
		put(destination, 'package.json', readFileSync(join(source, 'package.json')))
		for (const file of readdirSync(join(source, 'dist'), {
			recursive: true,
			withFileTypes: true,
		})) {
			if (file.isFile()) {
				const path = join(file.parentPath, file.name)
				put(destination, path.slice(source.length + 1), readFileSync(path))
			}
		}
		link(join(source, 'node_modules/tinyglobby'), join(dir, 'node_modules/tinyglobby'))
	}
	return dir
}
function run(dir, args, env = {}) {
	return spawnSync(binary, ['workshop', ...args], {
		cwd: dir,
		env: { ...process.env, NODE_OPTIONS: '', NODE_PATH: '', ...env },
		encoding: 'utf8',
		timeout: 30000,
	})
}
function success(result) {
	assert.ifError(result.error)
	assert.equal(result.status, 0, result.stdout + result.stderr)
}
function reference(dir, operation, json = true, target = 'web', extra = {}, baseline = false) {
	return spawnSync(
		'node',
		[
			'--input-type=module',
			'-e',
			`
import { createRequire } from 'node:module'; import { pathToFileURL } from 'node:url';
const req=createRequire(process.cwd()+'/package.json');
const entry=req.resolve('@octane-xplat/workshop/node');
const api=await import(pathToFileURL(${baseline ? "entry.slice(0, -7) + 'node-reference.js'" : 'entry'}).href);
await api[${JSON.stringify('workshop' + operation[0].toUpperCase() + operation.slice(1))}]({cwd:process.cwd(),json:${json},target:${JSON.stringify(target)},...${JSON.stringify(extra)}});`,
		],
		{
			cwd: dir,
			encoding: 'utf8',
			timeout: 30000,
			env: { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' },
		},
	)
}
const story = `throw Error('story modules must not execute');
export const Basic = defineStory({id:'counter/basic',title:'Counter / Basic',targets:['web','macos'],component: () => null});`

test('workshop schemas are native and expose partial migration truthfully', () => {
	const dir = fixture({ workshop: false })
	const result = run(dir, ['--schema'], { PATH: '' })
	success(result)
	const schema = JSON.parse(result.stdout).data.commands
	assert.deepEqual(
		schema.map((row) => [row.command, row.status]),
		[
			['workshop init', 'implemented'],
			['workshop doctor', 'implemented'],
			['workshop list', 'implemented'],
			['workshop dev', 'pending'],
		],
	)
	success(run(dir, ['list', '--help'], { PATH: '' }))
})

test('real workshop static discovery matches Node without executing story modules', () => {
	const dir = fixture()
	put(dir, 'src/counter.stories.tsrx', story)
	put(dir, 'src/mobile.stories.ios.tsrx', story.replaceAll('counter/basic', 'ios/basic'))
	for (const target of ['web', 'ios', 'macos']) {
		const actual = run(dir, ['list', '--json', '--target', target])
		const expected = reference(dir, 'list', true, target)
		success(actual)
		success(expected)
		assert.deepEqual(JSON.parse(actual.stdout), JSON.parse(expected.stdout))
		assert.equal(JSON.parse(actual.stdout).entries.length, 2)
	}
	const actual = run(dir, ['list']),
		expected = reference(dir, 'list', false)
	success(actual)
	success(expected)
	assert.equal(actual.stdout, expected.stdout)
})

test('real Vite executes project configuration, while JSON stdout stays clean', () => {
	const dir = fixture()
	put(dir, 'src/counter.stories.tsrx', story)
	put(
		dir,
		'workshop.config.ts',
		`import {writeFileSync} from 'node:fs';
console.log('config diagnostic'); writeFileSync(${JSON.stringify(join(dir, 'loaded'))}, 'yes');
export default {stories:{include:['nothing/**/*.stories.ts']}};`,
	)
	const result = run(dir, ['list', '--json'])
	success(result)
	assert.deepEqual(JSON.parse(result.stdout).entries, [])
	assert.equal(readFileSync(join(dir, 'loaded'), 'utf8'), 'yes')
	assert.match(result.stderr, /config diagnostic/)
})

test('discovery diagnostics succeed in JSON mode but fail in human mode', () => {
	const dir = fixture()
	put(
		dir,
		'bad.stories.ts',
		`export const Bad=defineStory({id: computed(),title:'Bad',component:()=>null})`,
	)
	const actual = run(dir, ['list', '--json']),
		expected = reference(dir, 'list')
	success(actual)
	success(expected)
	assert.deepEqual(JSON.parse(actual.stdout), JSON.parse(expected.stdout))
	assert.ok(JSON.parse(actual.stdout).diagnostics.length)
	const human = run(dir, ['list'])
	assert.equal(human.status, 1, human.stdout + human.stderr)
	assert.match(human.stdout, /workshop stories/)
	assert.match(human.stderr, /discovery diagnostic/)
})

test('real workshop doctor matches Node prerequisite reports without qualifying hosts', () => {
	const dir = fixture()
	const actual = run(dir, ['doctor', '--json']),
		expected = reference(dir, 'doctor')
	success(actual)
	success(expected)
	assert.deepEqual(JSON.parse(actual.stdout), JSON.parse(expected.stdout))
	assert.equal(Object.keys(JSON.parse(actual.stdout).targets).length, 6)
})

test('missing and nearer broken workshop installs fail without a global fallback', () => {
	const dir = fixture({ workshop: false })
	const missing = run(dir, ['list', '--json'], { NODE_PATH: join(root, 'node_modules') })
	assert.equal(missing.status, 1)
	assert.match(missing.stderr, /bun add -D @octane-xplat\/workshop/)
	const nested = join(dir, 'nested')
	put(nested, 'package.json', { name: 'nested', type: 'module' })
	link(join(root, 'packages/workshop'), join(dir, 'node_modules/@octane-xplat/workshop'))
	put(nested, 'node_modules/@octane-xplat/workshop/package.json', {
		name: '@octane-xplat/workshop',
		exports: { './node': './missing.js' },
	})
	const broken = run(nested, ['list', '--json'])
	assert.equal(broken.status, 1)
	assert.equal(broken.stdout, '')
	assert.match(broken.stderr, /missing\.js/)
})

test('native inspection rejects malformed responses before publishing output', () => {
	const dir = fixture({ workshop: false })
	const pkg = join(dir, 'node_modules/@octane-xplat/cli')
	rmSync(pkg)
	put(pkg, 'package.json', {
		name: '@octane-xplat/cli',
		type: 'module',
		exports: { './worker': './worker.js' },
	})
	for (const change of [
		{},
		{ version: 2 },
		{ project: '/missing' },
		{ operation: 'workshop-dev' },
		{ exitCode: null },
		{ result: null },
		{ processExit: 7 },
	]) {
		put(
			pkg,
			'worker.js',
			`import {readFileSync,writeFileSync} from 'node:fs';
const req=JSON.parse(readFileSync(process.argv[2]));
const change=${JSON.stringify(change)};
const data={version:1,project:req.project,operation:req.operation,exitCode:0,stdout:'',result:{target:req.target,entries:[],diagnostics:[]},...change};
writeFileSync(process.argv[3],JSON.stringify({protocol:req.protocol,version:req.version,id:req.id,ok:true,data,warnings:[]}));
process.exitCode=change.processExit??0;`,
		)
		const result = run(dir, ['list', '--json'])
		if (Object.keys(change).length === 0) {
			success(result)
			assert.deepEqual(JSON.parse(result.stdout), { target: 'web', entries: [], diagnostics: [] })
		} else {
			assert.equal(result.status, 1, result.stdout + result.stderr)
			if (change.processExit) {
				assert.match(result.stderr, /worker failed after writing its response/)
			}
			assert.equal(result.stdout, '')
		}
	}
})

test('a selected workshop export may not escape its installed package', () => {
	const dir = fixture({ workshop: false })
	const pkg = join(dir, 'node_modules/@octane-xplat/workshop')
	put(pkg, 'package.json', {
		name: '@octane-xplat/workshop',
		type: 'module',
		exports: { './node': './escape.js' },
	})
	const outside = put(dir, 'outside.js', `throw Error('must not import escaped entry')`)
	symlinkSync(outside, join(pkg, 'escape.js'))
	const result = run(dir, ['list', '--json'])
	assert.equal(result.status, 1)
	assert.match(result.stderr, /must remain inside/)
})

test(
	'cancellation reaps descendants started by real project configuration',
	{ skip: process.platform === 'win32' },
	async () => {
		const dir = fixture(),
			ready = join(dir, 'child-pid')
		put(
			dir,
			'workshop.config.ts',
			`import {spawn} from 'node:child_process'; import {writeFileSync} from 'node:fs';
const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"],{stdio:'ignore'});
writeFileSync(${JSON.stringify(ready)},String(child.pid)); await new Promise(()=>{}); export default {};`,
		)
		const child = spawn(binary, ['workshop', 'list', '--json'], {
			cwd: dir,
			stdio: ['ignore', 'pipe', 'pipe'],
		})
		const exited = once(child, 'exit')
		try {
			for (let i = 0; i < 200 && !existsSync(ready); i++) {
				await delay(25)
			}
			assert.ok(existsSync(ready), 'configuration worker did not start')
			const descendant = Number(readFileSync(ready, 'utf8'))
			child.kill('SIGTERM')
			const [code, signal] = await exited
			assert.equal(signal, null)
			assert.equal(code, 143)
			for (let i = 0; i < 200; i++) {
				try {
					process.kill(descendant, 0)
				} catch (error) {
					if (error.code === 'ESRCH') {
						return
					}
					throw error
				}
				await delay(25)
			}
			assert.fail('configuration descendant survived cancellation')
		} finally {
			if (child.exitCode === null && child.signalCode === null) {
				child.kill('SIGTERM')
			}
		}
	},
)

function initializedFiles(dir) {
	const paths = ['package.json', 'workshop.config.ts', 'src/workshop/counter.stories.tsrx']
	return Object.fromEntries(
		paths
			.filter((path) => existsSync(join(dir, path)))
			.map((path) => [
				path,
				{
					bytes: readFileSync(join(dir, path)).toString('base64'),
					mode: statSync(join(dir, path)).mode & 0o777,
				},
			]),
	)
}

test('workshop initialization and repeat reports match the actual Node engine', () => {
	for (const scripts of [true, false]) {
		const actual = fixture(),
			expected = fixture()
		for (let attempt = 0; attempt < 2; attempt++) {
			const a = run(actual, ['init', ...(scripts ? [] : ['--no-scripts'])]),
				b = reference(expected, 'init', false, 'web', { scripts })
			success(a)
			success(b)
			assert.equal(a.stdout, b.stdout)
			assert.deepEqual(initializedFiles(actual), initializedFiles(expected))
		}
		const manifest = JSON.parse(readFileSync(join(actual, 'package.json')))
		assert.equal(Boolean(manifest.scripts?.workshop), scripts)
	}
})

test('initialization preserves custom files, scripts, manifest data and permissions', () => {
	const a = fixture(),
		b = fixture()
	for (const dir of [a, b]) {
		put(dir, 'package.json', {
			name: 'custom',
			private: true,
			custom: { unicode: 'π', values: [1, null, false] },
			scripts: { workshop: 'my-custom-workshop', build: 'vite build' },
		})
		put(dir, 'workshop.config.ts', Buffer.from([0xff, 0x00, 0x81]))
		put(dir, 'src/workshop/counter.stories.tsrx', 'custom story\n')
		chmodSync(join(dir, 'package.json'), 0o640)
	}
	const before = initializedFiles(a),
		actual = run(a, ['init']),
		expected = reference(b, 'init', false)
	success(actual)
	success(expected)
	assert.equal(actual.stdout, expected.stdout)
	assert.deepEqual(initializedFiles(a), before)
	assert.deepEqual(initializedFiles(a), initializedFiles(b))
	const dir = fixture()
	put(dir, 'package.json', {
		name: 'new-script',
		scripts: { build: 'vite build' },
		extra: { keep: ['π', 1] },
	})
	chmodSync(join(dir, 'package.json'), 0o640)
	const mode = statSync(join(dir, 'package.json')).mode & 0o777
	success(run(dir, ['init']))
	const updated = JSON.parse(readFileSync(join(dir, 'package.json')))
	assert.deepEqual(updated.extra, { keep: ['π', 1] })
	assert.equal(updated.scripts.build, 'vite build')
	assert.equal(statSync(join(dir, 'package.json')).mode & 0o777, mode)
})

test('the shared plan is read-only and does not execute workshop configuration', () => {
	const dir = fixture()
	put(dir, 'workshop.config.ts', "throw Error('initialization must not execute config')")
	const before = initializedFiles(dir)
	const result = spawnSync(
		'node',
		[
			'--input-type=module',
			'-e',
			`
 import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
 const req=createRequire(process.cwd()+'/package.json');const api=await import(pathToFileURL(req.resolve('@octane-xplat/workshop/node')).href);
 console.log(JSON.stringify(await api.planWorkshopInit()));`,
		],
		{ cwd: dir, encoding: 'utf8', timeout: 30000 },
	)
	success(result)
	const plan = JSON.parse(result.stdout)
	assert.equal(plan.version, 1)
	assert.equal(plan.files.length, 2)
	assert.equal(plan.inputs.length, 3)
	assert.deepEqual(initializedFiles(dir), before)
	success(run(dir, ['init']))
})

test('initialization rejects aliased destinations and invalid scripts before publication', () => {
	const dir = fixture(),
		outside = join(scratch, 'outside-init')
	put(outside, 'sentinel', 'preserve')
	symlinkSync(outside, join(dir, 'src'), process.platform === 'win32' ? 'junction' : 'dir')
	const before = readFileSync(join(dir, 'package.json'))
	const result = run(dir, ['init'])
	assert.equal(result.status, 1, result.stdout + result.stderr)
	assert.equal(existsSync(join(dir, 'workshop.config.ts')), false)
	assert.equal(existsSync(join(outside, 'workshop')), false)
	assert.deepEqual(readFileSync(join(dir, 'package.json')), before)
	assert.equal(readFileSync(join(outside, 'sentinel'), 'utf8'), 'preserve')
	const invalid = fixture()
	put(invalid, 'package.json', { name: 'invalid-scripts', scripts: [] })
	const failed = run(invalid, ['init'])
	assert.equal(failed.status, 1, failed.stdout + failed.stderr)
	assert.equal(existsSync(join(invalid, 'workshop.config.ts')), false)
	assert.equal(existsSync(join(invalid, 'src')), false)
})

test('native initialization rejects malformed, stale and destructive plans with a valid control', () => {
	for (const mutation of [
		'',
		'plan.version=2',
		'plan.project="/missing"',
		'plan.inputs.pop()',
		'plan.files[0].path=req.project+"/unrelated.ts"',
		'plan.files[0].before="0".repeat(64)',
		'plan.inputs[0].mode=0',
		'plan.files[2].content=Buffer.from(JSON.stringify({name:"destroyed"})).toString("base64")',
		'writeFileSync(req.project+"/workshop.config.ts","concurrent user edit")',
	]) {
		const dir = fixture(),
			pkg = join(dir, 'node_modules/@octane-xplat/cli')
		rmSync(pkg)
		put(pkg, 'package.json', {
			name: '@octane-xplat/cli',
			type: 'module',
			exports: { './worker': './worker.js', './vite': './vite.js' },
		})
		symlinkSync(join(dirname(tools.worker), 'vite.js'), join(pkg, 'vite.js'))
		put(
			pkg,
			'worker.js',
			`import {readFileSync,writeFileSync} from 'node:fs';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
 const req=JSON.parse(readFileSync(process.argv[2]));const require=createRequire(req.project+'/package.json');
 const api=await import(pathToFileURL(require.resolve('@octane-xplat/workshop/node')).href);
 const plan=await api.planWorkshopInit({cwd:req.project,scripts:req.scripts});${mutation};
 writeFileSync(process.argv[3],JSON.stringify({protocol:req.protocol,version:req.version,id:req.id,ok:true,data:plan,warnings:[]}));`,
		)
		const before = readFileSync(join(dir, 'package.json'))
		const result = run(dir, ['init'])
		if (!mutation) {
			success(result)
			assert.ok(existsSync(join(dir, 'workshop.config.ts')))
			assert.ok(existsSync(join(dir, 'src/workshop/counter.stories.tsrx')))
		} else {
			assert.equal(result.status, 1, mutation + '\n' + result.stdout + result.stderr)
			assert.deepEqual(readFileSync(join(dir, 'package.json')), before, mutation)
			assert.equal(existsSync(join(dir, 'src')), false, mutation)
			assert.equal(existsSync(join(dir, 'unrelated.ts')), false, mutation)
			if (mutation.startsWith('writeFileSync')) {
				assert.equal(readFileSync(join(dir, 'workshop.config.ts'), 'utf8'), 'concurrent user edit')
			} else {
				assert.equal(existsSync(join(dir, 'workshop.config.ts')), false, mutation)
			}
		}
	}
})

const baselineCommit = 'cc87a5360ee2e131e53ca1df991eda57d6f13e11'
const baselineSource = spawnSync(
	'git',
	['show', baselineCommit + ':packages/workshop/src/build/node.ts'],
	{ cwd: root, encoding: 'utf8', timeout: 10000 },
)
test(
	'shared initialization policy preserves the pre-refactor Node behavior',
	{
		skip:
			baselineSource.status !== 0
				? 'original Git source unavailable in this portable snapshot'
				: false,
	},
	() => {
		const original = baselineSource.stdout
			.replace(/(from\s+['"]\.\.?\/[^'"]+)\.ts(['"])/g, '$1.js$2')
			.replace(/(import\(['"]\.\.?\/[^'"]+)\.ts(['"]\))/g, '$1.js$2')
		for (const scenario of ['fresh', 'no-scripts', 'custom', 'missing-script']) {
			const a = fixture(),
				b = fixture(),
				scripts = scenario !== 'no-scripts'
			put(b, 'node_modules/@octane-xplat/workshop/dist/build/node-reference.js', original)
			for (const dir of [a, b]) {
				if (scenario === 'custom') {
					put(dir, 'workshop.config.ts', 'custom config')
					put(dir, 'src/workshop/counter.stories.tsrx', 'custom story')
					put(dir, 'package.json', {
						name: 'custom',
						scripts: { workshop: 'custom-preview', build: 'vite build' },
						other: { keep: ['π', 1] },
					})
				}
				if (scenario === 'missing-script') {
					put(dir, 'package.json', { name: 'custom', scripts: null, other: { keep: ['π', 1] } })
					chmodSync(join(dir, 'package.json'), 0o640)
				}
			}
			for (let attempt = 0; attempt < 2; attempt++) {
				const actual = run(a, ['init', ...(scripts ? [] : ['--no-scripts'])])
				const expected = reference(b, 'init', false, 'web', { scripts }, true)
				success(actual)
				success(expected)
				assert.equal(actual.stdout, expected.stdout, scenario)
				assert.deepEqual(initializedFiles(a), initializedFiles(b), scenario)
			}
		}
	},
)
