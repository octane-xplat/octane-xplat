import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { createStore } from '../../../packages/ui/src/store.ts'

const source = await readFile(
	new URL('../../../packages/demos/src/auth-guide/session.ts', import.meta.url),
	'utf8',
)
const output = ts.transpile(source, {
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES2022,
})
const exports = {}
vm.runInNewContext(output, { exports, require: () => ({ createStore }) })
const { createAccountSession } = exports
const response = (status, body) => ({ status, ok: status === 200, json: async () => body })
const fake = (overrides = {}) => ({
	supported: true,
	restore: async () => 'authenticated',
	signIn: async () => ({ status: 'success' }),
	fetch: async () => response(200, { subject: 'person-1' }),
	signOut: async () => {},
	...overrides,
})

test('restoration verifies the account before displaying authenticated UI', async () => {
	const account = createAccountSession(fake())
	assert.equal(account.state.getSnapshot().status, 'checking')
	await account.restore()
	assert.equal(account.state.getSnapshot().status, 'authenticated')
	assert.equal(account.state.getSnapshot().subject, 'person-1')
	assert.equal(account.state.getSnapshot().authority, 1)
})

test('cancellation and unsupported targets settle without a fake successful session', async () => {
	const cancelled = createAccountSession(fake({ signIn: async () => ({ status: 'cancelled' }) }))
	await cancelled.signIn()
	assert.equal(cancelled.state.getSnapshot().status, 'anonymous')
	assert.equal(cancelled.state.getSnapshot().subject, null)
	const unsupported = createAccountSession(fake({ supported: false }))
	await unsupported.restore()
	assert.equal(unsupported.state.getSnapshot().status, 'unsupported')
})

test('an old account response cannot restore private UI after sign-out', async () => {
	let finish
	const waiting = new Promise((resolve) => {
		finish = resolve
	})
	const account = createAccountSession(fake({ fetch: () => waiting }))
	const old = account.restore()
	await new Promise((resolve) => setImmediate(resolve))
	await account.signOut()
	const authority = account.state.getSnapshot().authority
	finish(response(200, { subject: 'old-person' }))
	await old
	assert.equal(account.state.getSnapshot().status, 'anonymous')
	assert.equal(account.state.getSnapshot().subject, null)
	assert.equal(account.state.getSnapshot().authority, authority)
})

test('credential deletion failure keeps private UI retired and requires a retry', async () => {
	let attempts = 0
	const account = createAccountSession(
		fake({
			signOut: async () => {
				if (++attempts === 1) {throw new Error('storage error with private details')}
			},
		}),
	)
	await account.restore()
	await account.signOut()
	assert.equal(account.state.getSnapshot().subject, null)
	assert.equal(account.state.getSnapshot().needsSignOutRetry, true)
	assert.ok(!account.state.getSnapshot().message.includes('private details'))
	await account.restore()
	assert.equal(account.state.getSnapshot().needsSignOutRetry, true)
	await account.signOut()
	assert.equal(account.state.getSnapshot().status, 'anonymous')
	assert.equal(account.state.getSnapshot().needsSignOutRetry, false)
})

test('a rejected backend session is cleared, while network failures offer recovery', async () => {
	let revoked = false
	const expired = createAccountSession(
		fake({
			fetch: async () => response(401),
			signOut: async () => {
				revoked = true
			},
		}),
	)
	await expired.restore()
	assert.equal(revoked, true)
	assert.equal(expired.state.getSnapshot().status, 'anonymous')
	const offline = createAccountSession(
		fake({
			fetch: async () => {
				throw new Error('offline')
			},
		}),
	)
	await offline.restore()
	assert.equal(offline.state.getSnapshot().status, 'error')
	assert.equal(offline.state.getSnapshot().subject, null)
})

test('remounting during sign-out cannot bypass a pending durable deletion failure', async () => {
	let rejectRemoval
	let restorations = 0
	const removal = new Promise((_, reject) => {
		rejectRemoval = reject
	})
	const account = createAccountSession(
		fake({
			restore: async () => {
				restorations++
				return 'authenticated'
			},
			signOut: () => removal,
		}),
	)
	const pending = account.signOut()
	await account.restore()
	assert.equal(restorations, 0)
	rejectRemoval(new Error('could not delete'))
	await pending
	assert.equal(account.state.getSnapshot().needsSignOutRetry, true)
	assert.equal(account.state.getSnapshot().subject, null)
})
