import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

// Isolate the macOS leaf from the workspace package graph; its only import is
// a type-only QueryStorageAdapter that transpiles away.
const source = readFileSync(new URL('../src/data/query-storage.macos.ts', import.meta.url), 'utf8')

const compiled = ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
}).outputText

// A unique fragment per import yields a fresh module instance — the closest
// in-process stand-in for an app restart / adapter recreation.
let instances = 0
const importStorage = () =>
	import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}#${++instances}`)

test.afterEach(() => {
	delete globalThis.__xplatAppKit
})

test('AppKit query storage persists through the host defaults bridge', async () => {
	// A Map stands in for NSUserDefaults — it outlives each module instance,
	// which is what a process restart looks like to the adapter.
	const backing = new Map()
	globalThis.__xplatAppKit = {
		storageGet: (key) => backing.get(key) ?? null,
		storageSet: (key, value) => void backing.set(key, value),
		storageRemove: (key) => void backing.delete(key),
	}

	const first = (await importStorage()).platformQueryStorage
	const envelope = '{"v":1,"t":0,"d":{"name":"ada"}}'
	first.set('xplat:query:app:user', envelope)
	assert.equal(first.get('xplat:query:app:user'), envelope)

	// A recreated adapter instance reads the same durable snapshot.
	const second = (await importStorage()).platformQueryStorage
	assert.equal(second.get('xplat:query:app:user'), envelope)

	second.remove('xplat:query:app:user')
	assert.equal(second.get('xplat:query:app:user'), null)
	assert.equal(backing.has('xplat:query:app:user'), false)
})

test('AppKit query storage falls back to process memory without a bridge', async () => {
	delete globalThis.__xplatAppKit
	const storage = (await importStorage()).platformQueryStorage
	storage.set('xplat:query:app:user', '{}')
	assert.equal(storage.get('xplat:query:app:user'), '{}')
	storage.remove('xplat:query:app:user')
	assert.equal(storage.get('xplat:query:app:user'), null)
})

test('AppKit query storage keeps writes best-effort and exposes failed reads and purge', async () => {
	globalThis.__xplatAppKit = {
		storageGet: () => {
			throw new Error('defaults unavailable')
		},
		storageSet: () => {
			throw new Error('defaults unavailable')
		},
		storageRemove: () => {
			throw new Error('defaults unavailable')
		},
	}

	const storage = (await importStorage()).platformQueryStorage
	storage.set('xplat:query:app:user', '{}')
	assert.throws(() => storage.remove('xplat:query:app:user'), /AppKit query storage removal failed/)
	assert.throws(() => storage.get('xplat:query:app:user'), /AppKit query storage read failed/)
})

test('AppKit query storage never promotes pre-host memory or revives it after host loss', async () => {
	const storage = (await importStorage()).platformQueryStorage
	storage.set('record', 'old')
	globalThis.__xplatAppKit = {
		storageGet: () => null, storageSet() {}, storageRemove() {},
	}
	assert.equal(storage.get('record'), null)
	storage.remove('record')
	delete globalThis.__xplatAppKit
	assert.equal(storage.get('record'), null)
})

test('AppKit query storage isolates partial bridges and refuses an unconfirmed durable purge', async () => {
	let nativeReads = 0
	const first = { storageGet() { nativeReads++; return 'native' } }
	globalThis.__xplatAppKit = first
	const storage = (await importStorage()).platformQueryStorage
	storage.set('record', 'memory')
	assert.equal(storage.get('record'), 'memory')
	assert.equal(nativeReads, 0)
	assert.throws(() => storage.remove('record'), /incomplete bridge/)
	globalThis.__xplatAppKit = {}
	assert.equal(storage.get('record'), null)
	globalThis.__xplatAppKit = first
	assert.equal(storage.get('record'), 'memory')
})

test('AppKit query storage discards partial-cache mirrors when a complete bridge appears', async () => {
	const owner = {}
	globalThis.__xplatAppKit = owner
	const storage = (await importStorage()).platformQueryStorage
	storage.set('record', 'old')
	owner.storageGet = () => null
	owner.storageSet = () => {}
	owner.storageRemove = () => {}
	assert.equal(storage.get('record'), null)
	delete owner.storageGet
	assert.equal(storage.get('record'), null)
})

test('AppKit query storage preserves hook receivers and attempts partial removal without claiming purge', async () => {
	const owner = {
		data: new Map(),
		storageGet(key) { return this.data.get(key) ?? null },
		storageSet(key, value) { this.data.set(key, value) },
		storageRemove(key) { this.data.delete(key) },
	}
	globalThis.__xplatAppKit = owner
	const storage = (await importStorage()).platformQueryStorage
	storage.set('record', 'native')
	assert.equal(storage.get('record'), 'native')
	delete owner.storageSet
	assert.throws(() => storage.remove('record'), /incomplete bridge/)
	assert.equal(owner.data.has('record'), false)
})

test('AppKit query storage refuses a durable purge after a previously observed bridge disappears', async () => {
	globalThis.__xplatAppKit = {
		storageGet: () => 'native', storageSet() {}, storageRemove() {},
	}
	const storage = (await importStorage()).platformQueryStorage
	assert.equal(storage.get('record'), 'native')
	delete globalThis.__xplatAppKit
	assert.throws(() => storage.remove('record'), /incomplete bridge/)
})
