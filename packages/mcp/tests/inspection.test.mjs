// Inspection service over the Go transport: grant gating before service
// calls, selector mapping, and the missing capture boundary.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createInspectionService } from '../dist/inspection/service.js'
import { createWorkspaceContext } from '../dist/status.js'
import { makeConsumerApp, makeWorkspace } from './helpers.mjs'
import { fakeTransport, ok } from './transport.mjs'

const boundContext = (handlers = {}, options = {}) => {
  const root = makeWorkspace()

  makeConsumerApp(root, '.', { name: 'inspection' })

  const transport = fakeTransport(handlers)

  return createWorkspaceContext({ workspaceRoot: root, transport, ...options })
}

test('inspect and interact map controls and bounds onto contract flags', async () => {
  const context = boundContext({
    inspect: (call) => ok({ flags: call.flags, session: call.positionals[0] }),
    interact: (call) => ok({ flags: call.flags, session: call.positionals[0] }),
  })

  const service = createInspectionService(context)

  const inspected = await service.inspect({
    sessionId: 'sess_1',
    control: { kind: 'testID', name: 'counter.value' },
    offset: 10,
    limit: 20,
  })

  assert.equal(inspected.data.session, 'sess_1')
  assert.equal(inspected.data.flags.testid, 'counter.value')
  assert.equal(inspected.data.flags.offset, 10)
  assert.equal(inspected.data.flags.limit, 20)

  const clicked = await service.interact({
    sessionId: 'sess_1',
    documentId: 'doc_1',
    control: { kind: 'id', name: 'save' },
    requestKey: 'rk_9',
  })

  assert.equal(clicked.data.flags.document, 'doc_1')
  assert.equal(clicked.data.flags.id, 'save')
  assert.equal(clicked.data.flags.mechanism, 'handler-dispatch')
  assert.equal(clicked.data.flags['request-key'], 'rk_9')
})

test('runtime-actions gates inspect and interact before the service runs', async () => {
  const context = boundContext({}, { taskAuthorization: false })
  const service = createInspectionService(context)

  for (const method of ['inspect', 'interact']) {
    const result = await service[method]({
      sessionId: 'sess_1',
      documentId: 'doc_1',
      control: { kind: 'id', name: 'x' },
    })

    assert.equal(result.error.code, 'permission_denied', method)
  }

  assert.equal(context.transport.calls.length, 0)
})

test('screenshot keeps the visual-capture gate, then reports the missing command', async () => {
  const context = boundContext()
  const service = createInspectionService(context)

  const denied = await service.screenshot({ sessionId: 'sess_1' })

  assert.equal(denied.error.code, 'permission_denied')
  assert.equal(context.transport.calls.length, 0, 'the gate runs before any service call')

  const granted = boundContext({}, { permissionScopes: ['visual-capture'] })
  const unavailable = await createInspectionService(granted).screenshot({ sessionId: 'sess_1' })

  assert.equal(unavailable.error.code, 'unavailable')
  assert.equal(granted.transport.calls.length, 0)
})
