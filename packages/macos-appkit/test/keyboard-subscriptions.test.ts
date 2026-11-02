import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
const start = source.indexOf('const keyboardSubscriptionsByNode =')
const slice = source.slice(start, source.indexOf('function setKeyActions(', start))
function fixture() {
	const nodes = new WeakMap(), entries: any[] = [], scopes: string[] = [], calls: unknown[] = [], errors: unknown[] = []
	const api = runSlice(slice + '\n({observeViewKeys})', { cssNodesByView: nodes,
		keyboardDispatcher: { subscribe: (view: object, handlers: any) => {
			const entry = { view, handlers, released: 0 }; entries.push(entry)
			return () => { entry.released++ }
		} }, console: { error: (...args: unknown[]) => errors.push(args) },
	})
	const view = {}, node: any = { view, props: {}, destroyHooks: [], container: { root: { eventScope: (kind: string, callback: () => void) => { scopes.push(kind); callback() } } } }
	nodes.set(view, node)
	return { ...api, nodes, entries, scopes, calls, errors, view, node }
}

test('bridge subscriptions enter discrete scope and guard latest blocked/replaced/detached/released nodes', () => {
	const f = fixture(), event = { key: 'ArrowDown' }
	const off = f.observeViewKeys(f.view, { onKeyDown: (value: unknown) => f.calls.push(value) })
	const send = () => f.entries[0].handlers.onKeyDown(event)
	send(); assert.deepEqual(f.calls, [event]); assert.deepEqual(f.scopes, ['discrete'])
	for (const props of [{ disabled: true }, { isEnabled: false }, { enabled: false }]) { f.node.props = props; send() }
	assert.equal(f.calls.length, 1)
	f.node.props = {}; f.node.view = {}; send(); assert.equal(f.calls.length, 1)
	f.node.view = f.view; f.nodes.delete(f.view); send(); assert.equal(f.calls.length, 1)
	f.nodes.set(f.view, f.node); send(); assert.equal(f.calls.length, 2)
	off(); off(); send(); assert.equal(f.calls.length, 2); assert.equal(f.entries[0].released, 1)
})

test('one node destroy hook releases every lease without skipping independent teardown', () => {
	const f = fixture()
	const first = f.observeViewKeys(f.view, { onKeyDown: () => {} })
	f.observeViewKeys(f.view, { onKeyUp: () => {} })
	assert.equal(f.node.destroyHooks.length, 1)
	first(); f.observeViewKeys(f.view, { onKeyDown: () => {} })
	assert.equal(f.node.destroyHooks.length, 1)
	let unrelated = 0; f.node.destroyHooks.push(() => unrelated++)
	for (const hook of f.node.destroyHooks) {hook()}
	assert.deepEqual(f.entries.map((entry) => entry.released), [1, 1, 1])
	assert.equal(unrelated, 1)
})

test('bridge ignores unknown/empty attachments and catches subscriber exceptions', () => {
	const f = fixture()
	f.observeViewKeys({}, { onKeyDown: () => {} })(); f.observeViewKeys(f.view, {})()
	assert.equal(f.entries.length, 0)
	f.observeViewKeys(f.view, { onKeyDown: () => { throw new Error('handler') } })
	f.entries[0].handlers.onKeyDown({})
	assert.equal(f.errors.length, 1)
	for (const hook of f.node.destroyHooks) {hook()}
})
