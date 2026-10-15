import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

// Host doubles prove subscription/state logic, not OS keyboard delivery.
const compiled = ts.transpile(
	readFileSync(new URL('../src/keyboard-inset.ts', import.meta.url), 'utf8'),
	{
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2022,
	},
)

function load(application, globals = {}) {
	const context = vm.createContext({
		exports: {},
		require: (specifier) => {
			switch (specifier) {
				case '@nativescript/core':
					return {
						Application: application,
						Utils: { layout: { toDeviceIndependentPixels: (px) => px / 2 } },
					}
				case '@octane-xplat/platform/android':
					return { android: globals.android }
				case '@octane-xplat/platform/ios':
					return globals
				default:
					throw new Error(`Unexpected module: ${specifier}`)
			}
		},
		...globals,
	})

	vm.runInContext(compiled, context)
	return context.exports
}

test('iOS shares frames, applies current inset to late consumers, hides and releases the final observer', () => {
	let callback,
		added = 0,
		removed = 0

	const api = load(
		{ ios: {} },
		{
			NSNotificationCenter: {
				defaultCenter: {
					addObserverForNameObjectQueueUsingBlock: (_n, _o, _q, cb) => {
						callback = cb
						added++
						return 'token'
					},
					removeObserver: (token) => {
						assert.equal(token, 'token')
						removed++
					},
				},
			},
			NSOperationQueue: { mainQueue: {} },
			UIKeyboardWillChangeFrameNotification: 'frame',
			UIKeyboardFrameEndUserInfoKey: 'end',
			UIScreen: { mainScreen: { bounds: { size: { height: 800 } } } },
		},
	)

	const first = [],
		second = [],
		host = {}

	const off1 = api.subscribeKeyboardInset((value) => first.push(value))
	const frame = (raw) => callback({ userInfo: { objectForKey: () => raw } })
	frame({ CGRectValue: { origin: { y: 500 } } })
	const off2 = api.subscribeKeyboardInset((value) => second.push(value))
	const unbind = api.bindBottomInsetToKeyboard(host)
	assert.equal(added, 1)
	assert.equal(host.translateY, -300)
	assert.deepEqual(second, [300])
	off1()
	assert.equal(removed, 0)
	frame({ CGRectValue: () => ({ origin: { y: 600 } }) })
	assert.deepEqual(first, [0, 300])
	assert.deepEqual(second, [300, 200])
	frame({ origin: { y: 800 } })
	assert.equal(Math.abs(host.translateY), 0)
	assert.equal(second.at(-1), 0)
	off2()
	assert.equal(removed, 0)
	unbind()
	assert.equal(removed, 1)
	const last = []
	const off3 = api.subscribeKeyboardInset((value) => last.push(value))
	assert.deepEqual(last, [0])
	off3()
	assert.equal(removed, 2)
})

function androidHost(compat = true) {
	let mode = 0x21,
		ime = 620,
		added = 0,
		removed = 0,
		callback

	const writes = []
	const tree = {
		isAlive: () => true,
		addOnGlobalLayoutListener: (value) => {
			callback = value.onGlobalLayout
			added++
		},
		removeOnGlobalLayoutListener: () => removed++,
	}

	const decor = { getViewTreeObserver: () => tree }
	const window = {
		getAttributes: () => ({ softInputMode: mode }),
		setSoftInputMode: (value) => {
			mode = value
			writes.push(value)
		},
		getDecorView: () => decor,
	}

	const api = load(
		{ android: { foregroundActivity: { getWindow: () => window } } },
		{
			android: {
				view: {
					WindowManager: {
						LayoutParams: { SOFT_INPUT_MASK_ADJUST: 0xf0, SOFT_INPUT_ADJUST_RESIZE: 0x10 },
					},
					ViewTreeObserver: {
						OnGlobalLayoutListener: class {
							constructor(value) {
								Object.assign(this, value)
							}
						},
					},
				},
			},
			androidx: compat
				? {
						core: {
							view: {
								ViewCompat: {
									getRootWindowInsets: () => ({
										getInsets: (type) => ({ bottom: type === 'ime' ? ime : 20 }),
									}),
								},
								WindowInsetsCompat: { Type: { ime: () => 'ime', systemBars: () => 'bars' } },
							},
						},
					}
				: undefined,
		},
	)

	return {
		api,
		writes,
		layout: (value) => {
			ime = value
			callback()
		},
		setMode: (value) => {
			mode = value
		},
		counts: () => [added, removed],
	}
}

test('Android shares window ownership, converts pixels to dips, updates on hide and restores after the last reader', () => {
	const host = androidHost(),
		a = [],
		b = []

	const off1 = host.api.subscribeKeyboardInset((value) => a.push(value))
	const off2 = host.api.subscribeKeyboardInset((value) => b.push(value))
	assert.deepEqual(host.writes, [0x11])
	assert.deepEqual(host.counts(), [1, 0])
	assert.equal(b.at(-1), 300)
	host.layout(420)
	assert.equal(a.at(-1), 200)
	assert.equal(b.at(-1), 200)
	off1()
	off1()
	assert.deepEqual(host.writes, [0x11])
	host.layout(0)
	assert.equal(b.at(-1), 0)
	assert.equal(a.at(-1), 200)
	off2()
	assert.deepEqual(host.writes, [0x11, 0x21])
	assert.deepEqual(host.counts(), [1, 1])
})

test('Android cleanup preserves a newer external softInputMode owner', () => {
	const host = androidHost()
	const off = host.api.subscribeKeyboardInset(() => {})
	host.setMode(0x31)
	off()
	assert.deepEqual(host.writes, [0x11])
	assert.deepEqual(host.counts(), [1, 1])
})

test('unsupported host emits zero without touching native APIs', () => {
	const values = []
	const off = load({}).subscribeKeyboardInset((value) => values.push(value))
	off()
	assert.deepEqual(values, [0])
})

test('Android keeps resize avoidance when numeric inset support is unavailable', () => {
	const host = androidHost(false),
		values = []

	const off = host.api.subscribeKeyboardInset((value) => values.push(value))
	assert.deepEqual(values, [0])
	assert.deepEqual(host.writes, [0x11])
	off()
	assert.deepEqual(host.writes, [0x11, 0x21])
})
