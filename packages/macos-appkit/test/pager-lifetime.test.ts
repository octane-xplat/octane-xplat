import assert from 'node:assert/strict'
import { test, mock } from 'node:test'
import { mockNativeBoundary } from './native-boundary.ts'
const hooks = mockNativeBoundary()
const { makePagerView, updatePagerView, disposePagerView } = await import('../src/pager.ts')
const { NSScrollView, NSView, NSNotificationCenter } = await import('@octane-xplat/platform/macos')
hooks.deregister()

test('pager retires a token acquired after reentrant disposal and held delivery schedules nothing', () => {
  const node: any = { view: null }
  const released: object[] = []
  const token = {}
  let held: () => void
  Object.assign(NSView.prototype, {
    initWithFrame() {
      return this
    },
  })
  Object.assign(NSScrollView.prototype, {
    initWithFrame() {
      this.contentView = {}
      return this
    },
  })
  Object.assign(NSNotificationCenter.defaultCenter, {
    addObserverForNameObjectQueueUsingBlock(_name, _view, _queue, callback) {
      held = callback
      assert.ok(node.view, 'native host must be published before fallible observation')
      disposePagerView(node.view)
      return token
    },
    removeObserver(value) {
      released.push(value)
    },
  })
  const view = makePagerView(node)
  assert.equal(view.documentView, null)
  assert.deepEqual(released, [token])
  const schedule = mock.method(globalThis, 'setTimeout', () => {
    throw Error('retired pager scheduled work')
  })
  try {
    held!()
    disposePagerView(view)
    assert.equal(schedule.mock.callCount(), 0)
    assert.deepEqual(released, [token])
  } finally {
    schedule.mock.restore()
  }
})

test('pager attaches page hosts before activating clip constraints and removes retired hosts', () => {
  const constraints: { active: boolean }[] = []
  const root = (view: any): any => (view.superview ? root(view.superview) : view)
  Object.assign(NSView.prototype, {
    initWithFrame() {
      this.subviews = []
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
  })
  for (const name of [
    'widthAnchor',
    'topAnchor',
    'bottomAnchor',
    'leadingAnchor',
    'trailingAnchor',
  ]) {
    Object.defineProperty(NSView.prototype, name, {
      configurable: true,
      get() {
        const owner = this
        return {
          owner,
          constraintEqualToAnchor(other) {
            let active = false
            const constraint = {
              get active() {
                return active
              },
              set active(value) {
                if (value) {
                  assert.equal(
                    root(owner),
                    root(other.owner),
                    'constraint requires a common ancestor',
                  )
                }
                active = value
              },
            }
            constraints.push(constraint)
            return constraint
          },
        }
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
      if (value) {
        this.contentView.addSubview(value)
      }
    },
  })
  Object.assign(NSNotificationCenter.defaultCenter, {
    addObserverForNameObjectQueueUsingBlock() {
      return {}
    },
    removeObserver() {},
  })
  const view: any = makePagerView()
  updatePagerView(view, { items: ['first', 'second'] })
  const pages = view.documentView.subviews.slice()
  assert.equal(pages.length, 2)
  assert.ok(constraints.every((constraint) => constraint.active))
  updatePagerView(view, { items: ['retained'] })
  assert.deepEqual(view.documentView.subviews, [pages[0]])
  assert.equal(pages[1].superview, null)
  disposePagerView(view)
  assert.equal(view.documentView, null)
  assert.equal(pages[0].superview, null)
  assert.ok(constraints.every((constraint) => !constraint.active))
})
