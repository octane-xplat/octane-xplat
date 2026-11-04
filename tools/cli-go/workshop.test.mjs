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
function reference(dir, operation, json = true, target = 'web') {
	return spawnSync(
		'node',
		[
			'--input-type=module',
			'-e',
			`
import { createRequire } from 'node:module'; import { pathToFileURL } from 'node:url';
const req=createRequire(process.cwd()+'/package.json');
const api=await import(pathToFileURL(req.resolve('@octane-xplat/workshop/node')).href);
await api[${JSON.stringify('workshop' + operation[0].toUpperCase() + operation.slice(1))}]({cwd:process.cwd(),json:${json},target:${JSON.stringify(target)}});`,
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
			['workshop init', 'pending'],
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
