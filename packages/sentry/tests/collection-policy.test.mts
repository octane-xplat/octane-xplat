// Collection-policy contract tests for the sentry service leaves. Each leaf
// is compiled to CommonJS and run in a vm sandbox against a local transport
// stub that mimics the real SDK's pipeline — options.enabled drops at send
// time, beforeSend/beforeBreadcrumb may return null to drop — so tests can
// prove filtered or disabled reports never reach the transport without a
// real Sentry project.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript-classic'

const compile = (source) =>
  ts.transpile(source, {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  })

const [webLeaf, nativeLeaf] = await Promise.all([
  readFile(new URL('../src/sentry.web.ts', import.meta.url), 'utf8').then(compile),
  readFile(new URL('../src/sentry.ts', import.meta.url), 'utf8').then(compile),
])

/** SDK stub honoring the options.enabled/beforeSend/beforeBreadcrumb policy
 *  the real clients enforce, recording everything that would be delivered. */
function sdkStub() {
  const state = { options: undefined, sent: [], crumbs: [], clientClosed: 0 }
  const client = {
    getOptions: () => state.options,
    close: async () => {
      state.clientClosed++
      return state.closeResult ?? true
    },
  }

  const capture = (event) => {
    if (state.options?.enabled === false) {
      return 'event-id'
    }

    const delivered = state.options?.beforeSend
      ? state.options.beforeSend(event, { event_id: 'e' })
      : event

    if (delivered !== null) {
      state.sent.push(delivered)
    }

    return 'event-id'
  }

  const api = {
    init: (options) => {
      state.options = options
    },
    getClient: () => (state.options ? client : undefined),
    getCurrentHub: () => ({ getClient: () => (state.options ? client : undefined) }),
    captureException: (error, context) =>
      capture({ exception: { values: [{ value: String(error) }] }, ...context }),
    captureMessage: (message, level) => capture({ message, level }),
    addBreadcrumb: (crumb) => {
      const kept = state.options?.beforeBreadcrumb ? state.options.beforeBreadcrumb(crumb) : crumb

      if (kept) {
        state.crumbs.push(kept)
      }
    },
    setUser: () => {},
    setTag: () => {},
    setContext: () => {},
    flush: async () => state.flushResult ?? true,
    close: async () => {
      state.clientClosed++
      return state.closeResult ?? true
    },
  }

  return { api, state }
}

function loadLeaf(compiled, modules) {
  const exports = {}

  vm.runInNewContext(compiled, { exports, require: (id) => modules[id] })
  return exports.sentry
}

/** The web leaf over @sentry/browser. */
function web() {
  const stub = sdkStub()

  return {
    sentry: loadLeaf(webLeaf, { '@sentry/browser': stub.api }),
    state: stub.state,
  }
}

/** The iOS/Android leaf over @nativescript-community/sentry plus its wrapper. */
function native() {
  const stub = sdkStub()
  const wrapper = { NATIVE: { closeNativeSdk: async () => (stub.state.nativeClosed = 1) } }

  return {
    sentry: loadLeaf(nativeLeaf, {
      '@nativescript-community/sentry': stub.api,
      '@nativescript-community/sentry/wrapper': wrapper,
    }),
    state: stub.state,
  }
}

const variants = [
  ['web', web],
  ['native', native],
]

for (const [name, make] of variants) {
  test(`${name}: captures before init are dropped`, () => {
    const { sentry, state } = make()

    sentry.setEnabled(true)
    assert.equal(sentry.captureException(new Error('early')), undefined)
    sentry.addBreadcrumb({ category: 'test', message: 'early' })
    assert.deepEqual(state.sent, [])
    assert.deepEqual(state.crumbs, [])
  })

  test(`${name}: beforeSend null drops the event before delivery`, () => {
    const { sentry, state } = make()

    sentry.init({ dsn: 'd', beforeSend: () => null })
    // The SDK still returns a queued id — it is not a delivery acknowledgement.
    assert.equal(sentry.captureException(new Error('drop')), 'event-id')
    assert.equal(sentry.captureMessage('drop'), 'event-id')
    assert.deepEqual(state.sent, [])
  })

  test(`${name}: beforeSend redaction is what the transport sees`, () => {
    const { sentry, state } = make()

    sentry.init({
      dsn: 'd',
      beforeSend: (event) => ({ ...event, extra: undefined, request: undefined }),
    })

    assert.equal(sentry.captureException(new Error('x'), { token: 'private' }), 'event-id')
    assert.equal(state.sent.length, 1)
    assert.equal(state.sent[0].extra, undefined)
    assert.equal(JSON.stringify(state.sent[0]).includes('private'), false)
  })

  test(`${name}: beforeBreadcrumb null drops the crumb`, () => {
    const { sentry, state } = make()

    sentry.init({
      dsn: 'd',
      beforeBreadcrumb: (crumb) => (crumb.category === 'keep' ? crumb : null),
    })

    sentry.addBreadcrumb({ category: 'fetch', message: 'private URL' })
    sentry.addBreadcrumb({ category: 'keep', message: 'visible' })
    assert.equal(state.crumbs.length, 1)
    assert.equal(state.crumbs[0].message, 'visible')
  })

  test(`${name}: enabled:false at init drops every capture`, () => {
    const { sentry, state } = make()

    sentry.init({ dsn: 'd', enabled: false })
    assert.equal(sentry.captureException(new Error('x')), undefined)
    sentry.addBreadcrumb({ category: 'test', message: 'x' })
    assert.deepEqual(state.sent, [])
    assert.deepEqual(state.crumbs, [])
  })

  test(`${name}: setEnabled toggles collection at the wrapper and the SDK`, () => {
    const { sentry, state } = make()

    sentry.init({ dsn: 'd' })
    assert.equal(sentry.captureException(new Error('one')), 'event-id')
    sentry.setEnabled(false)
    assert.equal(state.options.enabled, false)
    assert.equal(sentry.captureException(new Error('two')), undefined)
    sentry.addBreadcrumb({ category: 'test', message: 'dropped' })
    assert.equal(state.sent.length, 1)
    assert.equal(state.crumbs.length, 0)
    sentry.setEnabled(true)
    assert.equal(state.options.enabled, true)
    assert.equal(sentry.captureException(new Error('three')), 'event-id')
    assert.equal(state.sent.length, 2)
  })

  test(`${name}: flush and close return delivery status`, async () => {
    const { sentry, state } = make()

    sentry.init({ dsn: 'd' })
    state.flushResult = false
    assert.equal(await sentry.flush(100), false)
    state.closeResult = false
    assert.equal(await sentry.close(100), false)
  })

  test(`${name}: close stops collection permanently until re-init`, async () => {
    const { sentry, state } = make()

    sentry.init({ dsn: 'd' })
    assert.equal(await sentry.close(), true)
    sentry.setEnabled(true)
    assert.equal(sentry.captureException(new Error('after-close')), undefined)
    assert.deepEqual(state.sent, [])
    sentry.init({ dsn: 'd' })
    assert.equal(sentry.captureException(new Error('reinit')), 'event-id')
    assert.equal(state.sent.length, 1)
  })
}

test('native: close also closes the native SDK', async () => {
  const { sentry, state } = native()

  sentry.init({ dsn: 'd' })
  await sentry.close()
  assert.equal(state.nativeClosed, 1)
})
