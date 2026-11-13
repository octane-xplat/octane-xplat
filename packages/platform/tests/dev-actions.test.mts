// App-side development-action registry: declaration validation, singleton
// lifetime, and the full announce/poll/invoke loop against a real dev-bridge
// middleware — the same wire the MCP server speaks.

import assert from 'node:assert/strict'
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript-classic'
import { devBridge } from '../../cli/src/mcp/dev-bridge.ts'

// Compile a src module to CJS and evaluate it with a sibling-file resolver,
// so dev-actions.ts loads dev-bridge.web.ts + dev-actions-schema.ts the way a
// web bundle resolves them. Native contract cases mock only Device; they do
// not establish NativeScript runtime, native fetch or OS-input acceptance.
const compile = async (file) =>
  ts.transpile(await readFile(new URL(`../src/${file}.ts`, import.meta.url), 'utf8'), {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  })

const SOURCES = {}

async function loadDevActions(globals = {}) {
  let devBridgeSource = await compile(globals.os ? 'dev-bridge' : 'dev-bridge.web')

  if (globals.moduleToken) {
    // The NativeScript device transform injects defines as module-scope
    // consts, not globalThis properties.
    devBridgeSource = `const __XPLAT_DEV_BRIDGE__ = { token: ${JSON.stringify(globals.moduleToken)} };\n${devBridgeSource}`
  }

  const modules = {
    './dev-actions-schema': await compile('dev-actions-schema'),
    './readiness-state': await compile('readiness-state'),
    './dev-bridge': devBridgeSource,
  }

  const sandbox = {
    exports: {},
    console: globals.console ?? console,
    setInterval,
    clearInterval,
    setTimeout,
    clearTimeout,
    queueMicrotask,
    AbortController,
    Promise,
    Date,
    Math,
    fetch: globals.fetch ?? fetch,
    WebSocket: globals.WebSocket,
    location: { origin: globals.origin },
    __XPLAT_DEV_BRIDGE__: globals.token
      ? {
          token: globals.token,
          socket: globals.socket,
          instanceId: globals.instanceId,
          targetId: globals.targetId,
        }
      : undefined,
    __NS_HTTP_ORIGIN__: globals.os ? globals.origin : undefined,
  }

  sandbox.globalThis = sandbox

  const loaded = new Map()

  sandbox.require = (spec) => {
    if (loaded.has(spec)) {
      return loaded.get(spec)
    }

    if (spec === '@nativescript/core' && globals.os) {
      return { Device: { os: globals.os } }
    }

    if (
      spec === './dev-actions-schema' ||
      spec === './dev-bridge' ||
      spec === './readiness-state'
    ) {
      const inner = { ...sandbox, exports: {}, require: sandbox.require, console }

      inner.globalThis = sandbox
      vm.runInNewContext(modules[spec], inner)
      loaded.set(spec, inner.exports)
      return inner.exports
    }

    throw new Error(`unexpected require ${spec}`)
  }

  vm.runInNewContext((SOURCES.devActions ??= await compile('dev-actions-registry')), {
    ...sandbox,
    require: sandbox.require,
  })

  return { exports: sandbox.exports, sandbox, readiness: sandbox.require('./readiness-state') }
}

async function makeBridge(t) {
  const plugin = devBridge({ appRoot: '/tmp' })
  const token = JSON.parse(plugin.config().define.__XPLAT_DEV_BRIDGE__).token
  let middleware
  const server = http.createServer((req, res) =>
    middleware(req, res, () => {
      res.statusCode = 404
      res.end()
    }),
  )

  plugin.configureServer({
    middlewares: { use: (fn) => (middleware = fn) },
    config: { root: '/tmp', server: {} },
    httpServer: server,
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))

  const origin = `http://127.0.0.1:${server.address().port}`

  t.after(async () => {
    server.closeAllConnections?.()
    await new Promise((resolve) => server.close(resolve))
  })

  const call = (method, path, body) => {
    const init = { method, headers: { 'x-xplat-dev-token': token } }

    if (body) {
      init.headers['content-type'] = 'application/json'
      init.body = JSON.stringify(body)
    }

    return fetch(`${origin}/__xplat_dev__${path}`, init).then((r) => r.json())
  }

  return { origin, token, call }
}

const spec = (over = {}) => ({
  id: 'auth.login-as-test-admin',
  title: 'Log in as test admin',
  description: 'Signs in a privileged test user.',
  effects: { summary: 'changes the active test session', auth: true },
  run: async () => ({ role: 'admin' }),
  ...over,
})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const until = async (fn, timeoutMs = 5_000) => {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const value = await fn()

    if (value) {
      return value
    }

    await sleep(25)
  }

  return null
}

test('declarations are validated and duplicate ids rejected, never replaced', async () => {
  const { exports: api } = await loadDevActions()

  assert.throws(() => api.registerDevAction({ id: 'x' }), /Invalid dev action/)
  assert.throws(() => api.registerDevAction(spec({ id: 'bad id!' })), /id/)

  const handle = api.registerDevAction(spec())

  assert.equal(api.devActionsRevision(), 1)
  assert.throws(() => api.registerDevAction(spec()), /already registered/)

  handle.dispose()
  assert.equal(api.devActionsRevision(), 2)
  assert.equal(api.listDevActions().length, 0)
})

test('no endpoint means the bridge stays inert instead of pretending a channel', async () => {
  const { exports: api } = await loadDevActions({ origin: undefined, token: undefined })
  const bridge = api.startDevActionBridge()

  assert.equal(bridge.state, 'unavailable')
  assert.match(bridge.lastError, /no dev-bridge endpoint/i)
})

test('stopping a bridge safely drains a queued handler announcement', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const action = api.defineDevAction(declaration({ id: 'cleanup.queued' }))
  const handle = api.startDevActionBridge()
  const detach = api.attachDevActionHandler(action, () => ({}))

  // Attachment queued an announcement; stop and dispose in the same turn.
  handle.stop()
  detach()
  action.dispose()
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(handle.state, 'stopped')
  assert.equal(api.listDevActions().length, 0)
})

test('the app announces its registry; mutations re-announce a new revision', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })

  api.registerDevAction(spec())
  api.registerDevAction(
    spec({
      id: 'performance.prepare-scenario',
      title: 'Prepare performance scenario',
      description: 'Loads a fixture dataset.',
      input: { fields: { scale: { type: 'integer', default: 1000 } } },
      result: { fields: { count: { type: 'integer' }, seed: { type: 'integer' } } },
      effects: { summary: 'loads fixture data', testData: true },
      run: async (input) => ({ count: input.scale, seed: 7 }),
    }),
  )

  const handle = api.startDevActionBridge({ appLabel: 'test-app' })

  t.after(() => handle.stop())

  const seen = await until(async () => {
    const registry = await bridge.call('GET', '/registry')

    return registry.instances[0]?.revision === 2 && registry.instances[0]?.appLabel === 'test-app'
      ? registry.instances[0]
      : null
  })

  assert.equal(seen.platform, 'web')
  assert.equal(seen.appLabel, 'test-app')
  assert.equal(seen.revision, 2)
  assert.deepEqual(seen.actions.map((a) => a.id).sort(), [
    'auth.login-as-test-admin',
    'performance.prepare-scenario',
  ])

  // Owner disposal removes the action and bumps the announced revision.
  const extra = api.registerDevAction(spec({ id: 'temp.action', run: async () => ({}) }))

  await until(async () => (await bridge.call('GET', '/registry')).instances[0]?.revision === 3)
  extra.dispose()

  const reg = await until(async () => {
    const r = (await bridge.call('GET', '/registry')).instances[0]

    return r?.revision === 4 ? r : null
  })

  assert.equal(reg.actions.length, 2)
})

test('a declaration alone announces automatically without bridge setup', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })

  api.registerDevAction(spec())
  t.after(() => api.startDevActionBridge().stop())

  const seen = await until(async () => (await bridge.call('GET', '/registry')).instances[0])

  assert.equal(seen.actions[0].id, 'auth.login-as-test-admin')
  assert.equal(seen.revision, 1)
})

test('native endpoint contract requires both the dev origin and token', async () => {
  for (const globals of [{ origin: 'http://127.0.0.1:1' }, { token: 'test-token' }]) {
    const { exports: api } = await loadDevActions({ os: 'iOS', ...globals })

    assert.equal(api.startDevActionBridge().state, 'unavailable')
  }
})

test('native endpoint accepts a module-scope token define without a global', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({
    os: 'Android',
    origin: bridge.origin,
    moduleToken: bridge.token,
  })

  t.after(() => api.startDevActionBridge().stop())

  const action = api.registerDevAction(spec())

  t.after(() => action.dispose())

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])

  assert.ok(instance, 'module-scope __XPLAT_DEV_BRIDGE__ const must be discovered')
  assert.equal(instance.platform, 'android')
})

test('iOS action wire contract announces automatically and rechecks availability before execution', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({
    os: 'iOS',
    origin: bridge.origin,
    token: bridge.token,
  })

  let ready = true
  let calls = 0
  const action = api.registerDevAction(
    spec({
      availability: { platforms: ['ios'], ready: () => ready },
      result: { fields: { role: { type: 'string' } } },
      run: () => {
        calls++
        return { role: 'test-admin' }
      },
    }),
  )

  t.after(() => api.startDevActionBridge().stop())

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])

  assert.ok(instance, 'native declaration must announce without manual bridge setup')
  assert.equal(instance.platform, 'ios')
  assert.equal(instance.actions[0].availability.ready, true)

  const invoke = async (requestId) => {
    await bridge.call('POST', '/invoke', {
      requestId,
      appInstanceId: instance.appInstanceId,
      actionId: instance.actions[0].id,
      registryRevision: instance.revision,
      input: {},
    })

    return until(async () => (await bridge.call('GET', `/invoke/${requestId}?wait=500`)).outcome)
  }

  ready = false

  const unavailable = await invoke('native_unavailable')

  assert.equal(unavailable.status, 'failed')
  assert.equal(unavailable.error.code, 'unavailable')
  assert.equal(calls, 0)
  ready = true

  const result = await invoke('native_ready')

  assert.equal(result.status, 'succeeded')
  assert.deepEqual(result.result, { role: 'test-admin' })
  assert.equal(calls, 1)
  action.dispose()

  const removed = await until(async () => {
    const value = (await bridge.call('GET', '/registry')).instances[0]

    return value?.revision === 2 && value.actions.length === 0 ? value : null
  })

  assert.ok(removed, 'owner disposal must remove the native action from discovery')
})

test('invocation runs the handler; invalid input and stale revisions are rejected in-app', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const calls = []

  api.registerDevAction(
    spec({
      id: 'perf.prepare',
      input: { fields: { scale: { type: 'integer', default: 100 } } },
      result: { fields: { count: { type: 'integer' } } },
      run: async (input) => {
        calls.push(input)
        return { count: input.scale }
      },
    }),
  )

  const handle = api.startDevActionBridge()

  t.after(() => handle.stop())

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])

  const revision = instance.revision

  // Invalid input — the app rejects it before running the handler.
  await bridge.call('POST', '/invoke', {
    requestId: 'req_bad',
    appInstanceId: instance.appInstanceId,
    actionId: 'perf.prepare',
    registryRevision: revision,
    input: { scale: 'lots' },
  })

  const bad = await until(
    async () => (await bridge.call('GET', '/invoke/req_bad?wait=500')).outcome,
  )

  assert.equal(bad.status, 'failed')
  assert.equal(bad.error.code, 'invalid_selection')
  assert.equal(calls.length, 0)

  // Stale revision — rejected without running.
  await bridge.call('POST', '/invoke', {
    requestId: 'req_stale',
    appInstanceId: instance.appInstanceId,
    actionId: 'perf.prepare',
    registryRevision: revision + 9,
    input: {},
  })

  const stale = await until(
    async () => (await bridge.call('GET', '/invoke/req_stale?wait=500')).outcome,
  )

  assert.equal(stale.status, 'failed')
  assert.equal(stale.error.code, 'stale_identity')

  // Valid call — defaults applied, result validated.
  await bridge.call('POST', '/invoke', {
    requestId: 'req_ok',
    appInstanceId: instance.appInstanceId,
    actionId: 'perf.prepare',
    registryRevision: revision,
    input: {},
  })

  const ok = await until(async () => (await bridge.call('GET', '/invoke/req_ok?wait=500')).outcome)

  assert.equal(ok.status, 'succeeded')
  assert.deepEqual(ok.result, { count: 100 })
  assert.equal(calls.length, 1)

  // A repeated request id re-posts the outcome without re-running.
  await bridge.call('POST', '/invoke', {
    requestId: 'req_ok',
    appInstanceId: instance.appInstanceId,
    actionId: 'perf.prepare',
    registryRevision: revision,
    input: {},
  })

  await sleep(100)
  assert.equal(calls.length, 1)
})

test('serialized actions run one at a time; cancellation aborts the handler', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const order = []
  let releaseFirst

  api.registerDevAction(
    spec({
      id: 'serial.work',
      input: { fields: { n: { type: 'integer' } } },
      execution: { cancellable: true },
      run: (input, context) =>
        new Promise((resolve) => {
          order.push(input.n)
          if (input.n === 1) {
            releaseFirst = () => resolve({})
          }

          context.signal.addEventListener('abort', () => resolve({ aborted: true }))
        }),
    }),
  )

  api.registerDevAction(
    spec({
      id: 'overlap.ping',
      input: { fields: { n: { type: 'integer' } } },
      execution: { concurrency: 'overlap' },
      result: {},
      run: async (input) => {
        order.push(`ping-${input.n}`)
        return {}
      },
    }),
  )

  const handle = api.startDevActionBridge()

  t.after(() => handle.stop())

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const invoke = (requestId, actionId, input = {}) =>
    bridge.call('POST', '/invoke', {
      requestId,
      appInstanceId: instance.appInstanceId,
      actionId,
      registryRevision: instance.revision,
      input,
    })

  await invoke('req_1', 'serial.work', { n: 1 })
  await invoke('req_2', 'serial.work', { n: 2 })
  await invoke('req_3', 'overlap.ping', { n: 3 })

  // The overlap action finishes while the first serialized action still runs.
  const ping = await until(async () => (await bridge.call('GET', '/invoke/req_3?wait=500')).outcome)

  assert.equal(ping.status, 'succeeded')
  assert.equal((await bridge.call('GET', '/invoke/req_2')).state, 'delivered')

  // Cancel the queued serialized action, then release the first.
  await bridge.call('POST', '/invoke/cancel', { requestId: 'req_2' })
  releaseFirst()

  const first = await until(
    async () => (await bridge.call('GET', '/invoke/req_1?wait=500')).outcome,
  )

  const second = await until(
    async () => (await bridge.call('GET', '/invoke/req_2?wait=500')).outcome,
  )

  assert.equal(first.status, 'succeeded')
  assert.equal(second.status, 'cancelled')
  // The cancelled serialized action never ran its handler.
  assert.deepEqual(order, [1, 'ping-3'])
})

test('output that violates the result contract reports a failure, not a silent pass', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })

  api.registerDevAction(
    spec({
      id: 'contract.breaks',
      result: { fields: { role: { type: 'string' } } },
      run: async () => ({ role: 42 }),
    }),
  )

  const handle = api.startDevActionBridge()

  t.after(() => handle.stop())

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])

  await bridge.call('POST', '/invoke', {
    requestId: 'req_out',
    appInstanceId: instance.appInstanceId,
    actionId: 'contract.breaks',
    registryRevision: instance.revision,
    input: {},
  })

  const outcome = await until(
    async () => (await bridge.call('GET', '/invoke/req_out?wait=500')).outcome,
  )

  assert.equal(outcome.status, 'failed')
  assert.match(outcome.error.message, /result contract/)
  assert.equal(outcome.error.failures, undefined)
})

const declaration = (over = {}) => {
  const { run: _run, ...rest } = spec(over)

  return rest
}

const stubConsole = () => {
  const warnings = []

  return {
    warnings,
    console: {
      ...console,
      warn: (message) => warnings.push(String(message)),
      error: () => {},
    },
  }
}

const invokeAndAwait = async (bridge, instance, requestId, actionId, input = {}) => {
  await bridge.call('POST', '/invoke', {
    requestId,
    appInstanceId: instance.appInstanceId,
    actionId,
    registryRevision: instance.revision,
    input,
  })

  return until(async () => (await bridge.call('GET', `/invoke/${requestId}?wait=500`)).outcome)
}

test('a defined action without a handler announces unavailable; invoke is rejected', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const definition = api.defineDevAction(declaration())

  t.after(() => definition.dispose())
  t.after(() => api.startDevActionBridge().stop())

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const action = instance.actions.find((a) => a.id === 'auth.login-as-test-admin')

  assert.equal(action.availability.ready, false)
  assert.match(
    action.availability.reason,
    /no handler attached; its owning component is not mounted/,
  )

  const outcome = await invokeAndAwait(bridge, instance, 'req_nohandler', action.id)

  assert.equal(outcome.status, 'failed')
  assert.equal(outcome.error.code, 'unavailable')
})

test('attaching a handler flips availability and re-announces without bumping the revision', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const definition = api.defineDevAction(declaration())

  t.after(() => definition.dispose())
  t.after(() => api.startDevActionBridge().stop())

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const revision = api.devActionsRevision()

  assert.equal(instance.actions[0].availability.ready, false)

  const detach = api.attachDevActionHandler(definition, async () => ({}))

  assert.equal(api.devActionsRevision(), revision)

  const ready = await until(async () => {
    const value = (await bridge.call('GET', '/registry')).instances[0]

    return value?.actions[0]?.availability.ready === true ? value : null
  })

  assert.equal(ready.revision, instance.revision)

  detach()
  detach()

  const gone = await until(async () => {
    const value = (await bridge.call('GET', '/registry')).instances[0]

    return value?.actions[0]?.availability.ready === false ? value : null
  })

  assert.equal(gone.revision, instance.revision)
  assert.equal(api.devActionsRevision(), revision)
})

test('the most recently attached handler wins; detaching it restores the previous one', async (t) => {
  const bridge = await makeBridge(t)
  const stub = stubConsole()
  const { exports: api } = await loadDevActions({
    origin: bridge.origin,
    token: bridge.token,
    console: stub.console,
  })

  const definition = api.defineDevAction(
    declaration({ result: { fields: { who: { type: 'string' } } } }),
  )

  t.after(() => definition.dispose())
  t.after(() => api.startDevActionBridge().stop())

  const detachFirst = api.attachDevActionHandler(definition, async () => ({ who: 'first' }))
  const detachSecond = api.attachDevActionHandler(definition, async () => ({ who: 'second' }))

  t.after(detachFirst)

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const second = await invokeAndAwait(bridge, instance, 'req_newest', definition.id)

  assert.equal(second.status, 'succeeded')
  assert.deepEqual(second.result, { who: 'second' })
  assert.ok(
    stub.warnings.some((m) =>
      m.includes('Dev action "auth.login-as-test-admin" has 2 attached handlers'),
    ),
  )

  detachSecond()

  const first = await invokeAndAwait(bridge, instance, 'req_restored', definition.id)

  assert.equal(first.status, 'succeeded')
  assert.deepEqual(first.result, { who: 'first' })
})

test('disposing and redefining a declaration keeps component-attached handlers working', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  let definition = api.defineDevAction(
    declaration({ result: { fields: { ok: { type: 'boolean' } } } }),
  )

  t.after(() => api.startDevActionBridge().stop())

  const detach = api.attachDevActionHandler(definition, async () => ({ ok: true }))

  t.after(detach)
  definition.dispose()
  definition = api.defineDevAction(declaration({ result: { fields: { ok: { type: 'boolean' } } } }))
  t.after(() => definition.dispose())

  const revision = api.devActionsRevision()
  const instance = await until(async () => {
    const value = (await bridge.call('GET', '/registry')).instances[0]

    return value?.revision === revision && value.actions[0]?.availability.ready === true
      ? value
      : null
  })

  const outcome = await invokeAndAwait(bridge, instance, 'req_hmr', definition.id)

  assert.equal(outcome.status, 'succeeded', JSON.stringify(outcome))
})

test('detaching an owner mid-run aborts the invocation', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  let started
  const startedPromise = new Promise((resolve) => (started = resolve))
  const definition = api.defineDevAction(declaration({ execution: { cancellable: true } }))

  t.after(() => definition.dispose())
  t.after(() => api.startDevActionBridge().stop())

  const detach = api.attachDevActionHandler(
    definition,
    (input, context) =>
      new Promise((resolve, reject) => {
        started()
        context.signal.addEventListener('abort', () => reject(new Error('aborted')))
      }),
  )

  const instance = await until(async () => {
    const value = (await bridge.call('GET', '/registry')).instances[0]

    return value?.actions[0]?.availability.ready === true ? value : null
  })

  await bridge.call('POST', '/invoke', {
    requestId: 'req_orphan',
    appInstanceId: instance.appInstanceId,
    actionId: definition.id,
    registryRevision: instance.revision,
    input: {},
  })

  await startedPromise
  detach()

  const outcome = await until(
    async () => (await bridge.call('GET', '/invoke/req_orphan?wait=500')).outcome,
  )

  assert.equal(outcome.status, 'cancelled')
  assert.equal(outcome.error?.failures, undefined)
})

test('registerDevAction disposes its declaration and only its own handler', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })

  t.after(() => api.startDevActionBridge().stop())

  const handle = api.registerDevAction(spec({ run: async () => ({ who: 'module' }) }))

  assert.throws(() => api.registerDevAction(spec()), /already registered/)

  const detach = api.attachDevActionHandler('auth.login-as-test-admin', async () => ({
    who: 'component',
  }))

  t.after(detach)

  handle.dispose()
  assert.equal(api.listDevActions().length, 0)

  // The component handler survives: redefining the declaration revives it.
  const definition = api.defineDevAction(
    declaration({ result: { fields: { who: { type: 'string' } } } }),
  )

  t.after(() => definition.dispose())

  const revision = api.devActionsRevision()
  const instance = await until(async () => {
    const value = (await bridge.call('GET', '/registry')).instances[0]

    return value?.revision === revision && value.actions[0]?.availability.ready === true
      ? value
      : null
  })

  const outcome = await invokeAndAwait(bridge, instance, 'req_ownhandler', definition.id)

  assert.equal(outcome.status, 'succeeded')
  assert.deepEqual(outcome.result, { who: 'component' })
})

test('retained inline declarations share owners, resolve conflicts, and yield to static declarations', async () => {
  const stub = stubConsole()
  const { exports: api } = await loadDevActions({ console: stub.console })
  const decl = declaration({ id: 'inline.thing', title: 'Inline thing' })
  const key = api.devActionDeclarationKey(decl)

  const release1 = api.retainDevAction(decl, key)
  const release2 = api.retainDevAction(decl, key)

  assert.equal(api.devActionsRevision(), 1)
  assert.equal(api.listDevActions().length, 1)

  release1()
  assert.equal(api.listDevActions().length, 1)
  release2()
  release2()
  assert.equal(api.listDevActions().length, 0)
  assert.equal(api.devActionsRevision(), 2)

  // A conflicting inline declaration replaces the spec, warns, and bumps.
  const other = declaration({ id: 'inline.thing', title: 'Other thing' })
  const release3 = api.retainDevAction(decl, key)
  const release4 = api.retainDevAction(other, api.devActionDeclarationKey(other))

  assert.ok(stub.warnings.some((m) => m.includes('conflicting inline declarations')))
  assert.equal(api.listDevActions()[0].title, 'Other thing')
  assert.equal(api.devActionsRevision(), 4)
  release3()
  release4()

  // A static declaration of the same id wins; the inline one is ignored.
  const definition = api.defineDevAction(decl)
  const release5 = api.retainDevAction(other, api.devActionDeclarationKey(other))

  assert.ok(stub.warnings.some((m) => m.includes('Inline dev action declaration')))
  assert.equal(api.listDevActions()[0].title, 'Inline thing')
  release5()
  assert.equal(api.listDevActions()[0].title, 'Inline thing')
  definition.dispose()
})

test('dev effects run every attached handler and report a handler count', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const effect = api.defineDevEffect(
    declaration({
      id: 'fixtures.reset-ui',
      title: 'Reset UI fixtures',
      input: { fields: { scope: { type: 'string', default: 'all' } } },
    }),
  )

  t.after(() => effect.dispose())
  t.after(() => api.startDevActionBridge().stop())

  // Zero attached handlers is a successful no-op broadcast.
  let instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  let outcome = await invokeAndAwait(bridge, instance, 'req_fx0', effect.id)

  assert.equal(outcome.status, 'succeeded')
  assert.deepEqual(outcome.result, { handlerCount: 0 })

  const calls = []

  api.attachDevEffectHandler(effect, (input) => calls.push(`a:${input.scope}`))
  api.attachDevEffectHandler(effect, (input) => calls.push(`b:${input.scope}`))
  instance = await until(async () => {
    const value = (await bridge.call('GET', '/registry')).instances[0]

    return value?.actions[0]?.availability.ready === true ? value : null
  })

  outcome = await invokeAndAwait(bridge, instance, 'req_fx2', effect.id)
  assert.equal(outcome.status, 'succeeded')
  assert.deepEqual(outcome.result, { handlerCount: 2 })
  assert.deepEqual(calls, ['a:all', 'b:all'])
})

test('a failing effect handler fails the broadcast without stopping the rest', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const effect = api.defineDevEffect(declaration({ id: 'fixtures.reset-ui' }))

  t.after(() => effect.dispose())
  t.after(() => api.startDevActionBridge().stop())

  const calls = []

  api.attachDevEffectHandler(effect, () => {
    calls.push('first')
    throw new Error('first blew up')
  })

  api.attachDevEffectHandler(effect, () => calls.push('second'))

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const outcome = await invokeAndAwait(bridge, instance, 'req_fxfail', effect.id)

  assert.equal(outcome.status, 'failed')
  assert.equal(outcome.error.code, 'execution_failure')
  assert.match(outcome.error.message, /1 of 2 handlers failed: first blew up/)
  assert.deepEqual(calls, ['first', 'second'])
  assert.ok(outcome.partialEffects.includes('1 of 2 handlers completed'))
})

test('failed outcomes return structured per-handler failure records with labels', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const effect = api.defineDevEffect(declaration({ id: 'fixtures.reset-ui' }))

  t.after(() => effect.dispose())
  t.after(() => api.startDevActionBridge().stop())

  api.attachDevEffectHandler(effect, () => {}, { label: 'A' })
  api.attachDevEffectHandler(
    effect,
    () => {
      throw new TypeError('boom')
    },
    { label: 'B' },
  )

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const outcome = await invokeAndAwait(bridge, instance, 'req_fxrec', effect.id)

  assert.equal(outcome.status, 'failed')
  assert.equal(outcome.error.failures.length, 1)

  const record = outcome.error.failures[0]

  assert.equal(record.handler, 1)
  assert.equal(record.label, 'B')
  assert.equal(record.name, 'TypeError')
  assert.equal(record.message, 'boom')
  assert.equal(typeof record.stack, 'string')
})

test('a handler throwing DevNavigationError surfaces its protocol code', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const definition = api.defineDevAction(declaration())

  t.after(() => definition.dispose())
  t.after(() => api.startDevActionBridge().stop())

  api.attachDevActionHandler(definition, () => {
    throw new api.DevNavigationError('navigation_blocked', 'a navigation blocker held the attempt')
  })

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const outcome = await invokeAndAwait(bridge, instance, 'req_navcode', definition.id)

  assert.equal(outcome.status, 'failed')
  assert.equal(outcome.error.code, 'navigation_blocked')
  assert.match(outcome.error.message, /blocker held the attempt/)
})

test('a single-handler action reports one failure record; thrown values normalize', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const definition = api.defineDevAction(declaration())

  t.after(() => definition.dispose())
  t.after(() => api.startDevActionBridge().stop())

  api.attachDevActionHandler(definition, () => {
    throw 'kaboom'
  })

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const outcome = await invokeAndAwait(bridge, instance, 'req_thrown', definition.id)

  assert.equal(outcome.status, 'failed')
  assert.equal(outcome.error.failures.length, 1)

  const record = outcome.error.failures[0]

  assert.equal(record.handler, 0)
  assert.equal(record.name, 'ThrownValue')
  assert.equal(record.message, 'kaboom')
  assert.equal(record.label, undefined)
  assert.equal(record.stack, undefined)
})

test('failure records cap at 20 and the summary counts every failure', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const effect = api.defineDevEffect(declaration({ id: 'fixtures.reset-ui' }))

  t.after(() => effect.dispose())
  t.after(() => api.startDevActionBridge().stop())

  for (let i = 0; i < 25; i++) {
    api.attachDevEffectHandler(effect, () => {
      throw new Error(`f${i}`)
    })
  }

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const outcome = await invokeAndAwait(bridge, instance, 'req_fxcap', effect.id)

  assert.equal(outcome.status, 'failed')
  assert.equal(outcome.error.failures.length, 20)
  assert.match(outcome.error.message, /25 of 25 handlers failed/)
  assert.match(outcome.error.message, /\(\+22 more\)/)
})

test('failure stacks are truncated to their bound', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const effect = api.defineDevEffect(declaration({ id: 'fixtures.reset-ui' }))

  t.after(() => effect.dispose())
  t.after(() => api.startDevActionBridge().stop())

  api.attachDevEffectHandler(effect, () => {
    const error = new TypeError('deep')

    error.stack = 'S'.repeat(5000)
    throw error
  })

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const outcome = await invokeAndAwait(bridge, instance, 'req_fxstack', effect.id)

  assert.equal(outcome.status, 'failed')
  assert.equal(outcome.error.failures[0].stack.length, 4097)
  assert.ok(outcome.error.failures[0].stack.endsWith('…'))
})

// ---------- route-declared actions (Layer 2: navigate-then-run) ----------

const makeNavigator = (over = {}) => {
  const navigator = {
    navigated: [],
    listeners: new Set(),
    locationValue: { route: '/home', modal: false },
    async navigate(url) {
      navigator.navigated.push(url)
      return { ok: true, route: url }
    },
    location() {
      return navigator.locationValue
    },
    subscribe(listener) {
      navigator.listeners.add(listener)
      return () => navigator.listeners.delete(listener)
    },
    emit() {
      for (const listener of Array.from(navigator.listeners)) {
        listener()
      }
    },
    ...over,
  }

  return navigator
}

const invokeRouteAction = async (bridge, instance, requestId, actionId, input = {}) => {
  await bridge.call('POST', '/invoke', {
    requestId,
    appInstanceId: instance.appInstanceId,
    actionId,
    registryRevision: instance.revision,
    input,
  })

  return until(async () => (await bridge.call('GET', `/invoke/${requestId}?wait=500`)).outcome)
}

test('a route-declared action navigates, waits for the screen handler, then runs it', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const definition = api.defineDevAction(
    declaration({
      id: 'checkout.confirm',
      route: '/checkout',
      result: { fields: { ok: { type: 'boolean' } } },
    }),
  )

  t.after(() => definition.dispose())
  t.after(() => api.startDevActionBridge().stop())

  let ran = 0
  const navigator = makeNavigator({
    async navigate(url) {
      navigator.navigated.push(url)
      await sleep(20)
      // The mounted screen attaches its handler while navigation settles.
      api.attachDevActionHandler(definition, async () => {
        ran++
        return { ok: true }
      })

      return { ok: true, route: url }
    },
  })

  t.after(api.setDevActionNavigator(navigator))

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const outcome = await invokeRouteAction(bridge, instance, 'req_route', 'checkout.confirm')

  assert.equal(outcome.status, 'succeeded', JSON.stringify(outcome))
  assert.equal(ran, 1)
  assert.deepEqual(navigator.navigated, ['/checkout'])
  assert.ok(outcome.partialEffects.includes('navigated to /checkout'))
})

test('a function route derives its URL from the validated input', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const definition = api.defineDevAction(
    declaration({
      id: 'orders.open',
      route: (input) => `/orders/${input.order}`,
      input: { fields: { order: { type: 'integer', default: 5 } } },
    }),
  )

  t.after(() => definition.dispose())
  t.after(() => api.startDevActionBridge().stop())

  const navigator = makeNavigator({
    async navigate(url) {
      navigator.navigated.push(url)
      api.attachDevActionHandler(definition, async () => ({}))
      return { ok: true, route: url }
    },
  })

  t.after(api.setDevActionNavigator(navigator))

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const outcome = await invokeRouteAction(bridge, instance, 'req_routefn', 'orders.open')

  assert.equal(outcome.status, 'succeeded', JSON.stringify(outcome))
  assert.deepEqual(navigator.navigated, ['/orders/5'])
})

test('an already-attached handler runs immediately without navigating', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const definition = api.defineDevAction(
    declaration({ id: 'checkout.confirm', route: '/checkout' }),
  )

  t.after(() => definition.dispose())
  t.after(() => api.startDevActionBridge().stop())
  t.after(api.attachDevActionHandler(definition, async () => ({})))

  const navigator = makeNavigator()

  t.after(api.setDevActionNavigator(navigator))

  const instance = await until(async () => {
    const value = (await bridge.call('GET', '/registry')).instances[0]

    return value?.actions.find((a) => a.id === 'checkout.confirm')?.availability.ready === true
      ? value
      : null
  })

  const outcome = await invokeRouteAction(bridge, instance, 'req_attached', 'checkout.confirm')

  assert.equal(outcome.status, 'succeeded', JSON.stringify(outcome))
  assert.equal(navigator.navigated.length, 0)
})

test('a blocked navigation fails with its code and never runs the handler', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const definition = api.defineDevAction(
    declaration({ id: 'checkout.confirm', route: '/checkout' }),
  )

  t.after(() => definition.dispose())
  t.after(() => api.startDevActionBridge().stop())

  const navigator = makeNavigator({
    async navigate(url) {
      navigator.navigated.push(url)
      return {
        ok: false,
        code: 'navigation_blocked',
        status: 'pending',
        message: 'a navigation blocker held the attempt',
      }
    },
  })

  t.after(api.setDevActionNavigator(navigator))

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const outcome = await invokeRouteAction(bridge, instance, 'req_blocked', 'checkout.confirm')

  assert.equal(outcome.status, 'failed')
  assert.equal(outcome.error.code, 'navigation_blocked')
  assert.match(outcome.error.message, /pending/)
})

test('navigating without an ever-attaching handler fails unavailable past the deadline', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const definition = api.defineDevAction(
    declaration({
      id: 'checkout.confirm',
      route: '/checkout',
      execution: { timeoutMs: 200 },
    }),
  )

  t.after(() => definition.dispose())
  t.after(() => api.startDevActionBridge().stop())
  t.after(api.setDevActionNavigator(makeNavigator()))

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const outcome = await invokeRouteAction(bridge, instance, 'req_timeout', 'checkout.confirm')

  assert.equal(outcome.status, 'failed')
  assert.equal(outcome.error.code, 'unavailable')
  assert.match(outcome.error.message, /navigated to \/checkout/)
  assert.ok(outcome.partialEffects.includes('navigated to /checkout'))
})

test('an unreachable handler outcome posts within half the caller deadline', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const definition = api.defineDevAction(
    declaration({
      id: 'checkout.confirm',
      route: '/checkout',
      execution: { timeoutMs: 400 },
    }),
  )

  t.after(() => definition.dispose())
  t.after(() => api.startDevActionBridge().stop())
  t.after(api.setDevActionNavigator(makeNavigator()))

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const started = Date.now()
  const outcome = await invokeRouteAction(bridge, instance, 'req_halfbudget', 'checkout.confirm')
  const elapsed = Date.now() - started

  assert.equal(outcome.status, 'failed')
  assert.equal(outcome.error.code, 'unavailable')
  assert.match(
    outcome.error.message,
    /navigated to \/checkout but action "checkout\.confirm" is still unavailable/,
  )

  // Half of the 400ms bound is spent navigating + waiting so the caller's
  // deadline still fits the remaining handler execution and outcome post.
  assert.ok(elapsed < 400, `expected the unavailable outcome under 400ms, took ${elapsed}ms`)
})

test('a declared route without an installed navigator stays unavailable without dispatch', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const definition = api.defineDevAction(
    declaration({ id: 'checkout.confirm', route: '/checkout' }),
  )

  t.after(() => definition.dispose())
  t.after(() => api.startDevActionBridge().stop())

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const outcome = await invokeRouteAction(bridge, instance, 'req_nosnav', 'checkout.confirm')

  assert.equal(outcome.status, 'failed')
  assert.equal(outcome.error.code, 'unavailable')
  assert.match(
    outcome.error.message,
    /route "\/checkout" is declared but no router navigator is installed/,
  )
})

test('the announcement discloses route, navigation effect, location, and re-announces on location change', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const fixed = api.defineDevAction(declaration({ id: 'checkout.confirm', route: '/checkout' }))
  const derived = api.defineDevAction(
    declaration({ id: 'orders.open', route: (input) => `/orders/${input.order}` }),
  )

  t.after(() => {
    fixed.dispose()
    derived.dispose()
  })

  t.after(() => api.startDevActionBridge().stop())

  const navigator = makeNavigator()

  t.after(api.setDevActionNavigator(navigator))

  const instance = await until(async () => {
    const value = (await bridge.call('GET', '/registry')).instances[0]

    return value?.location?.route === '/home' ? value : null
  })

  const byId = Object.fromEntries(instance.actions.map((a) => [a.id, a]))

  assert.deepEqual(byId['checkout.confirm'].availability.route, { url: '/checkout' })
  assert.deepEqual(byId['orders.open'].availability.route, { fromInput: true })
  assert.equal(byId['checkout.confirm'].effects.navigation, true)
  assert.equal(byId['orders.open'].effects.navigation, true)
  // A route function is never serialized into the announcement.
  assert.equal(byId['orders.open'].route, undefined)
  assert.deepEqual(instance.location, { route: '/home', modal: false })

  const revision = api.devActionsRevision()

  navigator.locationValue = { route: '/checkout', modal: true }
  navigator.emit()

  const moved = await until(async () => {
    const value = (await bridge.call('GET', '/registry')).instances[0]

    return value?.location?.route === '/checkout' ? value : null
  })

  assert.equal(moved.location.modal, true)
  assert.equal(moved.revision, revision)
})

test('dev effects reject a route declaration', async () => {
  const { exports: api } = await loadDevActions()

  assert.throws(
    () => api.defineDevEffect(declaration({ id: 'fixtures.navigate', route: '/x' })),
    /route is only supported for dev actions/,
  )
})

test('a revision bump during navigation does not fail the in-flight call', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })
  const definition = api.defineDevAction(
    declaration({ id: 'checkout.confirm', route: '/checkout' }),
  )

  t.after(() => definition.dispose())
  t.after(() => api.startDevActionBridge().stop())

  let extra
  const navigator = makeNavigator({
    async navigate(url) {
      navigator.navigated.push(url)
      // Mounting the screen registers a new declaration (revision bump) and
      // attaches this action's handler — both are legal mid-invocation.
      extra = api.defineDevAction(declaration({ id: 'checkout.helper' }))
      api.attachDevActionHandler(definition, async () => ({}))
      return { ok: true, route: url }
    },
  })

  t.after(api.setDevActionNavigator(navigator))
  t.after(() => extra?.dispose())

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const outcome = await invokeRouteAction(bridge, instance, 'req_revbump', 'checkout.confirm')

  assert.equal(outcome.status, 'succeeded', JSON.stringify(outcome))
})

test('native socket bridge authenticates the app, updates its registry and stops without HTTP fallback', async (t) => {
  const sockets = []
  class Socket {
    readyState = 0
    frames = []
    constructor(url) {
      this.url = url
      sockets.push(this)
    }
    send(data) {
      this.frames.push(JSON.parse(data))
    }
    close() {
      this.readyState = 3
      this.onclose?.()
    }
    open() {
      this.readyState = 1
      this.onopen?.()
    }
    receive(frame) {
      this.onmessage?.({ data: JSON.stringify(frame) })
    }
  }

  const instanceId = 'a'.repeat(32)
  let httpCalls = 0
  const { exports: api } = await loadDevActions({
    origin: 'http://127.0.0.1:5173',
    token: 'app-proof',
    socket: 'ws://127.0.0.1:1234/app?target=web&instance=' + instanceId,
    instanceId,
    targetId: 'web',
    WebSocket: Socket,
    fetch: () => {
      httpCalls++
      throw Error('unexpected HTTP fallback')
    },
  })

  const action = api.registerDevAction({
    id: 'socket.read',
    title: 'Socket read',
    description: 'Read state',
    effects: { summary: 'Read only' },
    run: () => ({}),
  })

  const bridge = api.startDevActionBridge()

  t.after(() => {
    bridge.stop()
    action.dispose()
  })

  assert.equal(sockets.length, 1)

  const socket = sockets[0]

  socket.open()
  assert.equal(socket.frames[0].protocol, 'octane-app-debug')
  assert.equal(socket.frames[0].token, 'app-proof')
  assert.equal(socket.frames[0].registry.actions[0].id, 'socket.read')
  assert.equal(bridge.state, 'connecting')
  socket.receive({
    type: 'registered',
    protocol: 'octane-app-debug',
    version: 1,
    instanceId,
    sessionId: 'sess_observed',
  })

  assert.equal(bridge.state, 'live')
  action.dispose()
  await new Promise((resolve) => queueMicrotask(resolve))
  assert.equal(socket.frames.at(-1).type, 'registry')
  assert.equal(socket.frames.at(-1).registry.actions.length, 0)
  assert.equal(httpCalls, 0)
  bridge.stop()
  assert.equal(bridge.state, 'stopped')
  assert.equal(socket.readyState, 3)
})

test('native socket bridge reports a missing transport instead of using the old HTTP bridge', async (t) => {
  let httpCalls = 0
  const { exports: api } = await loadDevActions({
    origin: 'http://127.0.0.1:5173',
    token: 'app-proof',
    socket: 'ws://127.0.0.1:1234/app',
    instanceId: 'a'.repeat(32),
    targetId: 'web',
    fetch: () => {
      httpCalls++
      throw Error('unexpected HTTP fallback')
    },
  })

  const bridge = api.startDevActionBridge()

  t.after(() => bridge.stop())
  assert.equal(bridge.state, 'degraded')
  assert.match(bridge.lastError, /WebSocket/)
  assert.equal(httpCalls, 0)
})

test('dev channels join the announcement, gate sends on hub capability, and route messages', async (t) => {
  const sockets = []
  class Socket {
    readyState = 0
    frames = []
    constructor(url) {
      this.url = url
      sockets.push(this)
    }
    send(data) {
      this.frames.push(JSON.parse(data))
    }
    close() {
      this.readyState = 3
      this.onclose?.()
    }
    open() {
      this.readyState = 1
      this.onopen?.()
    }
    receive(frame) {
      this.onmessage?.({ data: JSON.stringify(frame) })
    }
  }

  const instanceId = 'a'.repeat(32)
  const { exports: api } = await loadDevActions({
    origin: 'http://127.0.0.1:5173',
    token: 'app-proof',
    socket: 'ws://127.0.0.1:1234/app?target=web&instance=' + instanceId,
    instanceId,
    targetId: 'web',
    WebSocket: Socket,
    fetch: () => {
      throw Error('unexpected HTTP fallback')
    },
  })

  const states = []
  const messages = []
  const failures = []
  const channel = api.registerDevChannel('probe', 2, {
    message: (frame) => messages.push(frame),
    state: (value) => states.push(value),
    error: (failure) => failures.push(failure),
  })

  const bridge = api.startDevActionBridge()

  t.after(() => {
    bridge.stop()
    channel.dispose()
  })

  assert.deepEqual(states, ['connecting'])
  assert.equal(channel.send('backend', { n: 1 }), false, 'sends before the capability are refused')

  const socket = sockets[0]

  socket.open()
  // The reserved xplat-actions channel always joins the announcement with a
  // bridged registry — panels rely on it to reach action invocation.
  assert.equal(socket.frames[0].registry.channels.length, 2)
  assert.deepEqual(socket.frames[0].registry.channels[0], { id: 'probe', version: 2 })
  assert.deepEqual(socket.frames[0].registry.channels[1], { id: 'xplat-actions', version: 1 })
  socket.receive({
    type: 'registered',
    protocol: 'octane-app-debug',
    version: 1,
    instanceId,
    sessionId: 'sess_channels',
    capabilities: [],
  })

  assert.deepEqual(states.at(-1), 'connecting')
  assert.equal(channel.send('backend', { n: 1 }), false, 'missing capability is not a channel hub')
  socket.close()
  assert.ok(await until(() => sockets.length > 1), 'socket did not reconnect')

  const next = sockets[1]

  next.open()
  next.receive({
    type: 'registered',
    protocol: 'octane-app-debug',
    version: 1,
    instanceId,
    sessionId: 'sess_channels',
    capabilities: ['channels'],
  })

  assert.equal(states.at(-1), 'live')
  assert.equal(channel.send('backend', { n: 2 }), true)
  assert.deepEqual(next.frames.at(-1), {
    type: 'channel',
    channel: 'probe',
    to: 'backend',
    data: { n: 2 },
  })

  next.receive({ type: 'channel', channel: 'probe', from: 'backend', data: { n: 3 } })
  next.receive({ type: 'channel', channel: 'unknown', from: 'panel', panel: 'panel_1', data: 0 })
  next.receive({
    type: 'channel',
    channel: 'probe',
    from: 'panel',
    panel: 'panel_1',
    data: { n: 4 },
  })

  next.receive({ type: 'channel-error', code: 'no_backend', channel: 'probe', detail: 'none' })
  next.receive({ type: 'channel-error', code: 'no_session', channel: 'unknown', detail: 'gone' })
  assert.equal(failures.length, 1)
  assert.equal(JSON.stringify(failures[0]), JSON.stringify({ code: 'no_backend', detail: 'none' }))
  assert.equal(messages.length, 2)
  assert.equal(JSON.stringify(messages[0]), JSON.stringify({ from: 'backend', data: { n: 3 } }))
  assert.equal(
    JSON.stringify(messages[1]),
    JSON.stringify({ from: 'panel', panel: 'panel_1', data: { n: 4 } }),
  )

  assert.throws(
    () => api.registerDevChannel('probe', 1, { message() {}, state() {} }),
    /already registered/,
  )

  channel.dispose()
  await new Promise((resolve) => queueMicrotask(resolve))
  assert.equal(next.frames.at(-1).type, 'registry')
  assert.deepEqual(next.frames.at(-1).registry.channels, [{ id: 'xplat-actions', version: 1 }])
  assert.equal(states.at(-1), 'closed')
  assert.equal(channel.send('backend', { n: 5 }), false)
})

test('the reserved xplat-actions channel dispatches invokes and returns outcomes to panels', async (t) => {
  const sockets = []
  class Socket {
    readyState = 0
    frames = []
    constructor(url) {
      this.url = url
      sockets.push(this)
    }
    send(data) {
      this.frames.push(JSON.parse(data))
    }
    close() {
      this.readyState = 3
      this.onclose?.()
    }
    open() {
      this.readyState = 1
      this.onopen?.()
    }
    receive(frame) {
      this.onmessage?.({ data: JSON.stringify(frame) })
    }
  }

  const instanceId = 'a'.repeat(32)
  const { exports: api } = await loadDevActions({
    origin: 'http://127.0.0.1:5173',
    token: 'app-proof',
    socket: 'ws://127.0.0.1:1234/app?target=web&instance=' + instanceId,
    instanceId,
    targetId: 'web',
    WebSocket: Socket,
    fetch: () => {
      throw Error('unexpected HTTP fallback')
    },
  })

  let releaseSlow
  const action = api.registerDevAction({
    id: 'fixture.ping',
    title: 'Ping',
    description: 'Responds with a pong result.',
    effects: { summary: 'none' },
    input: { fields: {} },
    result: { fields: { pong: { type: 'boolean' } } },
    run: async () => ({ pong: true }),
  })
  const slow = api.registerDevAction({
    id: 'fixture.slow',
    title: 'Slow',
    description: 'Waits for an external release before completing.',
    effects: { summary: 'none' },
    input: { fields: {} },
    execution: { cancellable: true },
    run: () => new Promise((resolve) => (releaseSlow = resolve)),
  })
  const bridge = api.startDevActionBridge()

  t.after(() => {
    bridge.stop()
    action.dispose()
    slow.dispose()
  })

  const socket = sockets[0]
  socket.open()
  socket.receive({
    type: 'registered',
    protocol: 'octane-app-debug',
    version: 1,
    instanceId,
    sessionId: 'sess_actions',
    capabilities: ['channels'],
  })

  // An unknown action fails through the same outcome path, addressed by the
  // caller's requestId, never by socket position.
  socket.receive({
    type: 'channel',
    channel: 'xplat-actions',
    from: 'panel',
    panel: 'panel_1',
    data: { type: 'invoke', requestId: 'req-missing', actionId: 'fixture.absent' },
  })
  socket.receive({
    type: 'channel',
    channel: 'xplat-actions',
    from: 'panel',
    panel: 'panel_1',
    data: { type: 'invoke', requestId: 'req-ping', actionId: 'fixture.ping', input: {} },
  })
  socket.receive({
    type: 'channel',
    channel: 'xplat-actions',
    from: 'panel',
    panel: 'panel_1',
    data: { type: 'invoke', requestId: 'req-slow', actionId: 'fixture.slow', input: {} },
  })
  // Malformed payloads must not throw or degrade the socket.
  socket.receive({
    type: 'channel',
    channel: 'xplat-actions',
    from: 'panel',
    panel: 'panel_1',
    data: { type: 'invoke' },
  })
  socket.receive({ type: 'channel', channel: 'xplat-actions', from: 'panel', data: 'junk' })
  socket.receive({
    type: 'channel',
    channel: 'xplat-actions',
    from: 'panel',
    data: { type: 'cancel', requestIds: ['req-slow'] },
  })

  assert.ok(
    await until(
      () =>
        socket.frames.filter(
          (frame) => frame.type === 'channel' && frame.channel === 'xplat-actions',
        ).length >= 3,
    ),
    'panel invokes produced no channel outcomes',
  )

  const outcomes = {}
  for (const frame of socket.frames) {
    if (frame.type === 'channel' && frame.channel === 'xplat-actions') {
      outcomes[frame.data.outcome.requestId] = frame.data.outcome
    }
  }

  assert.equal(outcomes['req-missing'].status, 'failed')
  assert.equal(outcomes['req-missing'].error.code, 'invalid_selection')
  assert.equal(outcomes['req-ping'].status, 'succeeded')
  assert.deepEqual(outcomes['req-ping'].result, { pong: true })
  assert.equal(outcomes['req-slow'].status, 'cancelled')
  assert.equal(bridge.state, 'live')
  releaseSlow?.({})
})

test('dev channels report unavailable on the HTTP polling fallback bridge', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api } = await loadDevActions({ origin: bridge.origin, token: bridge.token })

  t.after(() => api.startDevActionBridge().stop())

  const states = []
  const channel = api.registerDevChannel('fallback', 1, {
    message() {},
    state: (value) => states.push(value),
  })

  t.after(() => channel.dispose())
  assert.deepEqual(states, ['unavailable'])
  assert.equal(channel.send('panels', {}), false)
})

test('scoped actions await work registered by the handler and report timeout blockers', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api, readiness } = await loadDevActions({
    origin: bridge.origin,
    token: bridge.token,
  })

  const scope = readiness.createReadinessScope('Checkout')
  const action = api.defineDevAction(
    declaration({ id: 'checkout.prepare', execution: { timeoutMs: 150 } }),
  )

  let release
  const detach = api.attachDevActionHandler(
    action,
    () => {
      release = scope.register({ label: 'Image decode', pending: true }).dispose
      return {}
    },
    { label: 'Checkout', readiness: scope },
  )

  t.after(() => {
    detach()
    action.dispose()
    scope.dispose()
    api.startDevActionBridge().stop()
  })

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const outcome = await invokeRouteAction(bridge, instance, 'req_pending', action.id)

  assert.equal(outcome.status, 'failed')
  assert.equal(outcome.error.code, 'readiness_timeout')
  assert.deepEqual(outcome.readiness[0].pending, [{ label: 'Image decode', blocking: true }])
  assert.deepEqual(outcome.handlers, [{ handler: 0, label: 'Checkout', status: 'succeeded' }])
  release()
})

test('scoped effects await released work and keep named participant failures', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api, readiness } = await loadDevActions({
    origin: bridge.origin,
    token: bridge.token,
  })

  const scope = readiness.createReadinessScope('Screen')
  const effect = api.defineDevEffect(declaration({ id: 'screen.reset' }))
  const detach = api.attachDevEffectHandler(
    effect,
    () => {
      const release = scope.register({ label: 'Loading fixture', pending: true }).dispose

      setTimeout(release, 60)
      return {}
    },
    { label: 'Screen', readiness: scope },
  )

  t.after(() => {
    detach()
    effect.dispose()
    scope.dispose()
    api.startDevActionBridge().stop()
  })

  let instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const outcome = await invokeRouteAction(bridge, instance, 'req_settle', effect.id)

  assert.equal(outcome.status, 'succeeded')
  assert.deepEqual(outcome.readiness[0].pending, [])
  assert.equal(outcome.handlers[0].label, 'Screen')

  const stop = api.attachDevEffectHandler(
    effect,
    () => {
      throw Error('fixture failure')
    },
    { label: 'FailedPanel' },
  )

  t.after(stop)
  instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])

  const failure = await invokeRouteAction(bridge, instance, 'req_scoped_failure', effect.id)

  assert.equal(failure.status, 'failed')
  assert.deepEqual(
    failure.handlers.map((h) => [h.label, h.status]),
    [
      ['Screen', 'succeeded'],
      ['FailedPanel', 'failed'],
    ],
  )
})

test('detaching a completed handler cancels its outstanding scoped readiness wait', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api, readiness } = await loadDevActions({
    origin: bridge.origin,
    token: bridge.token,
  })

  const scope = readiness.createReadinessScope('Owner')
  const action = api.defineDevAction(
    declaration({ id: 'owner.prepare', execution: { timeoutMs: 2000, cancellable: true } }),
  )

  const detach = api.attachDevActionHandler(
    action,
    () => {
      scope.register({ label: 'Pending owner work', pending: true })
      return {}
    },
    { label: 'Owner', readiness: scope },
  )

  t.after(() => {
    detach()
    action.dispose()
    scope.dispose()
    api.startDevActionBridge().stop()
  })

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const pending = invokeRouteAction(bridge, instance, 'req_detach_wait', action.id)

  await until(() => scope.snapshot().pending.length)
  detach()
  assert.equal((await pending).status, 'cancelled')
})

test('a completed long handler retains a readiness budget from its remaining execution time', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api, readiness } = await loadDevActions({
    origin: bridge.origin,
    token: bridge.token,
  })

  const scope = readiness.createReadinessScope('Slow handler')
  const action = api.defineDevAction(
    declaration({ id: 'slow.prepare', execution: { timeoutMs: 400 } }),
  )

  const detach = api.attachDevActionHandler(
    action,
    async () => {
      await sleep(230)
      return {}
    },
    { readiness: scope },
  )

  t.after(() => {
    detach()
    action.dispose()
    scope.dispose()
    api.startDevActionBridge().stop()
  })

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const outcome = await invokeRouteAction(bridge, instance, 'req_slow_ready', action.id)

  assert.equal(outcome.status, 'succeeded', JSON.stringify(outcome))
})

test('dev actions reject background failures promptly with safe diagnostics', async (t) => {
  const bridge = await makeBridge(t)
  const { exports: api, readiness } = await loadDevActions({
    origin: bridge.origin,
    token: bridge.token,
  })

  const scope = readiness.createReadinessScope('Feed')
  const action = api.defineDevAction(declaration({ id: 'feed.assert' }))
  const task = scope.register({
    label: 'Background refresh',
    pending: false,
    error: Error('private'),
    blocking: false,
  })

  const detach = api.attachDevActionHandler(action, () => ({}), { label: 'Feed', readiness: scope })

  t.after(() => {
    detach()
    task.dispose()
    action.dispose()
    scope.dispose()
    api.startDevActionBridge().stop()
  })

  assert.equal(scope.snapshot().status, 'ready')

  const instance = await until(async () => (await bridge.call('GET', '/registry')).instances[0])
  const outcome = await invokeRouteAction(bridge, instance, 'req_background_failure', action.id)

  assert.equal(outcome.status, 'failed')
  assert.equal(outcome.error.code, 'readiness_failed')
  assert.deepEqual(outcome.readiness[0].pending, [])
  assert.deepEqual(outcome.readiness[0].failures, [
    { label: 'Background refresh', blocking: false },
  ])

  assert.equal(outcome.handlers[0].status, 'succeeded')
  assert.equal(JSON.stringify(outcome).includes('private'), false)
})
