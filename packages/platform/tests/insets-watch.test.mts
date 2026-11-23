import assert from 'node:assert/strict'
import { test } from 'node:test'
import { observeDecorInsets } from '../src/insets-watch.ts'

// Decor-view stub only — no Android runtime, layout, or real WindowInsets.
function fixture() {
  const previous = globalThis.android

  globalThis.android = {
    view: {
      View: {
        OnApplyWindowInsetsListener: class {
          constructor(callbacks) {
            Object.assign(this, callbacks)
          }
        },
      },
    },
  }

  const decorView = () => {
    const installed = []

    return {
      installed,
      requested: 0,
      setOnApplyWindowInsetsListener(listener) {
        installed.push(listener)
      },
      requestApplyInsets() {
        this.requested++
      },
      dispatch(insets = { bottom: 24 }) {
        return installed.at(-1)?.onApplyWindowInsets(this, insets)
      },
    }
  }

  return {
    decorView,
    restore: () => {
      globalThis.android = previous
    },
  }
}

test('concurrent readers share one installed listener and each receives dispatched insets', (t) => {
  const f = fixture()

  t.after(f.restore)

  const view = f.decorView()
  const a = [],
    b = []

  const releaseA = observeDecorInsets(view, (insets) => a.push(insets))
  const releaseB = observeDecorInsets(view, (insets) => b.push(insets))

  assert.equal(view.installed.length, 1)
  assert.equal(view.requested, 2)
  assert.equal(view.dispatch({ bottom: 10 }).bottom, 10)
  assert.deepEqual(a, [{ bottom: 10 }])
  assert.deepEqual(b, [{ bottom: 10 }])

  releaseA()
  releaseB()
})

test('releasing one reader keeps dispatch for the rest; the pass-through stays installed', (t) => {
  const f = fixture()

  t.after(f.restore)

  const view = f.decorView()
  const a = [],
    b = []

  const releaseA = observeDecorInsets(view, (insets) => a.push(insets))
  const releaseB = observeDecorInsets(view, (insets) => b.push(insets))

  releaseA()
  view.dispatch({ bottom: 5 })
  assert.deepEqual(a, [])
  assert.deepEqual(b, [{ bottom: 5 }])

  releaseB()
  releaseB()
  view.dispatch({ bottom: 7 })
  assert.deepEqual(b, [{ bottom: 5 }])
  // The single slot has no getter — teardown must not null a slot it may
  // no longer own, so the inert listener stays installed.
  assert.equal(view.installed.length, 1)
})

test('a later reader on the same decor view reuses the installed listener; other decor views get their own', (t) => {
  const f = fixture()

  t.after(f.restore)

  const first = f.decorView(),
    second = f.decorView()

  const a = [],
    b = []

  const releaseA = observeDecorInsets(first, (insets) => a.push(insets))

  releaseA()
  observeDecorInsets(first, (insets) => b.push(insets))
  assert.equal(first.installed.length, 1)

  observeDecorInsets(second, () => {})
  assert.equal(second.installed.length, 1)

  first.dispatch({ bottom: 3 })
  assert.deepEqual(a, [])
  assert.deepEqual(b, [{ bottom: 3 }])
})
