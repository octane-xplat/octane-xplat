import assert from 'node:assert/strict'
import { test } from 'node:test'
import { join } from 'node:path'
import { createWorkspaceContext } from '../src/status.mjs'
import { createInspectionService } from '../src/inspection/service.mjs'
import { makeConsumerApp, makeWorkspace } from './helpers.mjs'

test('inspection gates capture before connecting and refuses stopped, foreign and attached identities', async () => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'inspection' })
	const context = createWorkspaceContext({ workspaceRoot: root, evidenceRoot: join(root, '.ev') })
	let connections = 0
	const service = createInspectionService(context, {
		connect: () => {
			connections++
			throw new Error('unexpected connection')
		},
	})

	assert.equal((await service.screenshot({ sessionId: 'missing' })).error.code, 'permission_denied')
	assert.equal(connections, 0)
	const session = context.sessions.attach({ appId: '.', platform: 'web', targetId: 'web' })
	assert.equal(
		(await service.inspect({ sessionId: session.sessionId })).error.code,
		'unsupported_capability',
	)

	await context.sessions.end(session.sessionId)
	assert.equal(
		(await service.inspect({ sessionId: session.sessionId })).error.code,
		'stale_identity',
	)

	const foreign = context.sessions.attach({ appId: 'foreign', platform: 'web', targetId: 'other' })
	assert.equal(
		(await service.inspect({ sessionId: foreign.sessionId })).error.code,
		'stale_identity',
	)

	assert.equal(connections, 0)
})

test('stale document, duplicates, private controls and contention never dispatch input', async () => {
	const root = makeWorkspace()
	makeConsumerApp(root, '.', { name: 'inspection' })
	const context = createWorkspaceContext({ workspaceRoot: root, evidenceRoot: join(root, '.ev') })
	const session = context.sessions.bindOwned({ appId: '.', platform: 'web', targetId: 'web' })
	context.sessions.markReady(session.sessionId)
	context.runtime.observationTarget = () => ({
		session: context.sessions.get(session.sessionId),
		endpoint: {
			url: 'http://localhost/',
			browser: { devtoolsUrl: 'http://localhost:1', headless: true },
		},
	})

	const sent = []
	let value = { controls: [{ hidden: false, disabled: false, sensitive: true }], total: 1 }
	const service = createInspectionService(context, {
		connect: async () => ({
			send: async (method) => {
				sent.push(method)
				return method === 'Page.getFrameTree'
					? { frameTree: { frame: { loaderId: 'current' } } }
					: { result: { value } }
			},
			close() {},
		}),
	})

	const args = {
		sessionId: session.sessionId,
		documentId: 'old',
		control: { kind: 'testID', name: 'submit' },
		mechanism: 'dom-event',
	}

	assert.equal((await service.interact(args)).error.code, 'stale_identity')
	args.documentId = 'current'
	assert.equal((await service.interact(args)).error.code, 'unavailable')
	value = { error: { code: 'ambiguous_selection', message: 'duplicate' } }
	assert.equal((await service.interact(args)).error.code, 'ambiguous_selection')
	assert.ok(!sent.some((method) => method.startsWith('Input.')))
	const [one, two] = await Promise.all([
		service.inspect({ sessionId: session.sessionId }),
		service.inspect({ sessionId: session.sessionId }),
	])

	assert.equal(two.error.code, 'target_busy')
	assert.ok(one.error)
})
