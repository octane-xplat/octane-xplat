import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const compiled = Object.fromEntries(await Promise.all(['clipboard.macos', 'appkit-host', 'index.macos'].map(async (name) => [name,
	ts.transpile(await readFile(new URL(`../src/${name}.ts`, import.meta.url), 'utf8'), {
		module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
	}),
])))
function load() {
	const context = vm.createContext({})
	const cache = new Map()
	function require(name) {
		const key = name.replace(/^\.\//, '')
		if (!compiled[key]) return {}
		if (cache.has(key)) return cache.get(key)
		const exports = {}
		cache.set(key, exports)
		vm.runInContext(`(function(exports, require) {${compiled[key]}\n})`, context)(exports, require)
		return exports
	}
	return { context, clipboard: require('./clipboard.macos').clipboard, root: require('./index.macos') }
}

test('AppKit copy capability depends on write access independently of read access', async () => {
	const env = load()
	const writes = []
	assert.equal(env.root.clipboard, env.clipboard)
	assert.equal(env.clipboard.canCopy, false)
	assert.equal(await env.clipboard.writeText('missing'), false)
	assert.equal(await env.clipboard.readText(), null)
	env.context.__xplatAppKit = { writeClipboard: (text) => { writes.push(text); return true } }
	assert.equal(env.clipboard.canCopy, true)
	assert.equal(await env.clipboard.writeText('copy'), true)
	assert.equal(await env.clipboard.readText(), null)
	assert.deepEqual(writes, ['copy'])
	env.context.__xplatAppKit = { readClipboard: () => 'read-only' }
	assert.equal(env.clipboard.canCopy, false)
	assert.equal(await env.clipboard.readText(), 'read-only')
	assert.equal(await env.clipboard.writeText('unavailable'), false)
})

test('native failures resolve false/null for both names without rejecting callers', async () => {
	const env = load()
	assert.equal(env.clipboard.write, env.clipboard.writeText)
	assert.equal(env.clipboard.read, env.clipboard.readText)
	for (const failure of [() => { throw new Error('native failure') }, () => Promise.reject(new Error('host failure'))]) {
		env.context.__xplatAppKit = { writeClipboard: failure, readClipboard: failure }
		assert.equal(env.clipboard.canCopy, true)
		assert.equal(await env.clipboard.writeText('text'), false)
		assert.equal(await env.clipboard.write('text'), false)
		assert.equal(await env.clipboard.readText(), null)
		assert.equal(await env.clipboard.read(), null)
	}
})

test('live host replacement/removal, rejected writes and empty text retain their result shapes', async () => {
	const env = load()
	env.context.__xplatAppKit = { writeClipboard: () => false, readClipboard: () => '' }
	assert.equal(env.clipboard.canCopy, true)
	assert.equal(await env.clipboard.write('text'), false)
	assert.equal(await env.clipboard.read(), '')
	env.context.__xplatAppKit = { writeClipboard: () => true, readClipboard: () => 'replacement' }
	assert.equal(await env.root.clipboard.writeText('text'), true)
	assert.equal(await env.root.clipboard.readText(), 'replacement')
	delete env.context.__xplatAppKit
	assert.equal(env.clipboard.canCopy, false)
	assert.equal(await env.clipboard.writeText('text'), false)
	assert.equal(await env.clipboard.readText(), null)
})
