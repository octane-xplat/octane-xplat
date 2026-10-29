import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

// Future source-model execution only: these fakes never change OS power policy.
const compiled = Object.fromEntries(await Promise.all([
	'keep-awake.types.ts', 'keep-awake-tags.ts', 'keep-awake.macos.ts', 'use-keep-awake.macos.tsrx',
].map(async (file) => [file, ts.transpile(await readFile(new URL(`../src/${file}`, import.meta.url), 'utf8'), {
	module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
})])))

function load(globals = {}) {
	const cache = {}, context = vm.createContext({ ...globals })
	function require(name) {
		const file = `${name.slice(2)}.ts`
		if (!cache[file]) {
			const exports = cache[file] = {}
			vm.runInContext(`(function(exports, require) {${compiled[file]}\n})`, context)(exports, require)
		}
		return cache[file]
	}
	return { api: require('./keep-awake.macos').keepAwake, context }
}

function processOwner() {
	const begun = [], ended = []
	const owner = {
		beginActivityWithOptionsReason(options, reason) {
			assert.equal(this, owner)
			assert.equal(options, 2 ** 40 + 0x00efffff)
			const token = { reason }
			begun.push(token)
			return token
		},
		endActivity(token) { assert.equal(this, owner); ended.push(token) },
	}
	return { owner, begun, ended }
}

test('AppKit availability checks both methods without allocating and recognizes late bridges', async () => {
	const h = load(), native = processOwner()
	for (const bridge of [undefined, null, {}, { processInfo: {} }, { processInfo: {
		beginActivityWithOptionsReason: native.owner.beginActivityWithOptionsReason,
	} }]) {
		h.context.NSProcessInfo = bridge
		assert.equal(await h.api.isAvailable(), false)
		assert.equal(await h.api.activate('reading'), false)
	}
	h.context.NSProcessInfo = { processInfo: native.owner }
	assert.equal(await h.api.isAvailable(), true)
	assert.equal(native.begun.length, 0)
	assert.equal(await h.api.activate('reading'), true)
	assert.equal(await h.api.deactivate('reading'), true)
})

test('AppKit release retains the creating receiver and method across replacement and host loss', async () => {
	const first = processOwner(), next = processOwner()
	const h = load({ NSProcessInfo: { processInfo: first.owner } })
	assert.equal(await h.api.activate('first'), true)
	first.owner.endActivity = () => { throw new Error('replacement method must not run') }
	h.context.NSProcessInfo = { processInfo: next.owner }
	assert.equal(await h.api.activate('next'), true)
	assert.equal(await h.api.deactivate('first'), true)
	assert.deepEqual(first.ended, first.begun)
	assert.equal(next.ended.length, 0)
	delete h.context.NSProcessInfo
	assert.equal(await h.api.isAvailable(), false)
	assert.equal(await h.api.isActivated(), true)
	assert.equal(await h.api.deactivate('next'), true)
	assert.deepEqual(next.ended, next.begun)
	assert.equal(await h.api.isActivated(), false)
})

test('AppKit failed release retains its token for retry without reallocating a duplicate tag', async () => {
	const native = processOwner()
	let failing = true, attempts = 0
	native.owner.endActivity = function(token) {
		assert.equal(this, native.owner)
		attempts++
		if (failing) throw new Error('release unavailable')
		native.ended.push(token)
	}
	const h = load({ NSProcessInfo: { processInfo: native.owner } })
	assert.equal(await h.api.activate('reading'), true)
	assert.equal(await h.api.deactivate('reading'), false)
	assert.equal(await h.api.isActivated(), true)
	assert.equal(await h.api.activate('reading'), true)
	assert.equal(native.begun.length, 1)
	delete h.context.NSProcessInfo
	failing = false
	assert.equal(await h.api.deactivate('reading'), true)
	assert.equal(attempts, 2)
	assert.deepEqual(native.ended, native.begun)
})

test('AppKit rejected or throwing activation leaves no held tag and can retry', async () => {
	for (const throws of [false, true]) {
		const native = processOwner(), begin = native.owner.beginActivityWithOptionsReason
		native.owner.beginActivityWithOptionsReason = () => {
			if (throws) throw new Error('activity unavailable')
			return null
		}
		const h = load({ NSProcessInfo: { processInfo: native.owner } })
		assert.equal(await h.api.activate('reading'), false)
		assert.equal(await h.api.isActivated(), false)
		native.owner.beginActivityWithOptionsReason = begin
		assert.equal(await h.api.activate('reading'), true)
		assert.equal(await h.api.deactivate('reading'), true)
		assert.equal(native.begun.length, 1)
	}
})

function hook({ removeThrows = false, deactivate = async () => true } = {}) {
	const calls = [], listeners = [], warnings = []
	const optionsRef = { current: undefined }, exports = {}
	let pending, mounted
	vm.runInNewContext(compiled['use-keep-awake.macos.tsrx'], {
		exports, console: { warn: (message) => warnings.push(message) },
		require(name) {
			if (name === 'octane') return {
				useId: () => 'generated', useRef: () => optionsRef,
				useEffect: (run, dependencies) => { pending = { run, dependencies: [...dependencies] } },
			}
			return { keepAwake: {
				activate: async (tag) => { calls.push(['activate', tag]); return true },
				deactivate: (tag) => { calls.push(['deactivate', tag]); return deactivate(tag) },
				onRelease(listener) {
					listeners.push(listener)
					return () => {
						calls.push(['remove'])
						if (removeThrows) throw new Error('listener cleanup failed')
					}
				},
			} }
		},
	})
	return {
		calls, listeners, warnings,
		render: (tag, options) => exports.useKeepAwake(tag, options),
		commit() {
			if (mounted && pending.dependencies.every((value, i) => value === mounted.dependencies[i])) return
			mounted?.cleanup()
			mounted = { dependencies: pending.dependencies, cleanup: pending.run() }
		},
		cleanup: () => mounted.cleanup(),
	}
}

test('AppKit hook updates callbacks and warning preferences without cycling its tag', async () => {
	const h = hook({ deactivate: async () => false }), released = []
	h.render(undefined, { onRelease: () => released.push('old') }); h.commit()
	h.render(undefined, { onRelease: () => released.push('current'), suppressDeactivateWarnings: true }); h.commit()
	h.listeners[0]('another')
	h.listeners[0]('generated')
	assert.deepEqual(released, ['current'])
	assert.deepEqual(h.calls, [['activate', 'generated']])
	h.cleanup(); h.cleanup()
	h.listeners[0]('generated')
	await Promise.resolve()
	assert.deepEqual(released, ['current'])
	assert.deepEqual(h.calls, [['activate', 'generated'], ['remove'], ['deactivate', 'generated']])
	assert.equal(h.warnings.length, 0)
})

test('AppKit hook retires old callbacks and releases once before acquiring a different tag', () => {
	const h = hook(), released = []
	h.render('first', { onRelease: (tag) => released.push(tag) }); h.commit()
	h.render('next', { onRelease: (tag) => released.push(tag) }); h.commit()
	h.listeners[0]('first')
	h.listeners[1]('next')
	assert.deepEqual(released, ['next'])
	assert.deepEqual(h.calls, [['activate', 'first'], ['remove'], ['deactivate', 'first'], ['activate', 'next']])
	h.cleanup()
})

test('AppKit hook releases despite listener cleanup failure and handles rejected deactivation', async () => {
	const h = hook({ removeThrows: true, deactivate: async () => { throw new Error('release failed') } })
	h.render('reading', {}); h.commit()
	assert.throws(h.cleanup, /listener cleanup failed/)
	assert.doesNotThrow(h.cleanup)
	await Promise.resolve()
	assert.deepEqual(h.calls, [['activate', 'reading'], ['remove'], ['deactivate', 'reading']])
	assert.deepEqual(h.warnings, ['[octane-xplat] Could not deactivate keep-awake.'])
})
