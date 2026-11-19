import assert from 'node:assert/strict'
import { test, mock } from 'node:test'
import { mockNativeBoundary } from './native-boundary.ts'

const hooks = mockNativeBoundary()
const { makePagerView, updatePagerView, disposePagerView } = await import('../src/pager.ts')
const { NSScrollView, NSView, NSNotificationCenter } = await import('@octane-xplat/platform/macos')

hooks.deregister()

/** Mocked hosts: clip bounds model the scroll offset; scrollToPoint moves it. */
function installHosts() {
  Object.assign(NSView.prototype, {
    initWithFrame() {
      this.subviews = []
      this.bounds = { origin: { x: 0, y: 0 }, size: { width: 200, height: 200 } }
      return this
    },
    addSubview(child) {
      this.subviews.push(child)
      child.superview = this
    },
    removeFromSuperview() {
      if (this.superview) {
        this.superview.subviews = this.superview.subviews.filter((child) => child !== this)
        this.superview = null
      }
    },
    scrollToPoint(point) {
      this.bounds = { origin: { x: point.x, y: point.y }, size: this.bounds.size }
    },
  })

  const anchors = ['widthAnchor', 'topAnchor', 'bottomAnchor', 'leadingAnchor', 'trailingAnchor']

  for (const name of anchors) {
    Object.defineProperty(NSView.prototype, name, {
      configurable: true,
      get() {
        return { constraintEqualToAnchor: () => ({ active: false }) }
      },
    })
  }

  Object.assign(NSScrollView.prototype, {
    initWithFrame() {
      this.contentView = NSView.alloc().initWithFrame({})
      return this
    },
  })

  Object.defineProperty(NSScrollView.prototype, 'documentView', {
    configurable: true,
    get() {
      return this.document
    },
    set(value) {
      this.document = value
    },
  })
}

function observeBounds() {
  const held: { callback?: () => void } = {}

  Object.assign(NSNotificationCenter.defaultCenter, {
    addObserverForNameObjectQueueUsingBlock(_name, _view, _queue, callback) {
      held.callback = callback
      return {}
    },
    removeObserver() {},
  })

  return held
}

/** Defer the 90 ms settle debounce so the test can fire it deterministically. */
function captureSettle() {
  const pending: { settle?: () => void } = {}
  const timeout = mock.method(globalThis, 'setTimeout', (callback: () => void) => {
    pending.settle = callback
    return 0
  })

  return { pending, timeout }
}

test('pager reports a user return to the programmatically selected page', () => {
  installHosts()
  const held = observeBounds()
  const { pending, timeout } = captureSettle()
  const changes: number[] = []
  const view: any = makePagerView()

  try {
    const props = {
      items: ['a', 'b', 'c', 'd'],
      onSelectedIndexChange: (event: any) => changes.push(event.value),
    }

    updatePagerView(view, props)

    // Programmatic write to page 3: tracked current suppresses the echo.
    updatePagerView(view, { ...props, selectedIndex: 3 })
    held.callback!()
    pending.settle!()
    assert.deepEqual(changes, [])

    // User scrolls to page 1: bounds notification debounces into a settle.
    view.contentView.bounds.origin.x = 200
    held.callback!()
    pending.settle!()
    assert.deepEqual(changes, [1])

    // A user return to page 3 is a fresh selection, not a muted echo.
    view.contentView.bounds.origin.x = 600
    held.callback!()
    pending.settle!()
    assert.deepEqual(changes, [1, 3])
  } finally {
    timeout.mock.restore()
    disposePagerView(view)
  }
})

test('pager reports the bound index when a page is disposed', () => {
  installHosts()
  observeBounds()
  const { timeout } = captureSettle()
  const disposing: number[] = []
  const view: any = makePagerView()

  try {
    updatePagerView(view, {
      items: ['a', 'b', 'c'],
      onItemDisposing: (event: any) => disposing.push(event.index),
    })

    updatePagerView(view, {
      items: ['a'],
      onItemDisposing: (event: any) => disposing.push(event.index),
    })

    assert.deepEqual(disposing, [2, 1])
  } finally {
    timeout.mock.restore()
    disposePagerView(view)
  }
})
