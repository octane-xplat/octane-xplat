import assert from 'node:assert/strict'
import { test } from 'node:test'
import { showWindowLayer } from '../src/layer.mjs'

function fixture(flipped = false) {
	const callbacks = [],
		removed = []

	let monitor,
		unmounted = 0,
		detached = 0,
		size = { width: 100, height: 80 }

	const container = {
		bounds: { origin: { x: 0, y: 0 }, size: { width: 800, height: 600 } },
		isFlipped: flipped,
		addSubview() {},
		convertPointFromView: (point) => point,
	}

	const anchor = {
		window: { contentView: container },
		bounds: {},
		convertRectToView: () => ({
			origin: { x: 100, y: flipped ? 100 : 460 },
			size: { width: 200, height: 40 },
		}),
	}

	const view = {
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

	const deps = {
		View: { alloc: () => ({ initWithFrame: () => view }) },
		createRoot: () => root,
		fittingSize: () => size,
		Event: {
			addLocalMonitorForEventsMatchingMaskHandler: (_mask, callback) => {
				monitor = callback
				return 'mouse'
			},
			removeMonitor: (token) => removed.push(token),
		},
		Center: {
			defaultCenter: {
				addObserverForNameObjectQueueUsingBlock: (_name, _view, _queue, callback) => {
					callbacks.push(callback)
					return callbacks.length
				},
				removeObserver: (token) => removed.push(token),
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
		resize: (next) => {
			size = next
		},
		mouse: (point, eventWindow = anchor.window) =>
			monitor({ window: eventWindow, locationInWindow: point }),
	}
}

for (const flipped of [false, true]) {
	test(`window layer converts top-left geometry (flipped=${flipped}), updates and cleans up once`, () => {
		const f = fixture(flipped)
		let geometry,
			dismissals = 0

		const position = (anchor, panel, viewport) => {
			geometry = { anchor, panel, viewport }
			return { left: 150, top: 148 }
		}

		const layer = showWindowLayer(
			{ anchor: f.anchor, position, lightDismiss: true, onClose: () => dismissals++ },
			f.deps,
		)

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
	assert.equal(showWindowLayer({ anchor: {} }, {}), null)
})

test('overlapping layers restore consumer notification flags after the last owner closes', () => {
	const f = fixture()
	f.anchor.postsFrameChangedNotifications = false
	f.anchor.postsBoundsChangedNotifications = true
	const position = () => ({ left: 0, top: 0 })
	const first = showWindowLayer({ anchor: f.anchor, position }, f.deps)
	const second = showWindowLayer({ anchor: f.anchor, position }, f.deps)
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
