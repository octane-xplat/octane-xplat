import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpileModule(
	readFileSync(new URL('../src/useMeasure.windows.tsrx', import.meta.url), 'utf8'),
	{ compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

// Exercise the native event/timer lifecycle separately from OS layout evidence.
class View {}
function nativeView() {
	let handler = null
	return {
		subscriptions: 0,
		releases: 0,
		get LayoutUpdated() {
			return handler
		},
		set LayoutUpdated(next) {
			if (next) {
				this.subscriptions++
			} else {
				this.releases++
			}
			handler = next
		},
		layout() {
			handler?.callback()
		},
	}
}

function fixture(options) {
	let bounds = null
	const timers = new Map()
	const cleanups = []
	let nextTimer = 0
	let writes = 0
	const exports = {}
	vm.runInNewContext(source, {
		exports,
		require: (name) =>
			name === '@nativescript/core'
				? { View }
				: name === '@octane-xplat/platform/windows'
					? {
							NSWinRT: {
								asDelegate: (type, callback) => {
									assert.equal(type, 'Windows.Foundation.EventHandler`1<Object>')
									return { callback }
								},
							},
						}
					: {
							useState: () => [
								bounds,
								(next) => {
									const value = typeof next === 'function' ? next(bounds) : next
									if (value !== bounds) {
										writes++
									}
									bounds = value
								},
							],
							useRef: (current) => ({ current }),
							useCallback: (callback) => callback,
							useEffect: (effect) => cleanups.push(effect()),
						},
		setTimeout: (callback, delay) => {
			assert.equal(delay, 0)
			const token = ++nextTimer
			timers.set(token, callback)
			return token
		},
		clearTimeout: (token) => timers.delete(token),
	})
	return {
		...exports.useMeasure(options),
		additionalHook: (options) => exports.useMeasure(options),
		get bounds() {
			return bounds && JSON.parse(JSON.stringify(bounds))
		},
		get pending() {
			return timers.size
		},
		get writes() {
			return writes
		},
		flush() {
			const callbacks = [...timers.values()]
			timers.clear()
			for (const callback of callbacks) {
				callback()
			}
		},
		unmount() {
			for (const cleanup of cleanups) {
				cleanup?.()
			}
		},
	}
}

function view(parent = null) {
	const listeners = new Map()
	return Object.defineProperties(
		new View(),
		Object.getOwnPropertyDescriptors({
			parent,
			nativeViewProtected: nativeView(),
			point: { x: 50, y: 80 },
			size: { width: 0, height: 0 },
			getLocationOnScreen() {
				return this.point
			},
			getActualSize() {
				return this.size
			},
			on(name, callback) {
				if (!listeners.has(name)) {
					listeners.set(name, new Set())
				}
				listeners.get(name).add(callback)
			},
			off(name, callback) {
				listeners.get(name)?.delete(callback)
			},
			emit(name) {
				for (const callback of listeners.get(name) ?? []) {
					callback()
				}
			},
			get listeners() {
				return [...listeners.values()].reduce((n, set) => n + set.size, 0)
			},
		}),
	)
}

function assertSize(measurement, width, height) {
	assert.equal(measurement.bounds?.width, width)
	assert.equal(measurement.bounds?.height, height)
}

test('refreshes a transient zero-size attachment without a SizeChanged event', () => {
	const host = view()
	const measurement = fixture()
	measurement.ref(host)
	assertSize(measurement, 0, 0)
	host.size = { width: 400, height: 24 }
	host.nativeViewProtected.layout()
	measurement.flush()
	assertSize(measurement, 400, 24)
	measurement.unmount()
})

test('loaded coalesces one post-attach read and unchanged bounds do not rerender', () => {
	const host = view()
	const measurement = fixture()
	measurement.ref(host)
	host.emit('loaded')
	host.nativeViewProtected.layout()
	host.nativeViewProtected.layout()
	assert.equal(measurement.pending, 1)
	const writes = measurement.writes
	measurement.flush()
	assert.equal(measurement.writes, writes)
	host.size = { width: 320, height: 20 }
	host.emit('loaded')
	host.nativeViewProtected.layout()
	measurement.flush()
	assertSize(measurement, 320, 20)
	measurement.unmount()
})

test('rebind cancels the previous host read and releases all ancestor listeners', () => {
	const parent = view()
	const previous = view(parent)
	const current = view()
	current.size = { width: 200, height: 30 }
	const measurement = fixture()
	measurement.ref(previous)
	measurement.ref(current)
	assert.equal(previous.listeners, 0)
	assert.equal(parent.listeners, 0)
	assert.equal(measurement.pending, 0)
	current.nativeViewProtected.layout()
	previous.size = { width: 900, height: 900 }
	previous.emit('loaded')
	measurement.flush()
	assertSize(measurement, 200, 30)
	measurement.unmount()
})

test('null refs and unmount cancel pending reads and subscriptions', () => {
	for (const detach of ['ref', 'unmount']) {
		const host = view(view())
		const measurement = fixture()
		measurement.ref(host)
		host.nativeViewProtected.layout()
		assert.equal(measurement.pending, 1)
		if (detach === 'ref') {
			measurement.ref(null)
		} else {
			measurement.unmount()
		}

		assert.equal(host.listeners, 0)
		assert.equal(host.parent.listeners, 0)
		assert.equal(measurement.pending, 0)
		if (detach === 'ref') {
			assert.equal(measurement.bounds, null)
		}

		measurement.flush()
	}
})

test('layout and ancestor scrolling retain app-surface DIP coordinates', () => {
	const surface = view()
	surface.point = { x: 40, y: 60 }
	const host = view(surface)
	host.size = { width: 400, height: 24 }
	const measurement = fixture()
	measurement.ref(host)
	measurement.flush()
	assert.deepEqual(measurement.bounds, { x: 10, y: 20, width: 400, height: 24 })
	host.point = { x: 50, y: 72 }
	surface.emit('scroll')
	assert.equal(measurement.bounds.y, 12)
	host.size = { width: 250, height: 24 }
	host.emit('layoutChanged')
	assertSize(measurement, 250, 24)
	measurement.unmount()
})

test('observe false still measures after attachment without subscribing to layout or scrolling', () => {
	const parent = view()
	const host = view(parent)
	const measurement = fixture({ observe: false })
	measurement.ref(host)
	assert.equal(parent.listeners, 0)
	assert.equal(host.listeners, 2)
	host.size = { width: 400, height: 24 }
	host.nativeViewProtected.layout()
	measurement.flush()
	assertSize(measurement, 400, 24)
	host.size = { width: 500, height: 24 }
	host.emit('layoutChanged')
	assertSize(measurement, 400, 24)
	measurement.unmount()
})

test('multiple readers share one native delegate and release only the last subscription', () => {
	const host = view()
	const first = fixture()
	const second = first.additionalHook()
	first.ref(host)
	second.ref(host)
	assert.equal(host.nativeViewProtected.subscriptions, 1)
	first.ref(null)
	assert.notEqual(host.nativeViewProtected.LayoutUpdated, null)
	second.ref(null)
	assert.equal(host.nativeViewProtected.LayoutUpdated, null)
	assert.equal(host.nativeViewProtected.releases, 1)
	assert.equal(host.listeners, 0)
	first.unmount()
})

test('native replacement on load releases the old delegate and observes the new native view', () => {
	const host = view()
	const measurement = fixture()
	measurement.ref(host)
	const previous = host.nativeViewProtected
	host.nativeViewProtected = nativeView()
	host.emit('loaded')
	assert.equal(previous.LayoutUpdated, null)
	assert.equal(host.nativeViewProtected.subscriptions, 1)
	host.size = { width: 300, height: 24 }
	host.nativeViewProtected.layout()
	measurement.flush()
	assertSize(measurement, 300, 24)
	measurement.unmount()
	assert.equal(host.nativeViewProtected.LayoutUpdated, null)
})

test('native layout notifications defer state writes and one-shot observation detaches', () => {
	const host = view()
	const measurement = fixture({ observe: false })
	measurement.ref(host)
	host.size = { width: 400, height: 24 }
	host.nativeViewProtected.layout()
	assertSize(measurement, 0, 0)
	assert.equal(host.nativeViewProtected.LayoutUpdated, null)
	measurement.flush()
	assertSize(measurement, 400, 24)
	host.size = { width: 500, height: 24 }
	host.nativeViewProtected.layout()
	assert.equal(measurement.pending, 0)
	measurement.unmount()
})

test('an unmanaged native handler is preserved and failed subscription releases listeners', () => {
	const host = view()
	const foreign = { callback: () => {} }
	host.nativeViewProtected.LayoutUpdated = foreign
	const measurement = fixture()
	assert.throws(() => measurement.ref(host), /requires ownership/)
	assert.equal(host.nativeViewProtected.LayoutUpdated, foreign)
	assert.equal(host.listeners, 0)
	measurement.unmount()
})

test('cleanup preserves a native handler installed later by another owner', () => {
	const host = view()
	const measurement = fixture()
	measurement.ref(host)
	const foreign = { callback: () => {} }
	host.nativeViewProtected.LayoutUpdated = foreign
	measurement.unmount()
	assert.equal(host.nativeViewProtected.LayoutUpdated, foreign)
	assert.equal(host.listeners, 0)
})

test('same-size reattachment keeps prior bounds until native layout finishes', () => {
	const host = view()
	host.size = { width: 400, height: 24 }
	const measurement = fixture()
	measurement.ref(host)
	host.nativeViewProtected.layout()
	measurement.flush()
	assertSize(measurement, 400, 24)

	// NativeScript load precedes the reused native view's arrange. A timer
	// queued by load alone can observe this zero and never receive SizeChanged.
	host.size = { width: 0, height: 0 }
	host.emit('loaded')
	measurement.flush()
	assertSize(measurement, 400, 24)

	host.size = { width: 400, height: 24 }
	host.nativeViewProtected.layout()
	measurement.flush()
	assertSize(measurement, 400, 24)
	measurement.unmount()
})
