import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'
const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url)), start = source.indexOf('const contextSubscriptionsByNode =')
const slice = source.slice(start, source.indexOf('function setKeyActions(', start))
function fixture() {
	const nodes = new WeakMap(), entries: any[] = [], scopes: string[] = [], errors: unknown[] = []
	const api = runSlice(slice + '\n({observeContextMenu})', { cssNodesByView: nodes,
		contextPointerDispatcher: { subscribe(view: object, handler: (target: object) => boolean) {
			const entry = { view, handler, released: 0 }; entries.push(entry); return () => { entry.released++ }
		} }, console: { error: (...args: unknown[]) => errors.push(args) },
	})
	const view = {}, node: any = { view, props: {}, destroyHooks: [], container: { root: { eventScope: (kind: string, fn: () => void) => { scopes.push(kind); fn() } } } }
	nodes.set(view, node)
	return { ...api, nodes, entries, scopes, errors, view, node }
}

test('context bridge enters discrete scope and rejects blocked/stale/released nodes', () => {
	const f = fixture(), target = {}; let calls = 0
	const off = f.observeContextMenu(f.view, (value: object) => { assert.equal(value, target); calls++; return true })
	const send = () => f.entries[0].handler(target)
	assert.equal(send(), true); assert.deepEqual(f.scopes, ['discrete'])
	for (const props of [{ disabled: true }, { isEnabled: false }, { enabled: false }]) { f.node.props = props; assert.equal(send(), false) }
	f.node.props = {}; f.node.view = {}; assert.equal(send(), false)
	f.node.view = f.view; f.nodes.delete(f.view); assert.equal(send(), false)
	f.nodes.set(f.view, f.node); off(); off(); assert.equal(send(), false); assert.equal(calls, 1)
	assert.equal(f.entries[0].released, 1)
})

test('node teardown releases every context lease without skipping other hooks; faults stay consumed', () => {
	const f = fixture()
	f.observeContextMenu({}, () => true)(); assert.equal(f.entries.length, 0)
	f.observeContextMenu(f.view, () => false); f.observeContextMenu(f.view, () => { throw new Error('handler') })
	assert.equal(f.entries[0].handler({}), false); assert.equal(f.entries[1].handler({}), true)
	assert.equal(f.errors.length, 1); assert.equal(f.node.destroyHooks.length, 1)
	let other = 0; f.node.destroyHooks.push(() => other++)
	for (const hook of f.node.destroyHooks) {hook()}
	assert.deepEqual(f.entries.map((entry) => entry.released), [1, 1]); assert.equal(other, 1)
})
