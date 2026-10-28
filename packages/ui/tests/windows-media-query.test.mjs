import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

// Projected-host contracts only; no real input devices, WinRT or renderer are used.
const source = ts.transpile(
	readFileSync(new URL('../src/media-query-host.windows.ts', import.meta.url), 'utf8'),
	{
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2022,
	},
)

function emitter() {
	const handlers = new Map()
	return {
		handlers,
		on(name, callback) {
			if (!handlers.has(name)) {
				handlers.set(name, new Set())
			}
			handlers.get(name).add(callback)
		},
		off(name, callback) {
			handlers.get(name)?.delete(callback)
		},
		emit(name) {
			for (const callback of handlers.get(name) ?? []) {
				callback()
			}
		},
		count() {
			return [...handlers.values()].reduce((n, callbacks) => n + callbacks.size, 0)
		},
	}
}

function fixture(devices = [], { mouse = 0, touch = 0, unavailable = false } = {}) {
	const state = {
		devices,
		mouse,
		touch,
		unavailable,
		animations: true,
		useCount: false,
		width: 800,
		height: 600,
		root: emitter(),
	}
	const Application = {
		...emitter(),
		orientationChangedEvent: 'orientationChanged',
		launchEvent: 'launch',
		resumeEvent: 'resume',
		getRootView: () => state.root,
	}
	const exports = {}
	vm.runInNewContext(source, {
		exports,
		require(id) {
			if (id === '@nativescript/core') {
				return {
					Application,
					Screen: {
						mainScreen: {
							get widthDIPs() {
								return state.width
							},
							get heightDIPs() {
								return state.height
							},
						},
					},
				}
			}
			assert.equal(id, '@octane-xplat/platform/windows')
			return {
				Windows: {
					UI: {
						ViewManagement: {
							UISettings: class {
								constructor() {
									if (state.unavailable) {
										throw Error('missing')
									}
									this.AnimationsEnabled = state.animations
								}
							},
						},
					},
					Devices: {
						Input: {
							MouseCapabilities: class {
								constructor() {
									if (state.unavailable) {
										throw Error('missing')
									}
									this.MousePresent = state.mouse
								}
							},
							TouchCapabilities: class {
								constructor() {
									if (state.unavailable) {
										throw Error('missing')
									}
									this.TouchPresent = state.touch
								}
							},
							PointerDeviceType: { Touch: 0, Pen: 1, Mouse: 2 },
							PointerDevice: {
								GetPointerDevices() {
									if (state.unavailable) {
										throw Error('missing')
									}
									return {
										...(state.useCount
											? { Count: state.devices.length }
											: { Size: state.devices.length }),
										GetAt: (index) => state.devices[index],
									}
								},
							},
						},
					},
				},
			}
		},
	})
	return { state, Application, ...exports }
}

const device = (type, hover = 0) => ({ PointerDeviceType: type, MaxPointersWithZDistance: hover })
const matches = (host, query) => host.matchesWindowsMediaQuery(query, host.readWindowsMediaTraits())

test('Windows hybrid input can match both any-pointer kinds while preferring the mouse', () => {
	const host = fixture([device(0), device(2)], { mouse: 1, touch: 1 })
	assert.equal(matches(host, '(pointer: fine)'), true)
	assert.equal(matches(host, '(pointer: coarse)'), false)
	assert.equal(matches(host, '(any-pointer: fine) and (any-pointer: coarse)'), true)
	assert.equal(matches(host, '(hover: hover) and (any-hover: hover)'), true)
	assert.equal(matches(host, '(any-pointer: none)'), false)
	host.state.useCount = true
	assert.equal(matches(host, '(any-pointer: fine) and (any-pointer: coarse)'), true)
})

test('Windows touch-only, pen hover and confirmed no-pointer states stay distinct', () => {
	const touch = fixture([device(0)], { touch: 1 })
	assert.equal(matches(touch, '(pointer: coarse) and (hover: none)'), true)
	assert.equal(matches(touch, '(any-pointer: fine)'), false)
	const pen = fixture([device(1, 1)])
	assert.equal(matches(pen, '(pointer: fine) and (hover: hover)'), true)
	pen.state.devices[0].MaxPointersWithZDistance = 0
	assert.equal(matches(pen, '(hover: none)'), true)
	pen.state.devices[0].MaxPointersWithZDistance = undefined
	assert.equal(matches(pen, '(hover: hover)'), false)
	assert.equal(matches(pen, '(hover: none)'), false)
	assert.equal(matches(pen, 'not (hover: hover)'), false)
	const none = fixture()
	assert.equal(matches(none, '(pointer: none) and (any-pointer: none) and (hover: none)'), true)
})

test('Missing or partial Windows projections do not invent absence or invert unknown capabilities', () => {
	const missing = fixture([], { unavailable: true })
	for (const query of [
		'(pointer: fine)',
		'(pointer: none)',
		'(hover: none)',
		'not (any-pointer: coarse)',
	]) {
		assert.equal(matches(missing, query), false, query)
	}
	assert.equal(matches(missing, '(min-width: 500px)'), true)
	const unknown = fixture([device(99)])
	assert.equal(matches(unknown, '(pointer: none)'), false)
	assert.equal(matches(unknown, 'not (any-pointer: fine)'), false)
})

test('Windows query grammar compares DIP dimensions, preserves boolean precedence and rejects invalid terms', () => {
	const host = fixture([device(2)], { mouse: 1 })
	assert.equal(matches(host, '(width: 800px) and (max-height: 600px)'), true)
	assert.equal(matches(host, '(min-width: 801px)'), false)
	assert.equal(matches(host, '(max-width: 100px) and (hover: hover) or (min-width: 400px)'), true)
	assert.equal(matches(host, '(max-width: 100px), (min-width: 800px)'), true)
	for (const query of [
		'',
		'(pointer: banana)',
		'not (pointer: banana)',
		'(width: 1..2px)',
		'not (prefers-contrast: more)',
	]) {
		assert.equal(matches(host, query), false, query)
	}
	host.state.height = 800
	assert.equal(matches(host, '(orientation: portrait)'), true)
	assert.equal(matches(host, '(orientation: landscape)'), false)
	host.state.width = NaN
	assert.equal(matches(host, 'not (orientation: portrait)'), false)
})

test('Windows media observation follows root layout, rebinds on lifecycle and releases every listener', () => {
	const host = fixture()
	let calls = 0
	const original = host.state.root
	const release = host.observeWindowsMediaTraits(() => calls++)
	assert.equal(host.Application.count(), 3)
	assert.equal(original.count(), 2)
	original.emit('loaded')
	assert.equal(calls, 1)
	original.emit('layoutChanged')
	assert.equal(calls, 2)
	host.state.root = emitter()
	host.Application.emit('resume')
	assert.equal(original.count(), 0)
	assert.equal(host.state.root.count(), 2)
	assert.equal(calls, 3)
	const stale = [...host.state.root.handlers.get('layoutChanged')][0]
	release()
	release()
	assert.equal(host.Application.count(), 0)
	assert.equal(host.state.root.count(), 0)
	stale()
	host.Application.emit('orientationChanged')
	assert.equal(calls, 3)
})

test('Windows reduced-motion queries follow animation preference and retain unknown state', () => {
	const host = fixture()
	assert.equal(matches(host, '(prefers-reduced-motion: no-preference)'), true)
	host.state.animations = false
	assert.equal(matches(host, '(prefers-reduced-motion: reduce)'), true)
	assert.equal(matches(host, '(prefers-reduced-motion: no-preference)'), false)
	host.state.animations = undefined
	assert.equal(matches(host, '(prefers-reduced-motion: reduce)'), false)
	assert.equal(matches(host, 'not (prefers-reduced-motion: reduce)'), false)
})
