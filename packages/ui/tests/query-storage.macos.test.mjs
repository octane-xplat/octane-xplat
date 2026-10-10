import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

// Isolate the macOS leaf from the workspace package graph; its only import is
// a type-only QueryStorageAdapter that transpiles away.
const source = readFileSync(new URL('../src/query-storage.macos.ts', import.meta.url), 'utf8')

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

test('AppKit query storage keeps bridge failures best-effort', async () => {
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
	storage.remove('xplat:query:app:user')
	assert.equal(storage.get('xplat:query:app:user'), null)
})
