import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

// octane-xplat#188 — `ns:module` `invalidateModules` deliberately rejects every
// pending dynamic `import()` waiter of an evicted module with
// `Error("Module invalidated during dev reload: <url>")`. A whole-graph
// eviction (jsFullReload → requestFullReload) orphans every in-flight app
// `void import(...)`, and with no catch site the runtime reports each one as a
// fatal unhandled rejection. The registry now installs an `unhandledrejection`
// filter that preventDefaults ONLY that deliberate reason; every other
// rejection stays observable.
const nsViteEntry = createRequire(import.meta.url).resolve('@nativescript/vite')
const nsViteUrl = pathToFileURL(nsViteEntry)

const { installNsHotRegistry } = await import(new URL('./hmr/client/hot-context.js', nsViteUrl))

const REGISTRY_GLOBALS = [
  '__NS_HOT_REGISTRY__',
  '__NS_DEV_RELOAD_REJECTION_FILTER__',
  '__NS_DEV_ENTRY_URL__',
]

const savedGlobals = new Map()
const savedAddEventListener = globalThis.addEventListener
const listeners = new Map()

const dispatched = []
const dispatchUnhandledRejection = (reason) => {
  const event = {
    reason,
    prevented: false,
    preventDefault() {
      this.prevented = true
    },
  }

  for (const cb of listeners.get('unhandledrejection') ?? []) {
    cb(event)
  }

  dispatched.push(event)
  return event
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  for (const key of REGISTRY_GLOBALS) {
    savedGlobals.set(key, globalThis[key])
    delete globalThis[key]
  }

  listeners.clear()
  dispatched.length = 0
  globalThis.addEventListener = (type, cb) => {
    let set = listeners.get(type)

    if (!set) {
      set = new Set()
      listeners.set(type, set)
    }

    set.add(cb)
  }
})

afterEach(() => {
  globalThis.addEventListener = savedAddEventListener
  for (const key of REGISTRY_GLOBALS) {
    if (savedGlobals.get(key) === undefined) {
      delete globalThis[key]
    } else {
      globalThis[key] = savedGlobals.get(key)
    }
  }
})

describe('dev-reload import cancellation filter (octane-xplat#188)', () => {
  it('suppresses an unhandled rejection carrying the deliberate cancellation reason', () => {
    installNsHotRegistry()

    assert.equal(listeners.get('unhandledrejection')?.size, 1)

    const event = dispatchUnhandledRejection(
      new Error('Module invalidated during dev reload: http://dev-host:5173/ns/m/src/App.tsrx'),
    )

    assert.equal(event.prevented, true)
  })

  it('keeps genuine errors observable — only the exact cancellation reason is owned', () => {
    installNsHotRegistry()

    const reasons = [
      new Error('boom'),
      new TypeError('foo is not a function'),
      new Error('Cannot find module /ns/m/src/missing'),
      new Error('Module invalidated during dev reload'), // truncated — not the contract
      'Module invalidated during dev reload: http://x/ns/m/src/a.ts', // non-object
      { message: 'some other failure' },
      null,
      undefined,
    ]

    for (const reason of reasons) {
      const event = dispatchUnhandledRejection(reason)

      assert.equal(event.prevented, false, JSON.stringify(reason))
    }
  })

  it('installs the filter even when another realm already seeded the registry', () => {
    globalThis.__NS_HOT_REGISTRY__ = { createHotContext() {} }

    installNsHotRegistry()

    assert.equal(listeners.get('unhandledrejection')?.size, 1)

    const event = dispatchUnhandledRejection(
      new Error('Module invalidated during dev reload: http://dev-host:5173/ns/m/src/entry.ts'),
    )

    assert.equal(event.prevented, true)
  })

  it('interleaves invalidation, entry re-import rejection, and waiters mid-reload', async () => {
    globalThis.__NS_DEV_ENTRY_URL__ = 'http://dev-host:5173/ns/m/src/index.ts'

    const registry = installNsHotRegistry()
    const hot = registry.createHotContext('/src/index')

    const calls = []

    hot.on('vite:beforeFullReload', () => calls.push('beforeFullReload'))
    hot.on('ns:full-reload-failed', (p) => calls.push(`failed:${p?.message ?? ''}`))
    hot.dispose(() => calls.push('disposed'))

    registry.requestFullReload('no accepting importer for /src/theme')

    // While the reload's entry re-import is in flight, an app waiter cancelled
    // by the same eviction reports as unhandled — owned by the filter — and an
    // unrelated failure must remain unprevented.
    const cancelled = dispatchUnhandledRejection(
      new Error(
        'Module invalidated during dev reload: http://dev-host:5173/ns/m/src/dev-smoke.mobile',
      ),
    )

    const genuine = dispatchUnhandledRejection(new Error('evaluation blew up'))

    assert.equal(cancelled.prevented, true)
    assert.equal(genuine.prevented, false)

    // Node rejects the http: entry re-import (ERR_UNSUPPORTED_ESM_URL_SCHEME);
    // the reload path surfaces that failure through its own event instead of
    // crashing — proving the failure stays observable through teardown.
    await tick()
    await tick()

    assert.deepEqual(calls[0], 'beforeFullReload')
    assert.equal(calls[1], 'disposed')
    assert.ok(calls[2]?.startsWith('failed:'), JSON.stringify(calls))
  })

  it('does not stack a second filter across repeated installs', () => {
    installNsHotRegistry()
    installNsHotRegistry()

    assert.equal(listeners.get('unhandledrejection')?.size, 1)
  })
})
