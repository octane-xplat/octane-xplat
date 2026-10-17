import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { contractError, isContractError, toContractError } from '../dist/contracts/errors.js'
import { createCapabilityRegistry } from '../dist/contracts/capabilities.js'
import { createPolicyStore } from '../dist/contracts/policy.js'
import { createJobRegistry, createSessionRegistry } from '../dist/contracts/sessions.js'
import {
	createEvidenceStore,
	isOsInputEvidence,
	TRANSCRIPT_LIMITATION_NOTE,
} from '../dist/contracts/evidence.js'

test('contract errors carry code, message, and the smallest corrective action', () => {
	const error = contractError('prerequisite_missing', 'adb not found', {
		recovery: { action: 'Install Android platform-tools' },
		context: { id: 'adb' },
	})

	assert.equal(error.code, 'prerequisite_missing')
	assert.equal(error.recovery.action, 'Install Android platform-tools')
	assert.ok(isContractError(error))
	assert.equal(toContractError(new Error('boom')).code, 'execution_failure')
	assert.equal(toContractError(error).code, 'prerequisite_missing')
})

test('task authorization covers workspace + runtime-actions, never visual-capture', () => {
	const policy = createPolicyStore({ taskAuthorization: true })
	assert.equal(policy.require('workspace').granted, true)
	assert.equal(policy.require('runtime-actions').granted, true)

	const visual = policy.require('visual-capture')
	assert.equal(visual.granted, false)
	assert.equal(visual.error.code, 'permission_denied')
	assert.match(visual.error.recovery.action, /developer/)
})

test('grants are checked at action time, expire, and are revocable', async () => {
	const policy = createPolicyStore({ taskAuthorization: true })
	policy.grant('visual-capture', { expiresAt: new Date(Date.now() - 1).toISOString() })
	assert.equal(policy.require('visual-capture').granted, false)

	policy.grant('visual-capture')
	assert.equal(policy.require('visual-capture').granted, true)
	assert.equal(policy.revoke('visual-capture'), true)
	assert.equal(policy.require('visual-capture').granted, false)

	// Task-authorization baseline is not revocable.
	assert.equal(policy.revoke('workspace'), false)
})

test('requestGrant uses the elicitation channel when one exists', async () => {
	const calls = []
	const policy = createPolicyStore({ taskAuthorization: true })
	policy.setElicitor(async (scope, reason) => {
		calls.push([scope, reason])
		return 'granted'
	})

	const result = await policy.requestGrant('visual-capture', 'Verify the dashboard renders')
	assert.equal(result.granted, true)
	assert.equal(calls[0][0], 'visual-capture')
})

test('requestGrant without a channel records required state, never self-grants', async () => {
	const policy = createPolicyStore({ taskAuthorization: true })
	const result = await policy.requestGrant('visual-capture', 'need it')
	assert.equal(result.granted, false)
	assert.equal(policy.list().find((g) => g.scope === 'visual-capture').state, 'required')
})

test('default capability matrix is honest: server tools supported, runtime unavailable', async () => {
	const registry = createCapabilityRegistry()
	const [matrix] = await registry.matrixFor(
		{
			id: '.',
			name: 'app',
			platforms: ['web'],
			root: '/x',
			relativeRoot: '.',
			kind: 'consumer-app',
		},
		['web'],
	)

	const byId = Object.fromEntries(matrix.capabilities.map((c) => [c.capability, c]))
	assert.equal(byId.project_status.status, 'supported')
	assert.equal(byId.job_control.status, 'supported')
	assert.equal(byId.evidence.status, 'supported')
	assert.equal(byId.build.status, 'unavailable')
	assert.match(byId.build.detail, /provider/)
	assert.equal(byId.build.alternative.command, 'xplat dev --target web')
	assert.equal(byId.screenshot.requiresPermission, 'visual-capture')
	assert.equal(byId.interaction.status, 'unavailable')
})

test('providers override defaults; screenshot stays permission-gated', async () => {
	const registry = createCapabilityRegistry()
	registry.register({
		platform: 'web',
		describe: () => [
			{ capability: 'build', status: 'supported' },
			{
				capability: 'screenshot',
				status: 'permission_gated',
				requiresPermission: 'visual-capture',
			},
		],
	})

	const [matrix] = await registry.matrixFor(
		{
			id: '.',
			name: 'app',
			platforms: ['web'],
			root: '/x',
			relativeRoot: '.',
			kind: 'consumer-app',
		},
		['web'],
	)

	const byId = Object.fromEntries(matrix.capabilities.map((c) => [c.capability, c]))
	assert.equal(byId.build.status, 'supported')
	assert.equal(byId.screenshot.status, 'permission_gated')
	assert.equal(byId.launch.status, 'unavailable') // untouched defaults stay honest
})

test('owned sessions clean up on end; attached sessions are preserved', async () => {
	const sessions = createSessionRegistry()
	let cleaned = false
	const owned = sessions.bindOwned({
		appId: '.',
		platform: 'web',
		targetId: 'web',
		cleanup: async () => {
			cleaned = true
			return { released: ['process'] }
		},
	})

	const attached = sessions.attach({ appId: '.', platform: 'web', targetId: 'web' })

	const ownEnd = await sessions.end(owned.sessionId)
	assert.equal(cleaned, true)
	assert.deepEqual(ownEnd.released, ['process'])

	const attachEnd = await sessions.end(attached.sessionId)
	assert.match(attachEnd.preserved[0], /user-owned/)
})

test('stopped and disconnected sessions are refused with honest errors', async () => {
	const sessions = createSessionRegistry()
	const owned = sessions.bindOwned({ appId: '.', platform: 'web', targetId: 'web' })
	await sessions.end(owned.sessionId)
	const stopped = sessions.requireUsable(owned.sessionId)
	assert.equal(stopped.usable, false)
	assert.equal(stopped.error.code, 'stale_identity')

	const other = sessions.bindOwned({ appId: '.', platform: 'web', targetId: 'web' })
	sessions.markDisconnected(other.sessionId, 'device unplugged')
	const disconnected = sessions.requireUsable(other.sessionId)
	assert.equal(disconnected.error.code, 'disconnected_runtime')
})

test('repeated job requests deduplicate; cancellation is cooperative', async () => {
	const jobs = createJobRegistry()
	let observedSignal
	const first = jobs.start({
		kind: 'build',
		sessionId: 's1',
		requestKey: 'build-web-1',
		run: (signal) =>
			new Promise((resolve) => {
				observedSignal = signal
				signal.addEventListener('abort', () => resolve('aborted'))
			}),
	})

	const second = jobs.start({ kind: 'build', sessionId: 's1', requestKey: 'build-web-1' })
	assert.equal(second.deduplicated, true)
	assert.equal(second.job.jobId, first.job.jobId)

	const cancelled = jobs.cancel(first.job.jobId)
	assert.equal(cancelled.state, 'cancelling')
	await new Promise((r) => setTimeout(r, 10))
	assert.equal(observedSignal.aborted, true)
	assert.equal(jobs.status(first.job.jobId).state, 'cancelled')
})

test('evidence is session-scoped; retain/delete report the transcript limit', () => {
	const root = mkdtempSync(join(tmpdir(), 'xplat-mcp-ev-'))
	const store = createEvidenceStore({ root })
	const record = store.record({
		kind: 'inspection',
		summary: 'host tree snapshot',
		provenance: { platform: 'web', targetId: 'web', mechanism: 'none' },
		artifact: '{"views":[]}',
	})

	assert.equal(record.retention.scope, 'session')

	const retained = store.retain(record.id, { expiresAt: null })
	assert.equal(retained.record.retention.scope, 'retained')
	assert.match(retained.transcriptNote, /transcript/)

	const deleted = store.delete(record.id)
	assert.equal(deleted.deleted, true)
	assert.equal(deleted.transcriptNote, TRANSCRIPT_LIMITATION_NOTE)
})

test('session close deletes session evidence but keeps retained artifacts', () => {
	const root = mkdtempSync(join(tmpdir(), 'xplat-mcp-ev-'))
	const store = createEvidenceStore({ root })
	const temp = store.record({
		kind: 'log',
		summary: 'session log',
		provenance: {},
		artifact: 'log line',
	})

	const keep = store.record({ kind: 'note', summary: 'keep me', provenance: {} })
	store.retain(keep.id)

	const closed = store.closeSession()
	assert.equal(closed.deleted, 1)
	assert.equal(store.list().length, 1)
	assert.equal(store.list()[0].id, keep.id)
	assert.equal(store.delete(temp.id).error.code, 'not_found')
})

test('handler-dispatch evidence is never OS-input verification', () => {
	const root = mkdtempSync(join(tmpdir(), 'xplat-mcp-ev-'))
	const store = createEvidenceStore({ root })
	const handler = store.record({
		kind: 'interaction',
		summary: 'tapped save',
		provenance: { mechanism: 'handler-dispatch' },
	})

	const osInput = store.record({
		kind: 'interaction',
		summary: 'clicked save',
		provenance: { mechanism: 'os-input' },
	})

	assert.equal(isOsInputEvidence(handler), false)
	assert.equal(isOsInputEvidence(osInput), true)
})
