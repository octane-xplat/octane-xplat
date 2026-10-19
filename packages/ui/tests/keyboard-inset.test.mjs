import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { createKeyboardWindowRegistry } from '../../platform/src/keyboard-registry.ts'

// Host doubles prove subscription/state logic, not OS keyboard delivery.
const compiled = ts.transpile(
	readFileSync(new URL('../src/keyboard-inset.ts', import.meta.url), 'utf8'),
	{
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2022,
	},
)

function load(application, globals = {}) {
	const keyboardWindows = createKeyboardWindowRegistry(() => ({ inset: 0 }))
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
				case '@octane-xplat/platform/keyboard-state':
					return { keyboardWindows }
				default:
					throw new Error(`Unexpected module: ${specifier}`)
			}
		},
		...globals,
	})

	vm.runInContext(compiled, context)
	return Object.assign(context.exports, { registry: keyboardWindows })
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

test('host-bound iOS readers release detached windows and rebind on load or window changes', () => {
	let callback,
		added = 0,
		removed = 0
	const api = load(
		{ ios: {} },
		{
			NSNotificationCenter: {
				defaultCenter: {
					addObserverForNameObjectQueueUsingBlock: (_name, _object, _queue, listener) => {
						callback = listener
						added++
						return {}
					},
					removeObserver: () => removed++,
				},
			},
			NSOperationQueue: { mainQueue: {} },
			UIKeyboardWillChangeFrameNotification: 'frame',
			UIKeyboardFrameEndUserInfoKey: 'end',
			UIScreen: { mainScreen: { bounds: { size: { height: 800 } } } },
		},
	)
	const host = (window) => {
		const events = new Map()
		return {
			ios: { window },
			isLoaded: true,
			on: (name, listener) => {
				if (!events.has(name)) {
					events.set(name, new Set())
				}
				events.get(name).add(listener)
			},
			off: (name, listener) => events.get(name)?.delete(listener),
			emit: (name) => events.get(name)?.forEach((listener) => listener()),
			listeners: () => [...events.values()].reduce((count, set) => count + set.size, 0),
		}
	}
	const aWindow = {},
		bWindow = {},
		cWindow = {}
	const a = host(aWindow),
		b = host(bWindow),
		first = [],
		second = []
	const offA = api.subscribeKeyboardInset((value) => first.push(value), a)
	const offB = api.subscribeKeyboardInset((value) => second.push(value), b)
	const frame = (y) => callback({ userInfo: { objectForKey: () => ({ origin: { y } }) } })
	frame(500)
	assert.equal(added, 1)
	assert.equal(first.at(-1), 300)
	assert.equal(second.at(-1), 300)
	b.isLoaded = false
	b.emit('unloaded')
	frame(600)
	assert.equal(first.at(-1), 200)
	assert.equal(second.at(-1), 0)
	assert.equal(api.registry.getSnapshot(bWindow).inset, 0)
	b.ios.window = cWindow
	b.isLoaded = true
	b.emit('loaded')
	assert.equal(second.at(-1), 200)
	b.ios.window = aWindow
	b.emit('layoutChanged')
	assert.equal(api.registry.getSnapshot(cWindow).inset, 0)
	assert.equal(added, 1)
	offA()
	assert.equal(removed, 0)
	offB()
	offB()
	assert.equal(removed, 1)
	assert.equal(a.listeners(), 0)
	assert.equal(b.listeners(), 0)
})

test('default iOS readers follow key-window changes instead of retaining the launch window', () => {
	const first = {},
		second = {},
		tokens = new Set()
	const application = { ios: { window: first, nativeApp: { keyWindow: first } } }
	const api = load(application, {
		NSNotificationCenter: {
			defaultCenter: {
				addObserverForNameObjectQueueUsingBlock: (name, _object, _queue, listener) => {
					const token = { name, listener }
					tokens.add(token)
					return token
				},
				removeObserver: (token) => tokens.delete(token),
			},
		},
		NSOperationQueue: { mainQueue: {} },
		UIKeyboardWillChangeFrameNotification: 'frame',
		UIKeyboardFrameEndUserInfoKey: 'end',
		UIWindowDidBecomeKeyNotification: 'key',
		UIScreen: { mainScreen: { bounds: { size: { height: 800 } } } },
	})
	const values = []
	const off = api.subscribeKeyboardInset((value) => values.push(value))
	const frame = (y) =>
		[...tokens]
			.filter((token) => token.name === 'frame')
			.forEach((token) => token.listener({ userInfo: { objectForKey: () => ({ origin: { y } }) } }))
	frame(500)
	assert.equal(api.registry.getSnapshot(first).inset, 300)
	application.ios.nativeApp.keyWindow = second
	const activeTokens = [...tokens]
	for (const token of activeTokens) {
		if (token.name === 'key') {
			token.listener()
		}
	}
	frame(600)
	assert.equal(api.registry.getSnapshot(first).inset, 0)
	assert.equal(api.registry.getSnapshot(second).inset, 200)
	assert.equal(values.at(-1), 200)
	off()
	assert.equal(tokens.size, 0)
})

function androidHost(compat = true, initialIme = 620) {
	let mode = 0x21,
		ime = initialIme,
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

	const decor = {
		getViewTreeObserver: () => tree,
		insets: () => ({ getInsets: (type) => ({ bottom: type === 'ime' ? ime : 20 }) }),
	}
	const window = {
		getAttributes: () => ({ softInputMode: mode }),
		setSoftInputMode: (value) => {
			mode = value
			writes.push(value)
		},
		getDecorView: () => decor,
	}

	const events = new Map()
	const application = {
		android: {
			foregroundActivity: { getWindow: () => window },
			on: (name, listener) => {
				if (!events.has(name)) {
					events.set(name, new Set())
				}
				events.get(name).add(listener)
			},
			off: (name, listener) => events.get(name)?.delete(listener),
		},
	}
	const api = load(application, {
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
								getRootWindowInsets: (view) => view.insets(),
							},
							WindowInsetsCompat: { Type: { ime: () => 'ime', systemBars: () => 'bars' } },
						},
					},
				}
			: undefined,
	})

	return {
		api,
		application,
		window,
		decor,
		writes,
		resume: (next) => {
			application.android.foregroundActivity = { getWindow: () => next }
			events.get('activityResumed')?.forEach((listener) => listener())
		},
		listenerCount: () =>
			[...events.values()].reduce((count, listeners) => count + listeners.size, 0),
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

test('Android readers rebind to a replacement Activity without remounting', () => {
	const first = androidHost(),
		second = androidHost(true, 420),
		values = []
	const off = first.api.subscribeKeyboardInset((value) => values.push(value))
	first.resume(second.window)
	assert.deepEqual(values, [300, 200])
	assert.deepEqual(first.writes, [0x11, 0x21])
	assert.deepEqual(first.counts(), [1, 1])
	assert.deepEqual(second.writes, [0x11])
	first.layout(0)
	assert.equal(values.at(-1), 200)
	second.layout(220)
	assert.equal(values.at(-1), 100)
	off()
	off()
	assert.deepEqual(second.counts(), [1, 1])
	assert.deepEqual(second.writes, [0x11, 0x21])
	assert.equal(first.listenerCount(), 0)
})

test('Android resize ownership survives observation-driver replacement', () => {
	const host = androidHost(),
		values = []
	const off = host.api.subscribeKeyboardInset((value) => values.push(value))
	let delayed,
		stopped = 0
	const remove = host.api.registry.install((window, publish) => {
		assert.equal(window, host.decor)
		delayed = publish
		publish({ inset: 400 })
		return () => stopped++
	})
	assert.deepEqual(host.writes, [0x11])
	assert.deepEqual(host.counts(), [1, 1])
	assert.equal(values.at(-1), 400)
	host.layout(0)
	assert.equal(values.at(-1), 400)
	remove()
	assert.equal(stopped, 1)
	assert.deepEqual(host.writes, [0x11])
	assert.deepEqual(host.counts(), [2, 1])
	assert.equal(values.at(-1), 0)
	delayed({ inset: 999 })
	assert.equal(values.at(-1), 0)
	off()
	assert.deepEqual(host.writes, [0x11, 0x21])
	assert.deepEqual(host.counts(), [2, 2])
})

test('NativeScript window sessions release detached surfaces and resume on their replacement', () => {
	const first = androidHost(),
		next = androidHost(true, 420),
		values = []
	const events = new Map()
	const session = {
		state: 'attached',
		android: { activity: { getWindow: () => first.window } },
		on: (name, listener) => {
			if (!events.has(name)) {
				events.set(name, new Set())
			}
			events.get(name).add(listener)
		},
		off: (name, listener) => events.get(name)?.delete(listener),
	}
	const emit = (name) => events.get(name)?.forEach((listener) => listener({ window: session }))
	first.application.activeWindow = session
	const off = first.api.subscribeKeyboardInset((value) => values.push(value))
	assert.equal(values.at(-1), 300)
	session.state = 'detached'
	session.android = undefined
	emit('detached')
	assert.equal(values.at(-1), 0)
	assert.deepEqual(first.counts(), [1, 1])
	assert.deepEqual(first.writes, [0x11, 0x21])
	first.resume(next.window)
	assert.equal(values.at(-1), 0)
	assert.deepEqual(next.counts(), [0, 0])
	session.state = 'attached'
	session.android = { activity: { getWindow: () => next.window } }
	emit('attached')
	assert.equal(values.at(-1), 200)
	assert.deepEqual(next.counts(), [1, 0])
	session.state = 'closed'
	emit('close')
	assert.equal(values.at(-1), 0)
	assert.deepEqual(next.counts(), [1, 1])
	assert.deepEqual(next.writes, [0x11, 0x21])
	assert.equal(
		[...events.values()].reduce((count, set) => count + set.size, 0),
		0,
	)
	next.layout(0)
	assert.equal(values.at(-1), 0)
	off()
	assert.equal(first.listenerCount(), 0)
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

test('Android sheet hosts share the top-level AndroidX inset listener until the last owner closes', () => {
	let listener
	const writes = []
	const decor = {}
	const nativeWindow = { getAttributes: () => ({ softInputMode: 0x20 }), getDecorView: () => decor }
	const api = load(
		{ android: { foregroundActivity: { getWindow: () => nativeWindow } } },
		{
			android: {
				view: {
					WindowManager: {
						LayoutParams: { SOFT_INPUT_MASK_ADJUST: 0xf0, SOFT_INPUT_ADJUST_RESIZE: 0x10 },
					},
				},
			},
			androidx: {
				core: {
					view: {
						OnApplyWindowInsetsListener: class {
							constructor(implementation) {
								Object.assign(this, implementation)
							}
						},
						ViewCompat: {
							setOnApplyWindowInsetsListener: (_view, value) => {
								listener = value
								writes.push(value)
							},
						},
						WindowInsetsCompat: { Type: { ime: () => 'ime', systemBars: () => 'bars' } },
					},
				},
			},
		},
	)

	const first = {},
		second = {}

	const off1 = api.bindBottomInsetToKeyboard(first)
	const insets = { getInsets: (type) => ({ bottom: type === 'ime' ? 620 : 20 }) }
	assert.equal(listener.onApplyWindowInsets(decor, insets), insets)
	assert.equal(first.translateY, -300)
	const off2 = api.bindBottomInsetToKeyboard(second)
	assert.equal(second.translateY, -300)
	assert.equal(writes.length, 1)
	off1()
	off1()
	assert.equal(first.translateY, 0)
	assert.equal(writes.length, 1)
	listener.onApplyWindowInsets(decor, { getInsets: () => ({ bottom: 0 }) })
	assert.equal(Math.abs(second.translateY), 0)
	off2()
	assert.equal(writes.length, 2)
	assert.equal(writes[1], null)
})
