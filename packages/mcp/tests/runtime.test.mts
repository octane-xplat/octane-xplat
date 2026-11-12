// Runtime tools over the Go transport: argv mapping, envelope translation,
// and the honest boundary for launch/build/session-end.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRuntimeService } from '../dist/runtime/service.js'
import { createWorkspaceContext } from '../dist/status.js'
import { makeConsumerApp, makeWorkspace } from './helpers.mts'
import { fakeTransport, ok, fail } from './transport.mts'

const boundContext = (handlers = {}) => {
  const root = makeWorkspace()

  makeConsumerApp(root, '.', { name: 'rt-app' })

  const transport = fakeTransport(handlers)

  return createWorkspaceContext({ workspaceRoot: root, transport })
}

test('targets and sessions route through the contract commands', async () => {
  const context = boundContext({
    targets: (call) => ok({ appRoot: '/', targets: [{ targetId: call.flags.platform ?? 'all' }] }),
    'session list': ok({ sessions: [] }),
    'session status': (call) => ok({ session: { sessionId: call.positionals[0] } }),
  })

  const runtime = createRuntimeService(context)

  const targets = await runtime.listTargets({ platform: 'web' })

  assert.equal(targets.data.targets[0].targetId, 'web')

  const listed = await runtime.listSessions()

  assert.deepEqual(listed.data.sessions, [])

  const status = await runtime.sessionStatus('sess_1')

  assert.equal(status.data.session.sessionId, 'sess_1')
  assert.deepEqual(context.transport.calls.at(-1).command, ['session', 'status'])
})

test('diagnostics maps every selector onto contract flags', async () => {
  const context = boundContext({
    diagnostics: (call) => ok({ flags: call.flags }),
  })

  const runtime = createRuntimeService(context)

  const result = await runtime.readDiagnostics({
    reportId: 'rep_1',
    platform: 'ios',
    sessionId: 'sess_2',
    jobId: 'job_2',
    cursor: 5,
    limit: 25,
    stream: 'stdout',
  })

  assert.equal(result.data.flags.report, 'rep_1')
  assert.equal(result.data.flags.platform, 'ios')
  assert.equal(result.data.flags.session, 'sess_2')
  assert.equal(result.data.flags.job, 'job_2')
  assert.equal(result.data.flags.cursor, 5)
  assert.equal(result.data.flags.limit, 25)
  assert.equal(result.data.flags.stream, 'stdout')
})

test('service errors propagate as contract failures', async () => {
  const context = boundContext({
    'session status': fail('not_found', 'No session "sess_x".', {
      recovery: { action: 'List sessions with xplat_sessions.' },
    }),
  })

  const runtime = createRuntimeService(context)

  const result = await runtime.sessionStatus('sess_x')

  assert.equal(result.ok, false)
  assert.equal(result.error.code, 'not_found')
})

test('launch, build, and session end report the removed surface honestly', async () => {
  const context = boundContext()
  const runtime = createRuntimeService(context)

  for (const [method, args] of [
    ['launch', { target: 'web' }],
    ['build', { platform: 'web' }],
    ['endSession', 'sess_1'],
  ]) {
    const result = await runtime[method](args)

    assert.equal(result.ok, false, method)
    assert.equal(result.error.code, 'unsupported_capability', method)
    assert.ok(result.error.recovery?.action, method)
  }

  assert.equal(context.transport.calls.length, 0, 'removed surface never reaches the transport')
})

test('attach checks the runtime-actions grant before calling the service', async () => {
  const root = makeWorkspace()

  makeConsumerApp(root, '.', { name: 'attach-app' })

  const transport = fakeTransport({ 'session attach': ok({ session: {} }) })
  const context = createWorkspaceContext({
    workspaceRoot: root,
    transport,
    taskAuthorization: false,
  })

  const runtime = createRuntimeService(context)

  const denied = await runtime.attach({ platform: 'web' })

  assert.equal(denied.error.code, 'permission_denied')
  assert.equal(transport.calls.length, 0)

  const granted = createWorkspaceContext({ workspaceRoot: root, transport })
  const allowed = await createRuntimeService(granted).attach({ platform: 'web', targetId: 'web' })

  assert.equal(allowed.ok, true)

  const call = transport.calls.at(-1)

  assert.deepEqual(call.command, ['session', 'attach'])
  assert.equal(call.flags.platform, 'web')
  assert.equal(call.flags.target, 'web')
})
