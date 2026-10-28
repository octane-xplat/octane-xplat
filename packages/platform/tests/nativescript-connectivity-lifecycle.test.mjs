import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const code = ts.transpileModule(
	readFileSync(
		process.env.WINDOWS_CONNECTIVITY_SOURCE
			? resolve(process.env.WINDOWS_CONNECTIVITY_SOURCE)
			: new URL('../src/connectivity.ts', import.meta.url),
		'utf8',
	),
	{ compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

const factoryCode = ts.transpileModule(
	readFileSync(new URL('../src/native-connectivity.ts', import.meta.url), 'utf8'),
	{ compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

function fixture() {
	const state = {
		type: 1,
		starts: 0,
		stops: 0,
		current: null,
		failRead: false,
		failStart: false,
		failStop: false,
		duringStart: null,
	}
	const Connectivity = {
		connectionType: { none: 0, wifi: 1, mobile: 2, ethernet: 3, bluetooth: 4, vpn: 5 },
		getConnectionType() {
			if (state.failRead) {
				throw new Error('read failure')
			}
			return state.type
		},
		startMonitoring(callback) {
			state.starts++
			state.current = callback
			state.duringStart?.()
			if (state.failStart) {
				throw new Error('startup failure')
			}
		},
		stopMonitoring() {
			state.stops++
			state.current = null
			if (state.failStop) {
				throw new Error('stop failure')
			}
		},
	}
	const factory = {}
	vm.runInNewContext(factoryCode, {
		exports: factory,
		require(id) {
			assert.equal(id, '@nativescript/core')
			return { Connectivity }
		},
	})
	const exports = {}
	vm.runInNewContext(code, {
		exports,
		require(id) {
			if (id === './native-connectivity') {
				return factory
			}
			assert.equal(id, '@nativescript/core')
			return { Connectivity }
		},
	})
	return {
		connectivity: exports.connectivity,
		state,
		emit(type) {
			state.type = type
			state.current?.(type)
		},
	}
}

test('native connectivity shares one monitor but repeated callback subscriptions detach independently', () => {
	const { connectivity, state, emit } = fixture()
	const values = []
	const listener = (value) => values.push(value.type)
	const first = connectivity.subscribe(listener)
	const second = connectivity.subscribe(listener)
	assert.equal(state.starts, 1)
	assert.deepEqual(values, ['wifi', 'wifi'])
	first()
	first()
	assert.equal(state.stops, 0)
	emit(0)
	assert.deepEqual(values, ['wifi', 'wifi', 'none'])
	second()
	second()
	assert.equal(state.stops, 1)
	assert.equal(state.current, null)
})

test('native connectivity removes a failed initial listener without leaking it into later events', () => {
	const { connectivity, state, emit } = fixture()
	assert.throws(
		() =>
			connectivity.subscribe(() => {
				throw new Error('initial failure')
			}),
		/initial failure/,
	)
	assert.equal(state.starts, 0)
	const values = []
	const stop = connectivity.subscribe((value) => values.push(value.online))
	assert.doesNotThrow(() => emit(0))
	assert.deepEqual(values, [true, false])
	stop()
	assert.equal(state.stops, 1)
})

test('native connectivity preserves other subscribers when a new initial callback fails', () => {
	const { connectivity, state, emit } = fixture()
	const values = []
	const stop = connectivity.subscribe((value) => values.push(value.type))
	assert.throws(
		() =>
			connectivity.subscribe(() => {
				throw new Error('new reader failed')
			}),
		/new reader failed/,
	)
	assert.equal(state.stops, 0)
	emit(3)
	assert.deepEqual(values, ['wifi', 'ethernet'])
	stop()
	assert.equal(state.stops, 1)
})

test('native connectivity rolls back partial startup and preserves the original error if rollback fails', () => {
	for (const failStop of [false, true]) {
		const { connectivity, state } = fixture()
		state.failStart = true
		state.failStop = failStop
		assert.throws(() => connectivity.subscribe(() => {}), /startup failure/)
		assert.equal(state.stops, 1)
		assert.equal(state.current, null)
		state.failStart = false
		state.failStop = false
		const stop = connectivity.subscribe(() => {})
		assert.equal(state.starts, 2)
		stop()
		assert.equal(state.stops, 2)
	}
})

test('native connectivity rolls back a failed initial read without attaching a monitor', () => {
	const { connectivity, state } = fixture()
	state.failRead = true
	assert.throws(() => connectivity.subscribe(() => {}), /read failure/)
	assert.equal(state.starts, 0)
	state.failRead = false
	const stop = connectivity.subscribe(() => {})
	stop()
	assert.equal(state.stops, 1)
})

test('native connectivity ignores retired callbacks and subscriptions added during dispatch get one initial state', () => {
	const { connectivity, state, emit } = fixture()
	const values = []
	let added
	const stop = connectivity.subscribe((value) => {
		if (!value.online && !added) {
			added = connectivity.subscribe((next) => values.push(next.type))
		}
	})
	const retired = state.current
	emit(0)
	assert.deepEqual(values, ['none'])
	stop()
	added()
	retired(1)
	assert.deepEqual(values, ['none'])
	assert.equal(state.stops, 1)
})

test('native connectivity can subscribe during native startup without starting a second monitor', () => {
	const { connectivity, state } = fixture()
	let nested
	state.duringStart = () => {
		state.duringStart = null
		nested = connectivity.subscribe(() => {})
	}
	const stop = connectivity.subscribe(() => {})
	assert.equal(state.starts, 1)
	stop()
	assert.equal(state.stops, 0)
	nested()
	assert.equal(state.stops, 1)
})
