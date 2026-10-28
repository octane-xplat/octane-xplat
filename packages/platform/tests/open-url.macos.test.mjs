import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const requireLib = createRequire(import.meta.url)
const compiled = Object.fromEntries(await Promise.all(['open-url.macos', 'appkit-host', 'index.macos'].map(async (name) => [name,
	ts.transpile(await readFile(new URL(`../src/${name}.ts`, import.meta.url), 'utf8'), {
		module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
	}),
])))
function load(globals = {}) {
	const context = vm.createContext({ ...globals })
	const cache = new Map()
	function require(name) {
		if (name === '@octane-xplat/lib/capability') return requireLib(name)
		const key = name.replace(/^\.\//, '')
		if (!compiled[key]) return {}
		if (cache.has(key)) return cache.get(key)
		const exports = {}
		cache.set(key, exports)
		vm.runInContext(`(function(exports, require) {${compiled[key]}\n})`, context)(exports, require)
		return exports
	}
	return { context, leaf: require('./open-url.macos'), root: require('./index.macos') }
}
function fixture({ url = {}, accepted = true, fail } = {}) {
	const lookups = []
	const opens = []
	const workspace = {
		URLForApplicationWithBundleIdentifier(id) {
			lookups.push(id)
			if (fail === 'lookup') throw new Error('lookup failed')
			return url
		},
		openURL(value) {
			opens.push(value)
			if (fail === 'open') throw new Error('open failed')
			return accepted
		},
	}
	return { workspace, lookups, opens, ...load({ NSWorkspace: { sharedWorkspace: workspace } }) }
}

test('AppKit settings separate bridge support, installed-app availability and launch requests', async () => {
	const target = { kind: 'settings-application' }
	const env = fixture({ url: target })
	assert.equal(env.root.openSettings, env.leaf.openSettings)
	assert.equal(env.root.openUrl, env.leaf.openUrl)
	assert.equal(env.leaf.openSettings.supported, true)
	assert.equal(await env.leaf.openSettings.isAvailable(), true)
	assert.deepEqual(env.opens, []) // Availability never launches Settings.
	assert.equal(env.leaf.openSettings.open(), true)
	assert.deepEqual(env.lookups, ['com.apple.systempreferences', 'com.apple.systempreferences'])
	assert.equal(env.opens.length, 1)
	assert.equal(env.opens[0], target)
})

test('absent/partial/throwing native bridges are unsupported and reads remain live', async () => {
	const env = load()
	assert.equal(env.leaf.openSettings.supported, false)
	assert.equal(await env.leaf.openSettings.isAvailable(), false)
	assert.throws(() => env.leaf.openSettings.open(), { name: 'UnavailabilityError' })
	env.context.NSWorkspace = { sharedWorkspace: { openURL() {} } }
	assert.equal(env.leaf.openSettings.supported, false)
	Object.defineProperty(env.context.NSWorkspace, 'sharedWorkspace', { get() { throw new Error('unavailable') } })
	assert.equal(env.leaf.openSettings.supported, false)
	env.context.NSWorkspace = { sharedWorkspace: fixture().workspace }
	assert.equal(env.leaf.openSettings.supported, true)
	assert.equal(await env.leaf.openSettings.isAvailable(), true)
	delete env.context.NSWorkspace
	assert.equal(env.leaf.openSettings.supported, false)
})

test('missing installed settings app and native lookup failures return false without launching', async () => {
	for (const options of [{ url: null }, { fail: 'lookup' }]) {
		const env = fixture(options)
		assert.equal(env.leaf.openSettings.supported, true)
		assert.equal(await env.leaf.openSettings.isAvailable(), false)
		assert.equal(env.leaf.openSettings.open(), false)
		assert.deepEqual(env.opens, [])
	}
})

test('rejected or throwing launches return false and each open resolves a fresh app URL', () => {
	for (const options of [{ accepted: false }, { fail: 'open' }]) {
		const env = fixture(options)
		assert.equal(env.leaf.openSettings.open(), false)
		assert.equal(env.leaf.openSettings.open(), false)
		assert.equal(env.lookups.length, 2)
		assert.equal(env.opens.length, 2)
	}
})

test('outbound links still delegate to the live host independently of settings support', () => {
	const env = load()
	assert.equal(env.leaf.openUrl('https://example.test'), false)
	const links = []
	env.context.__xplatAppKit = { openUrl: (url) => { links.push(url); return true } }
	assert.equal(env.root.openUrl('https://example.test'), true)
	assert.deepEqual(links, ['https://example.test'])
	assert.equal(env.leaf.openSettings.supported, false)
	delete env.context.__xplatAppKit
	assert.equal(env.root.openUrl('https://example.test'), false)
})
