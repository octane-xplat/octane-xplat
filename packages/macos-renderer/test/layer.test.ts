import assert from 'node:assert/strict'
import { test } from 'node:test'
import { showWindowLayer } from '../src/layer.ts'

function fixture(flipped = false) {
	const callbacks: Array<() => void> = [],
		removed: unknown[] = []

	let monitor: any,
		unmounted = 0,
		detached = 0,
		size = { width: 100, height: 80 }

	const container: any = {
		bounds: { origin: { x: 0, y: 0 }, size: { width: 800, height: 600 } },
		flipped,
		addSubview() {},
		convertPointFromView: (point: { x: number; y: number }) => point,
	}

	const anchor: any = {
		window: { contentView: container },
		bounds: {},
		convertRectToView: () => ({
			origin: { x: 100, y: flipped ? 100 : 460 },
			size: { width: 200, height: 40 },
		}),
	}

	const view: any = {
		removeFromSuperview() {
			detached++
		},
	}

	const root = {
		render() {},
		unmount() {
			unmounted++
		},
	}

	const deps: any = {
		View: { alloc: () => ({ initWithFrame: () => view }) },
		createRoot: () => root,
		fittingSize: () => size,
		Event: {
			addLocalMonitorForEventsMatchingMaskHandler: (_mask: number, callback: any) => {
				monitor = callback
				return 'mouse'
			},
			removeMonitor: (token: unknown) => removed.push(token),
		},
		Center: {
			defaultCenter: {
				addObserverForNameObjectQueueUsingBlock: (
					_name: string,
					_view: unknown,
					_queue: unknown,
					callback: () => void,
				) => {
					callbacks.push(callback)
					return callbacks.length
				},
				removeObserver: (token: unknown) => removed.push(token),
			},
		},
	}

	return {
		anchor,
		view,
		deps,
		callbacks,
		removed,
		counts: () => ({ unmounted, detached }),
		resize: (next: typeof size) => {
			size = next
		},
		mouse: (point: { x: number; y: number }, eventWindow = anchor.window) =>
			monitor({ window: eventWindow, locationInWindow: point }),
	}
}

for (const flipped of [false, true]) {
	test(`window layer converts top-left geometry (flipped=${flipped}), updates and cleans up once`, () => {
		const f = fixture(flipped)
		let geometry: any,
			dismissals = 0

		const position = (anchor: any, panel: any, viewport: any) => {
			geometry = { anchor, panel, viewport }
			return { left: 150, top: 148 }
		}

		const layer = showWindowLayer(
			{ anchor: f.anchor, position, lightDismiss: true, onClose: () => dismissals++ },
			f.deps,
		)!

		assert.deepEqual(geometry.anchor, { left: 100, top: 100, width: 200, height: 40 })
		assert.deepEqual(f.view.frame, {
			origin: { x: 150, y: flipped ? 148 : 372 },
			size: { width: 100, height: 80 },
		})

		f.resize({ width: 120, height: 90 })
		f.callbacks[0]()
		assert.equal(geometry.panel.width, 120)
		layer.update({}, { position: () => ({ left: 25, top: 30 }) })
		assert.equal(f.view.frame.origin.x, 25)
		const inside = { x: 30, y: flipped ? 35 : 485 }
		f.mouse(inside)
		assert.equal(dismissals, 0)
		f.mouse({ x: 0, y: 0 })
		assert.equal(dismissals, 1)
		assert.equal(layer.closed, false, 'controlled request leaves host present')
		layer.close()
		layer.close()
		assert.deepEqual(f.counts(), { unmounted: 1, detached: 1 })
		assert.equal(f.removed.length, f.callbacks.length + 1)
		f.callbacks[0]()
		assert.equal(layer.closed, true)
	})
}

test('missing window support returns an explicit absence', () => {
	assert.equal(showWindowLayer({ anchor: {} } as any, {} as any), null)
})

test('overlapping layers restore consumer notification flags after the last owner closes', () => {
	const f = fixture()
	f.anchor.postsFrameChangedNotifications = false
	f.anchor.postsBoundsChangedNotifications = true
	const position = () => ({ left: 0, top: 0 })
	const first = showWindowLayer({ anchor: f.anchor, position }, f.deps)!
	const second = showWindowLayer({ anchor: f.anchor, position }, f.deps)!
	assert.equal(f.anchor.postsFrameChangedNotifications, true)
	first.close()
	assert.equal(f.anchor.postsFrameChangedNotifications, true)
	assert.equal(f.anchor.postsBoundsChangedNotifications, true)
	second.close()
	assert.equal(f.anchor.postsFrameChangedNotifications, false)
	assert.equal(f.anchor.postsBoundsChangedNotifications, true)
})

test('outside-dismiss support is required when requested', () => {
	const f = fixture()
	const deps = { ...f.deps, Event: {} }
	assert.equal(
		showWindowLayer(
			{ anchor: f.anchor, lightDismiss: true, position: () => ({ left: 0, top: 0 }) },
			deps,
		),
		null,
	)
})

test('source-owned outlets bypass standalone roots, receive updates and unmount once', () => {
	const f = fixture(), rendered: unknown[] = []
	let fallback = 0, unmounted = 0, target: unknown
	f.deps.createRoot = () => { fallback++; throw Error('standalone root must not run') }
	const layer = showWindowLayer({ anchor: f.anchor, props: { value: 1 }, position: () => ({ left: 10, top: 20 }),
		createContentRoot(host) { target = host; return { render: (_component, props) => rendered.push(props), unmount() { unmounted++ } } },
	}, f.deps)!
	assert.equal(target, f.view); assert.equal(fallback, 0); assert.equal(f.view.hidden, false)
	layer.update({ value: 2 }); assert.deepEqual(rendered, [{ value: 1 }, { value: 2 }])
	layer.close(); layer.close(); assert.equal(unmounted, 1); assert.equal(f.counts().detached, 1)
})

test('deferred reveal waits for the latest content commit and retired callbacks cannot resize or reopen', () => {
	const f = fixture(), commits: Array<() => void> = []
	let fitted = 0
	f.deps.fittingSize = () => { fitted++; return { width: 100, height: 80 } }
	f.anchor.window.makeFirstResponder = () => { throw Error('layer must not change keyboard focus') }
	const layer = showWindowLayer({ anchor: f.anchor, deferPresentation: true, position: () => ({ left: 10, top: 20 }),
		createContentRoot: () => ({ render() {}, unmount() {}, whenCommitted(callback) { commits.push(callback) } }),
	}, f.deps)!
	assert.equal(f.view.hidden, true); assert.equal(fitted, 0)
	layer.show(); assert.equal(f.view.hidden, true); assert.equal(fitted, 0)
	layer.update({ current: true }); commits[0](); assert.equal(f.view.hidden, true); assert.equal(fitted, 0)
	commits[1](); assert.equal(f.view.hidden, false); assert.equal(fitted, 1)
	layer.close(); commits[1](); layer.show(); layer.update({ retired: true }); assert.equal(f.view.hidden, true); assert.equal(fitted, 1)
})

test('staged layers ignore outside interaction and optional anchor exclusion preserves compound-field clicks', () => {
	const f = fixture()
	let dismissals = 0
	const layer = showWindowLayer({ anchor: f.anchor, lightDismiss: true, excludeAnchorFromDismiss: true, deferPresentation: true,
		position: () => ({ left: 400, top: 100 }), onClose: () => dismissals++,
	}, f.deps)!
	f.mouse({ x: 0, y: 0 }); assert.equal(dismissals, 0)
	layer.show(); f.mouse({ x: 110, y: 470 }); assert.equal(dismissals, 0)
	f.mouse({ x: 0, y: 0 }); assert.equal(dismissals, 1); assert.equal(layer.closed, false)
	layer.update({}, { excludeAnchorFromDismiss: false }); f.mouse({ x: 110, y: 470 }); assert.equal(dismissals, 2)
	layer.close()
})

test('window replacement retires a staged owner and notifies close once before held commits', () => {
	const f = fixture(), commits: Array<() => void> = []
	let dismissals = 0, unmounted = 0
	const layer = showWindowLayer({ anchor: f.anchor, deferPresentation: true, onClose: () => dismissals++, position: () => ({ left: 0, top: 0 }),
		createContentRoot: () => ({ render() {}, unmount() { unmounted++ }, whenCommitted(callback) { commits.push(callback) } }),
	}, f.deps)!
	f.anchor.window = { contentView: {} }; layer.show(); commits[0]()
	assert.equal(layer.closed, true); assert.equal(dismissals, 1); assert.equal(unmounted, 1); assert.equal(f.view.hidden, true)
	layer.close(true); assert.equal(dismissals, 1)
})

test('the original content container owns positioning even when the native window object stays the same', () => {
	const f = fixture()
	let dismissals = 0
	const layer = showWindowLayer({ anchor: f.anchor, onClose: () => dismissals++, position: () => ({ left: 0, top: 0 }) }, f.deps)!
	f.anchor.window.contentView = {}; f.callbacks[0]()
	assert.equal(layer.closed, true); assert.equal(dismissals, 1); assert.deepEqual(f.counts(), { unmounted: 1, detached: 1 })
})

test('native cleanup failure does not skip source disposal, other observers, notification leases or detachment', () => {
	const f = fixture(), failure = Error('monitor cleanup failed')
	f.anchor.postsFrameChangedNotifications = false; f.anchor.postsBoundsChangedNotifications = false
	const layer = showWindowLayer({ anchor: f.anchor, position: () => ({ left: 0, top: 0 }) }, f.deps)!
	f.deps.Event.removeMonitor = () => { throw failure }
	assert.throws(() => layer.close(), (error) => error === failure)
	assert.equal(layer.closed, true); assert.deepEqual(f.counts(), { unmounted: 1, detached: 1 }); assert.equal(f.removed.length, f.callbacks.length)
	assert.equal(f.anchor.postsFrameChangedNotifications, false); assert.equal(f.anchor.postsBoundsChangedNotifications, false)
	assert.doesNotThrow(() => layer.close())
})

test('invalid and failed source roots stay explicit and setup failure still disposes the source outlet', () => {
	const invalid = fixture()
	invalid.deps.createRoot = () => { throw Error('must not fall back') }
	assert.throws(() => showWindowLayer({ anchor: invalid.anchor, position: () => ({ left: 0, top: 0 }), createContentRoot: () => ({}) as any }, invalid.deps), /requires render and unmount/)
	const f = fixture(), failure = Error('source render failed')
	let unmounted = 0
	assert.throws(() => showWindowLayer({ anchor: f.anchor, position: () => ({ left: 0, top: 0 }), createContentRoot: () => ({ render() { throw failure }, unmount() { unmounted++ } }) }, f.deps), (error) => error === failure)
	assert.equal(unmounted, 1); assert.equal(f.counts().detached, 1)
})

test('unchanged geometry avoids native frame writes and invalid positions dispose before reaching AppKit', () => {
	const f = fixture()
	let frame: any, writes = 0
	Object.defineProperty(f.view, 'frame', { configurable: true, get: () => frame, set(value) { writes++; frame = value } })
	const layer = showWindowLayer({ anchor: f.anchor, position: () => ({ left: 0, top: 0 }) }, f.deps)!
	assert.equal(writes, 1); f.callbacks[0](); layer.show(); assert.equal(writes, 1)
	assert.throws(() => layer.update({}, { position: () => ({ left: NaN, top: 0 }) }), /finite, nonnegative/)
	assert.equal(layer.closed, true); assert.equal(writes, 1); assert.deepEqual(f.counts(), { unmounted: 1, detached: 1 })
})
