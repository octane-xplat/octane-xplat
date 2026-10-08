import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { installPresentationBridge, type SurfaceOptions } from '../src/presentation.ts'

let bridge: any, nativeWindow: any, monitors: Set<any>, observers: Set<any>, roots: any[]
class View {
	static alloc() {
		return new this()
	}
	_frame: any
	bounds: any
	layer: any
	items: any[]
	superview: any
	window: any
	initWithFrame(frame: any) {
		this._frame = frame
		this.bounds = { origin: { x: 0, y: 0 }, size: frame.size }
		this.layer = {}
		this.items = []
		return this
	}
	get subviews() {
		return { count: this.items.length, objectAtIndex: (i: number) => this.items[i] }
	}
	addSubview(child: any) {
		this.items.push(child)
		child.superview = this
		child.window = this.window
	}
	removeFromSuperview() {
		this.superview.items.splice(this.superview.items.indexOf(this), 1)
		this.superview = null
	}
	get frame() {
		return this._frame
	}
	set frame(frame: any) {
		this._frame = frame
		this.bounds.size = frame.size
	}
	convertPointFromView(point: { x: number; y: number }) {
		return { x: point.x - this.frame.origin.x, y: point.y - this.frame.origin.y }
	}
	hitTest() {
		return this
	}
	layout() {}
}

beforeEach(() => {
	monitors = new Set()
	observers = new Set()
	roots = []
	globalThis.NSView = View
	globalThis.NativeClass = () => {}
	globalThis.NSColor = {
		colorWithRedGreenBlueAlpha: () => ({ CGColor: {} }),
		windowBackgroundColor: {},
		controlBackgroundColor: {},
	}

	globalThis.NSEvent = {
		addLocalMonitorForEventsMatchingMaskHandler: (_mask: number, fn: any) => {
			monitors.add(fn)
			return fn
		},
		removeMonitor: (fn: any) => monitors.delete(fn),
	}

	globalThis.NSNotificationCenter = {
		defaultCenter: {
			addObserverForNameObjectQueueUsingBlock: (
				_name: string,
				_window: unknown,
				_queue: unknown,
				fn: () => void,
			) => {
				observers.add(fn)
				return fn
			},
			removeObserver: (fn: () => void) => observers.delete(fn),
		},
	}

	nativeWindow = {
		firstResponder: { name: 'opener' },
		makeFirstResponder(view: any) {
			this.firstResponder = view
		},
	}

	nativeWindow.contentView = View.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 800, height: 600 },
	})

	nativeWindow.contentView.window = nativeWindow
	globalThis.NSApplication = { sharedApplication: { keyWindow: nativeWindow } }
	bridge = {}
	installPresentationBridge(
		bridge,
		(panel: any) => {
			const root = {
				renders: [] as any[],
				disposed: 0,
				render(Component: any, props: any) {
					this.renders.push(props)
					Component?.(panel, props)
				},
				unmount() {
					this.disposed++
				},
			}

			roots.push(root)
			return root as any
		},
		() => 'system-ui',
	)
})

const component = (panel: any) => {
	if (!panel.items.length) {
		panel.addSubview({
			fittingSize: { width: 200, height: 140 },
			acceptsFirstResponder: true,
			enabled: true,
		})
	}
}

const present = (options: SurfaceOptions) =>
	bridge.presentSurface({ component, kind: 'dialog', modal: true, ...options })

const dispatch = (event: any) => {
	let value: any = { window: nativeWindow, ...event }
	for (const fn of [...monitors]) {
		if (!value) {
			break
		}

		value = fn(value)
	}

	return value
}

test('centers a detached root, updates in place and restores focus exactly once', async () => {
	const opener = nativeWindow.firstResponder
	let dismissed = 0
	const surface = present({ onDismiss: () => dismissed++ })
	assert.deepEqual(surface.panel.frame, {
		origin: { x: 200, y: 230 },
		size: { width: 400, height: 140 },
	})

	assert.notEqual(nativeWindow.firstResponder, opener)
	surface.update({ props: { body: 'updated' } })
	assert.equal(roots.length, 1)
	assert.equal(roots[0].renders.length, 2)
	surface.close()
	surface.close()
	assert.equal(await surface.closedPromise, undefined)
	assert.equal(roots[0].disposed, 1)
	assert.equal(nativeWindow.firstResponder, opener)
	assert.equal(dismissed, 0)
	assert.equal(monitors.size, 0)
	assert.equal(observers.size, 0)
})

test('purpose gates outside and Escape dismissal; required never passively closes', () => {
	for (const purpose of ['required', 'form', 'info']) {
		let calls = 0
		const surface = present({ purpose, onDismiss: () => calls++ })
		dispatch({ type: 1, locationInWindow: { x: 0, y: 0 } })
		assert.equal(surface.closed, purpose === 'info')
		if (!surface.closed) {
			dispatch({ type: 10, keyCode: 53 })
		}

		assert.equal(surface.closed, purpose !== 'required')
		assert.equal(calls, purpose === 'required' ? 0 : 1)
		surface.close()
	}
})

test('the shared layer registry can defer dismissal of a native surface', () => {
	let dismissed = 0
	let top = false
	const surface = present({
		canDismiss: () => top,
		onDismiss: () => dismissed++,
	})

	dispatch({ type: 10, keyCode: 53 })
	assert.equal(surface.closed, false)
	assert.equal(dismissed, 0)
	top = true
	dispatch({ type: 10, keyCode: 53 })
	assert.equal(surface.closed, true)
	assert.equal(dismissed, 1)
})

test('only the top modal receives dismissal and nested focus restores to its presenter', () => {
	let firstCalls = 0,
		secondCalls = 0

	const first = present({ onDismiss: () => firstCalls++ }),
		firstFocus = nativeWindow.firstResponder

	const second = present({ onDismiss: () => secondCalls++ })
	dispatch({ type: 10, keyCode: 53 })
	assert.equal(firstCalls, 0)
	assert.equal(secondCalls, 1)
	assert.equal(nativeWindow.firstResponder, firstFocus)
	assert.equal(first.closed, false)
	assert.equal(second.closed, true)
	first.close()
})

test('bottom docking, heterogeneous snap stops, drag snapping and resize', () => {
	const sheet = present({ kind: 'sheet', snapPoints: ['25%', 300, 1] })
	assert.equal(sheet.panel.frame.origin.y, 0)
	assert.equal(sheet.panel.frame.size.height, 150)
	dispatch({ type: 1, locationInWindow: { x: 20, y: 140 } })
	dispatch({ type: 6, locationInWindow: { x: 20, y: 295 } })
	dispatch({ type: 2, locationInWindow: { x: 20, y: 295 } })
	assert.equal(sheet.panel.frame.size.height, 300)
	sheet.layer.bounds.size = { width: 1000, height: 800 }
	sheet.layer.layout()
	assert.equal(sheet.panel.frame.size.width, 1000)
	assert.equal(sheet.panel.frame.size.height, 300)
	dispatch({ type: 1, locationInWindow: { x: 20, y: 290 } })
	dispatch({ type: 6, locationInWindow: { x: 20, y: 790 } })
	dispatch({ type: 2, locationInWindow: { x: 20, y: 790 } })
	assert.equal(sheet.panel.frame.size.height, 800, 'largest snap stop owns the height budget')
	sheet.close()
})

test('nonmodal toast does not steal focus or block empty-area hit testing', () => {
	const opener = nativeWindow.firstResponder
	const toast = present({
		kind: 'toast',
		modal: false,
		position: 'topStart',
		inset: { top: 10, start: 5 },
	})

	assert.equal(nativeWindow.firstResponder, opener)
	assert.equal(toast.layer.hitTest({ x: 0, y: 0 }), null)
	assert.equal(toast.panel.frame.origin.x, 21)
	assert.equal(toast.panel.frame.origin.y, 434)
	const click = dispatch({ type: 1, locationInWindow: { x: 790, y: 0 } })
	assert.ok(click)
	assert.equal(toast.closed, false)
	toast.close()
})

test('owner close disposes every root and does not report user dismissal', async () => {
	let calls = 0
	const first = present({ onDismiss: () => calls++ }),
		second = present({ onDismiss: () => calls++ })

	for (const notify of [...observers]) {
		notify()
	}

	assert.equal(await first.closedPromise, 'owner')
	assert.equal(await second.closedPromise, 'owner')
	assert.equal(calls, 0)
	assert.equal(
		roots.every((root) => root.disposed === 1),
		true,
	)

	assert.equal(nativeWindow.contentView.items.length, 0)
})

test('setup failure removes the root, view, observers and monitors', () => {
	assert.throws(
		() =>
			present({
				component() {
					throw new Error('broken content')
				},
			}),
		/broken content/,
	)

	assert.equal(roots[0].disposed, 1)
	assert.equal(nativeWindow.contentView.items.length, 0)
	assert.equal(monitors.size, 0)
	assert.equal(observers.size, 0)
})

test('fullscreen covers the nativeWindow and final focus ref is honored', () => {
	const final = { acceptsFirstResponder: true }
	const surface = present({ kind: 'lightbox', finalFocusRef: { current: final } })
	assert.deepEqual(surface.panel.frame, nativeWindow.contentView.bounds)
	surface.close()
	assert.equal(nativeWindow.firstResponder, final)
})

test('closing a presenter closes its nested surfaces and restores the original opener', async () => {
	const opener = nativeWindow.firstResponder
	const parent = present({})
	let dismissed = 0
	const child = present({ owner: parent.panel, onDismiss: () => dismissed++ })
	parent.close()
	assert.equal(await child.closedPromise, 'ancestor')
	assert.equal(nativeWindow.firstResponder, opener)
	assert.equal(dismissed, 0)
	assert.equal(
		roots.every((root) => root.disposed === 1),
		true,
	)
})

test('Tab wraps through enabled controls and lightbox arrows dispatch only to the top modal', () => {
	const surface = present({ kind: 'lightbox', onKey: (code: number) => code === 123 })
	const first = surface.panel.items[0]
	const second = { acceptsFirstResponder: true, enabled: true }
	const disabled = { acceptsFirstResponder: true, enabled: false }
	surface.panel.addSubview(second)
	surface.panel.addSubview(disabled)
	assert.equal(dispatch({ type: 10, keyCode: 48 }), null)
	assert.equal(nativeWindow.firstResponder, second)
	dispatch({ type: 10, keyCode: 48 })
	assert.equal(nativeWindow.firstResponder, first)
	dispatch({ type: 10, keyCode: 48, modifierFlags: 131072 })
	assert.equal(nativeWindow.firstResponder, second)
	assert.equal(dispatch({ type: 10, keyCode: 123 }), null)
	surface.close()
})
