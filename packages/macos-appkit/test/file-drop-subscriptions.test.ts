import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'
const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url)), start = source.indexOf('const fileDropSubscriptionsByNode =')
const slice = source.slice(start, source.indexOf('const contextSubscriptionsByNode =', start))
test('file drop leases check current node/props/root, enter discrete delivery and release on node teardown', () => {
	class Host {}
	const view = new Host(), nodes = new WeakMap(), entries: any[] = [], scopes: string[] = []
	const node: any = { view, props: {}, container: { root: { eventScope: (kind: string, fn: () => void) => { scopes.push(kind); fn() } } } }
	nodes.set(view, node)
	const api = runSlice(slice + '\n({observeFileDrop})', { AccessibleHostView: Host, cssNodesByView: nodes,
		fileDropRegistry: { subscribe(_view: object, handlers: any) { const entry = { ...handlers, releases: 0 }; entries.push(entry); return () => entry.releases++ } } })
	let enabled = true, calls = 0
	const off = api.observeFileDrop(view, { enabled: () => enabled, receive: () => { calls++; return true } })
	assert.equal(entries[0].receive(['file:///a']), true); assert.deepEqual(scopes, ['discrete'])
	for (const props of [{ disabled: true }, { enabled: false }, { isEnabled: false }]) { node.props = props; assert.equal(entries[0].enabled(), false) }
	node.props = {}; enabled = false; assert.equal(entries[0].receive([]), false)
	enabled = true; node.view = {}; assert.equal(entries[0].enabled(), false)
	node.view = view; const root = node.container.root; node.container.root = null; assert.equal(entries[0].enabled(), false)
	node.container.root = root; node.destroyHooks[0](); off(); assert.equal(entries[0].enabled(), false)
	assert.equal(entries[0].releases, 1); assert.equal(calls, 1)
})
