// Dev-action tools over the Go transport: registry list, invoke flags, and
// job status — the service owns admission, dedupe and outcomes.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createDevActionsService } from '../dist/actions/service.js'
import { createWorkspaceContext } from '../dist/status.js'
import { createXplatMcpServer } from '../dist/server.js'
import { makeConsumerApp, makeWorkspace } from './helpers.mjs'
import { fakeTransport, ok, fail, statusFixture } from './transport.mjs'

const boundContext = (handlers = {}, options = {}) => {
  const root = makeWorkspace()
  makeConsumerApp(root, '.', { name: 'actions-app' })
  const transport = fakeTransport(handlers)
  return createWorkspaceContext({ workspaceRoot: root, transport, ...options })
}

test('registry list delegates to `xplat actions list`', async () => {
  const context = boundContext({
    'actions list': ok({ actions: [{ id: 'fixture.ping' }], registryRevision: 3, instances: [] }),
  })
  const service = createDevActionsService(context)

  const result = await service.list(context.discovery.apps[0])
  assert.equal(result.data.registryRevision, 3)
  assert.deepEqual(context.transport.calls.at(-1).command, ['actions', 'list'])
})

test('invoke maps the tool arguments onto contract flags and JSON input', async () => {
  const context = boundContext({
    'actions invoke': (call) =>
      ok({
        job: { jobId: 'job_1', kind: 'dev-action', state: 'queued' },
        deduplicated: false,
        echoed: call.flags,
      }),
  })
  const service = createDevActionsService(context)

  const result = await service.invoke(context.discovery.apps[0], {
    actionId: 'fixture.ping',
    appInstanceId: 'inst_1',
    input: { count: 2 },
    registryRevision: 3,
    requestKey: 'rk_1',
  })

  const flags = result.data.echoed
  assert.equal(flags.action, 'fixture.ping')
  assert.equal(flags.instance, 'inst_1')
  assert.equal(flags.input, '{"count":2}')
  assert.equal(flags.revision, 3)
  assert.equal(flags['request-key'], 'rk_1')
})

test('invoke requires the runtime-actions grant before reaching the service', async () => {
  const context = boundContext({ 'actions invoke': ok({}) }, { taskAuthorization: false })
  const service = createDevActionsService(context)

  const denied = await service.invoke(context.discovery.apps[0], {
    actionId: 'fixture.ping',
    input: {},
  })
  assert.equal(denied.error.code, 'permission_denied')
  assert.equal(context.transport.calls.length, 0)
})

test('action job status returns the job or not_found', async () => {
  const context = boundContext({
    'actions status': (call) =>
      call.positionals[0] === 'job_live'
        ? ok({ job: { jobId: 'job_live', kind: 'dev-action', state: 'running' } })
        : fail('not_found', 'unknown job'),
  })
  const service = createDevActionsService(context)

  const live = await service.describeJob('job_live')
  assert.equal(live.job.state, 'running')

  const missing = await service.describeJob('job_gone')
  assert.equal(missing, null)
  assert.deepEqual(context.transport.calls.at(-1).command, ['actions', 'status'])
})

test('dev-action tools through a real MCP client', async () => {
  const root = makeWorkspace()
  makeConsumerApp(root, '.', { name: 'tool-app' })
  const transport = fakeTransport({
    'actions list': ok({ actions: [{ id: 'fixture.ping' }], registryRevision: 1 }),
    'actions status': ok({ job: { jobId: 'job_9', kind: 'dev-action', state: 'succeeded' } }),
  })
  const context = createWorkspaceContext({ workspaceRoot: root, transport })
  transport.handlers.status = () => ok(statusFixture(context))

  const { server } = createXplatMcpServer(context)
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'test-client', version: '0.0.0' })
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])

  const list = await client.callTool({ name: 'xplat_dev_actions', arguments: {} })
  assert.equal(list.structuredContent.data.registryRevision, 1)

  const status = await client.callTool({
    name: 'xplat_dev_action_status',
    arguments: { jobId: 'job_9' },
  })
  assert.equal(status.structuredContent.data.job.state, 'succeeded')

  const cancel = await client.callTool({
    name: 'xplat_job_cancel',
    arguments: { jobId: 'job_9' },
  })
  assert.equal(cancel.isError, true)
  assert.equal(cancel.structuredContent.error.code, 'unavailable')

  await client.close()
})
