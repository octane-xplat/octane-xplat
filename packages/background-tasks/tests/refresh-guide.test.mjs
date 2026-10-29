import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(new URL('../examples/refresh.ts', import.meta.url), 'utf8')
const compiled = ts.transpile(source, {
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES2022,
})
function fixture({ supported = true, flush = true, registerError = false } = {}) {
	const values = new Map(),
		definitions = new Map(),
		requests = [],
		removals = []
	const service = {
		supported,
		defineTask: (name, callback) => definitions.set(name, callback),
		register: async (name, options) => {
			requests.push({ name, options })
			if (registerError) {throw new Error('provider details')}
		},
		unregister: async (name) => {
			removals.push(name)
		},
	}
	const storage = {
		getString: (key) => values.get(key) ?? null,
		setString: (key, value) => values.set(key, value),
		remove: (key) => values.delete(key),
		flush: () => flush,
	}
	const exports = {}
	vm.runInNewContext(compiled, {
		exports,
		require: (name) =>
			name === '@octane-xplat/platform' ? { storage } : { backgroundTasks: service },
	})
	return { example: exports, values, definitions, requests, removals }
}

test('module load defines the task without scheduling work or writing execution evidence', () => {
	const f = fixture()
	assert.equal(f.definitions.has('record-refresh'), true)
	f.example.requestAtNativeStartup()
	assert.equal(f.requests.length, 0)
	assert.equal(f.example.readEvidence().backgroundAt, null)
})

test('enable persists intent for a future startup, which requests at most once in this module', async () => {
	const f = fixture()
	assert.equal(f.example.enableForNextLaunch(), true)
	assert.equal(f.requests.length, 0)
	f.example.requestAtNativeStartup()
	f.example.requestAtNativeStartup()
	await new Promise((resolve) => setImmediate(resolve))
	assert.equal(f.requests.length, 1)
	assert.equal(f.requests[0].options.minimumInterval, 3600)
	assert.equal(f.example.readEvidence().backgroundAt, null)
	assert.match(f.example.readEvidence().requestStatus, /unverified/)
})

test('foreground and controlled task execution keep separate timestamp keys', async () => {
	const f = fixture()
	assert.equal(await f.example.refreshNow(), 'success')
	assert.ok(f.example.readEvidence().foregroundAt)
	assert.equal(f.example.readEvidence().backgroundAt, null)
	assert.equal(await f.definitions.get('record-refresh')({ name: 'record-refresh' }), 'success')
	assert.ok(f.example.readEvidence().backgroundAt)
})

test('failed flush reports failure, and registration failure does not become execution evidence', async () => {
	const f = fixture({ flush: false })
	assert.equal(await f.example.refreshNow(), 'failed')
	const rejected = fixture({ registerError: true })
	rejected.example.enableForNextLaunch()
	rejected.example.requestAtNativeStartup()
	await new Promise((resolve) => setImmediate(resolve))
	assert.equal(rejected.example.readEvidence().requestStatus, 'registration failed')
	assert.equal(rejected.example.readEvidence().backgroundAt, null)
})

test('disable removes durable intent and requests cancellation; unsupported targets retain foreground work', async () => {
	const f = fixture()
	f.example.enableForNextLaunch()
	await f.example.disableRefresh()
	assert.equal(f.example.readEvidence().enabledForNextLaunch, false)
	assert.deepEqual(f.removals, ['record-refresh'])
	const unsupported = fixture({ supported: false })
	unsupported.example.enableForNextLaunch()
	unsupported.example.requestAtNativeStartup()
	assert.equal(unsupported.requests.length, 0)
	assert.equal(await unsupported.example.refreshNow(), 'success')
})

test('failed preference durability still attempts cancellation and reports disable failure', async () => {
	const f = fixture({ flush: false })
	await assert.rejects(f.example.disableRefresh(), /Could not save disabled preference/)
	assert.deepEqual(f.removals, ['record-refresh'])
})
