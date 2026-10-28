import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { setImmediate } from 'node:timers/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpileModule(
	readFileSync(new URL('../src/keep-awake.windows.ts', import.meta.url), 'utf8'),
	{ compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

function fixture(options = {}) {
	const events = new Map()
	const tasks = []
	const state = {
		ui: false,
		created: 0,
		active: 0,
		released: 0,
		failConstruct: false,
		failActivate: false,
		failRelease: false,
		failDispatch: false,
		failListen: false,
	}
	const Application = {
		suspended: options.suspended ?? false,
		suspendEvent: 'suspend',
		resumeEvent: 'resume',
		exitEvent: 'exit',
		on(name, callback) {
			if (!events.has(name)) {
				events.set(name, new Set())
			}
			events.get(name).add(callback)
			if (state.failListen && name === 'resume') {
				throw new Error('app listener failed')
			}
		},
		off(name, callback) {
			events.get(name)?.delete(callback)
		},
	}
	const onUi = (callback) => {
		assert.equal(state.ui, false)
		state.ui = true
		try {
			callback()
		} finally {
			state.ui = false
		}
	}
	const Utils = {
		dispatchToMainThread(callback) {
			if (state.failDispatch) {
				throw new Error('dispatcher unavailable')
			}
			if (options.deferred) {
				tasks.push(() => onUi(callback))
			} else {
				onUi(callback)
			}
		},
	}
	class DisplayRequest {
		constructor() {
			assert.equal(state.ui, true)
			state.created++
			if (state.failConstruct) {
				throw new Error('constructor unavailable')
			}
			this.held = false
		}
		RequestActive() {
			assert.equal(state.ui, true)
			assert.equal(this.held, false)
			if (state.failActivate) {
				throw new Error('activation denied')
			}
			this.held = true
			state.active++
		}
		RequestRelease() {
			assert.equal(state.ui, true)
			assert.equal(this.held, true)
			if (state.failRelease) {
				throw new Error('release denied')
			}
			this.held = false
			state.released++
		}
	}
	const Windows = { System: { Display: { DisplayRequest } } }
	const exports = {}
	vm.runInNewContext(source, {
		exports,
		require(id) {
			if (id === '@nativescript/core') {
				return { Application, Utils }
			}
			if (id === '@octane-xplat/platform/windows') {
				return { Windows }
			}
			assert.equal(id, './keep-awake.types')
			return { KeepAwakeDefaultTag: 'KeepAwakeDefaultTag' }
		},
	})
	return {
		api: exports.keepAwake,
		state,
		Windows,
		Utils,
		events,
		tasks,
		emit(name) {
			if (name === 'suspend') {
				Application.suspended = true
			}
			if (name === 'resume') {
				Application.suspended = false
			}
			for (const callback of events.get(name) ?? []) {
				callback()
			}
		},
		get listeners() {
			return [...events.values()].reduce((n, set) => n + set.size, 0)
		},
	}
}

test('Windows tags share one UI-thread request with deduplicated default tags and independent cleanup', async () => {
	const f = fixture()
	assert.equal(await f.api.isAvailable(), true)
	assert.equal(await f.api.isActivated(), false)
	assert.equal(await f.api.activate(), true)
	assert.equal(await f.api.activate('KeepAwakeDefaultTag'), true)
	assert.equal(await f.api.activate('presentation'), true)
	assert.equal(f.state.created, 1)
	assert.equal(f.state.active, 1)
	assert.equal(f.listeners, 3)
	assert.equal(await f.api.deactivate('unknown'), true)
	assert.equal(await f.api.deactivate(), true)
	assert.equal(await f.api.isActivated(), true)
	assert.equal(f.state.released, 0)
	assert.equal(await f.api.deactivate('presentation'), true)
	assert.equal(await f.api.isActivated(), false)
	assert.equal(f.state.released, 1)
	assert.equal(f.listeners, 0)
})

test('Windows suspension releases the held request and resume reapplies remaining owners', async () => {
	const f = fixture()
	await f.api.activate('a')
	await f.api.activate('b')
	f.emit('suspend')
	assert.equal(await f.api.isActivated(), false)
	assert.equal(f.state.released, 1)
	await f.api.deactivate('a')
	assert.equal(f.listeners, 3)
	f.emit('resume')
	assert.equal(await f.api.isActivated(), true)
	assert.equal(f.state.active, 2)
	await f.api.deactivate('b')
	assert.equal(f.state.released, 2)
	assert.equal(f.listeners, 0)
})

test('Windows background activation retains a requested tag without claiming a held inhibitor', async () => {
	const f = fixture({ suspended: true })
	assert.equal(await f.api.activate('reading'), true)
	assert.equal(await f.api.isActivated(), false)
	assert.equal(f.state.created, 0)
	f.emit('resume')
	assert.equal(await f.api.isActivated(), true)
	await f.api.deactivate('reading')
	assert.equal(f.listeners, 0)
	const cancelled = fixture({ suspended: true })
	await cancelled.api.activate('reading')
	await cancelled.api.deactivate('reading')
	cancelled.emit('resume')
	assert.equal(await cancelled.api.isActivated(), false)
	assert.equal(cancelled.state.created, 0)
})

test('Windows absent/malformed projection and dispatcher failures return false and allow later retries', async () => {
	const f = fixture()
	const Constructor = f.Windows.System.Display.DisplayRequest
	f.Windows.System.Display.DisplayRequest = undefined
	assert.equal(await f.api.isAvailable(), false)
	assert.equal(await f.api.activate(), false)
	assert.equal(await f.api.deactivate(), false)
	assert.equal(f.listeners, 0)
	f.Windows.System.Display.DisplayRequest = class {}
	assert.equal(await f.api.activate(), false)
	assert.equal(f.listeners, 0)
	f.Windows.System.Display.DisplayRequest = Constructor
	f.state.failDispatch = true
	assert.equal(await f.api.activate(), false)
	assert.equal(await f.api.isActivated(), false)
	f.state.failDispatch = false
	assert.equal(await f.api.activate(), true)
	await f.api.deactivate()
})

test('Windows failed construction or activation rolls back listeners without recording a tag', async () => {
	for (const key of ['failConstruct', 'failActivate']) {
		const f = fixture()
		f.state[key] = true
		assert.equal(await f.api.activate('a'), false)
		assert.equal(await f.api.isActivated(), false)
		assert.equal(f.listeners, 0)
		f.state[key] = false
		assert.equal(await f.api.activate('a'), true)
		assert.equal(f.state.active, 1)
		await f.api.deactivate('a')
		assert.equal(f.state.released, 1)
	}
})

test('Windows release failure keeps ownership for a safe retry instead of losing the held request', async () => {
	const f = fixture()
	await f.api.activate('a')
	f.state.failRelease = true
	assert.equal(await f.api.deactivate('a'), false)
	assert.equal(await f.api.isActivated(), true)
	assert.equal(f.listeners, 3)
	assert.equal(await f.api.activate('a'), true)
	assert.equal(f.state.active, 1)
	f.state.failRelease = false
	assert.equal(await f.api.deactivate('a'), true)
	assert.equal(f.state.released, 1)
	assert.equal(f.listeners, 0)
})

test('Windows failed resume can retry the existing requested tag and background release can retry', async () => {
	const f = fixture()
	await f.api.activate('a')
	f.state.failRelease = true
	f.emit('suspend')
	assert.equal(await f.api.isActivated(), false)
	f.state.failRelease = false
	f.emit('suspend')
	await f.api.isActivated()
	assert.equal(f.state.released, 1)
	f.state.failActivate = true
	f.emit('resume')
	assert.equal(await f.api.isActivated(), false)
	f.state.failActivate = false
	assert.equal(await f.api.activate('a'), true)
	assert.equal(await f.api.isActivated(), true)
	await f.api.deactivate('a')
})

test('Windows exit releases all owners and queued resume does not reactivate after exit', async () => {
	const f = fixture()
	await f.api.activate('a')
	await f.api.activate('b')
	f.emit('suspend')
	f.emit('resume')
	f.emit('exit')
	assert.equal(await f.api.isActivated(), false)
	assert.equal(f.state.active, 1)
	assert.equal(f.state.released, 1)
	assert.equal(f.listeners, 0)
	assert.equal(await f.api.activate('after-exit'), false)
})

test('Windows ignores retired lifecycle callbacks after the final owner is removed', async () => {
	const f = fixture()
	await f.api.activate('a')
	const callbacks = [...f.events.values()].flatMap((set) => [...set])
	await f.api.deactivate('a')
	for (const callback of callbacks) {
		callback()
	}
	assert.equal(await f.api.isActivated(), false)
	assert.equal(await f.api.activate('new'), true)
	for (const callback of callbacks) {
		callback()
	}
	assert.equal(await f.api.isActivated(), true)
	await f.api.deactivate('new')
	assert.equal(f.state.active, 2)
	assert.equal(f.state.released, 2)
})

test('Windows rolls back partial app registration and can retry after failed exit release', async () => {
	const f = fixture()
	f.state.failListen = true
	assert.equal(await f.api.activate('a'), false)
	assert.equal(f.listeners, 0)
	assert.equal(f.state.created, 0)
	f.state.failListen = false
	await f.api.activate('a')
	f.state.failRelease = true
	f.emit('exit')
	assert.equal(await f.api.isActivated(), false)
	assert.equal(f.listeners, 3)
	assert.equal(await f.api.activate('b'), false)
	f.state.failRelease = false
	assert.equal(await f.api.deactivate('a'), true)
	assert.equal(f.state.released, 1)
	assert.equal(f.listeners, 0)
})

test('Windows serializes delayed UI work so a queued activation cannot outlive its cleanup', async () => {
	const f = fixture({ deferred: true })
	const first = f.api.activate('a')
	const remove = f.api.deactivate('a')
	const second = f.api.activate('b')
	for (const [active, released] of [
		[1, 0],
		[1, 1],
		[2, 1],
	]) {
		await setImmediate()
		assert.equal(f.tasks.length, 1)
		f.tasks.shift()()
		assert.equal(f.state.active, active)
		assert.equal(f.state.released, released)
	}
	assert.deepEqual(await Promise.all([first, remove, second]), [true, true, true])
	assert.equal(await f.api.isActivated(), true)
	const end = f.api.deactivate('b')
	await setImmediate()
	f.tasks.shift()()
	assert.equal(await end, true)
	assert.equal(f.listeners, 0)
	assert.equal(f.state.released, 2)
})
