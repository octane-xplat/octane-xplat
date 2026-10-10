import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpile(
	await readFile(new URL('../src/connectivity.macos.ts', import.meta.url), 'utf8'),
	{ module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
)

const sample = (online = true, type = 'wifi') => ({ supported: true, online, type })
const unavailable = { supported: false, online: false, type: 'unknown' }
const plain = (value) => JSON.parse(JSON.stringify(value))
function load({ available = true, start = true, fail } = {}) {
	const monitors = []
	let state = sample()
	const native = {
		readState() {
			if (fail === 'read') {
				throw Error('read failed')
			}

			return JSON.stringify(state)
		},
		new() {
			if (fail === 'create') {
				throw Error('create failed')
			}

			const monitor = {
				stops: 0,
				start(callback) {
					this.callback = callback
					if (fail === 'start') {
						throw Error('start failed')
					}

					return start
				},
				stop() {
					this.stops++
				},
			}

			monitors.push(monitor)
			return monitor
		},
	}

	const context = { exports: {} }
	if (available) {
		context.XplatConnectivity = native
	}

	vm.runInNewContext(source, context)
	return {
		api: context.exports.connectivity,
		monitors,
		set: (value) => {
			state = value
		},
	}
}

test('macOS reads real bridge state and does not fabricate support or online status', () => {
	const h = load()
	for (const state of [
		sample(),
		sample(false, 'none'),
		sample(true, 'ethernet'),
		sample(true, 'mobile'),
		sample(true, 'unknown'),
		unavailable,
	]) {
		h.set(state)
		assert.deepEqual(plain(h.api.getState()), state)
	}

	for (const options of [{ available: false }, { fail: 'read' }]) {
		assert.deepEqual(plain(load(options).api.getState()), unavailable)
	}

	h.set({ online: true, type: 'wifi' })
	assert.deepEqual(plain(h.api.getState()), unavailable)
})

test('macOS shares monitoring, notifies initially, cancels the last subscriber, and rejects stale callbacks', () => {
	const h = load()
	const received = []
	const callback = (state) => received.push(plain(state))
	const first = h.api.subscribe(callback)
	const second = h.api.subscribe(callback)
	assert.equal(h.monitors.length, 1)
	assert.equal(received.length, 2)
	h.monitors[0].callback(JSON.stringify(sample(false, 'none')))
	assert.deepEqual(received.slice(2), [sample(false, 'none'), sample(false, 'none')])
	first()
	first()
	assert.equal(h.monitors[0].stops, 0)
	h.monitors[0].callback(JSON.stringify(sample(true, 'ethernet')))
	assert.equal(received.length, 5)
	second()
	assert.equal(h.monitors[0].stops, 1)
	const third = h.api.subscribe(callback)
	assert.equal(h.monitors.length, 2)
	h.monitors[0].callback(JSON.stringify(sample()))
	assert.equal(received.length, 6)
	h.monitors[1].callback('bad json')
	assert.deepEqual(received.at(-1), unavailable)
	third()
	assert.equal(h.monitors[1].stops, 1)
})

test('missing bridge and failed creation/start notify unsupported and permit cleanup and retry', () => {
	for (const options of [
		{ available: false },
		{ start: false },
		{ fail: 'create' },
		{ fail: 'start' },
	]) {
		const h = load(options)
		const received = []
		const stop = h.api.subscribe((state) => received.push(plain(state)))
		assert.deepEqual(received, [unavailable])
		stop()
		stop()
		assert.doesNotThrow(() => h.api.subscribe(() => {})())
	}
})

test('a throwing initial listener does not leak a monitor', () => {
	const h = load()
	assert.throws(
		() =>
			h.api.subscribe(() => {
				throw Error('listener failed')
			}),
		/listener failed/,
	)

	assert.equal(h.monitors[0].stops, 1)
	const stop = h.api.subscribe(() => {})
	assert.equal(h.monitors.length, 2)
	stop()
})
