import assert from 'node:assert/strict'
import test from 'node:test'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

// Fake native center / actual private helpers, not native frame/layer proof.
const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
const start = source.indexOf('function removeBoxFrameToken(')
const code = source.slice(start, source.indexOf('// borderRadius styles', start))
function fixture() {
	const tokens: any[] = [], warnings: string[] = []
	let updates = 0, failUpdate = false
	const center = {
		addObserverForNameObjectQueueUsingBlock(_name: string, _view: any, _queue: any, callback: () => void) {
			const token = { callback, removed: 0 }; tokens.push(token); callback(); return token
		},
		removeObserver(token: any) { assert.equal(this, center); token.removed++ },
	}
	const Center = { defaultCenter: center }
	const api = runSlice(code + '\n({ observeBoxFrame, clearBoxFrameObserver })', {
		NSNotificationCenter: Center, NSViewFrameDidChangeNotification: 'frame',
		console: { warn: (message: string) => warnings.push(message) },
		syncBoxGeometry() { updates++; if (failUpdate) throw Error('private update payload') },
	})
	const view = {}, node: any = { view }
	return { ...api, node, view, tokens, center, Center, warnings, updates: () => updates, fail: (value: boolean) => { failUpdate = value } }
}

test('box frame ownership suppresses setup/retired callbacks and retains retry after update failure', () => {
	const h = fixture()
	h.observeBoxFrame(h.node, h.view)
	assert.equal(h.updates(), 0, 'a synchronous acquisition callback cannot enter incomplete setup')
	h.fail(true); h.tokens[0].callback()
	h.fail(false); h.tokens[0].callback()
	assert.equal(h.updates(), 2)
	assert.deepEqual(h.warnings, ['[macos-css] Box geometry update failed'])
	h.clearBoxFrameObserver(h.node); h.clearBoxFrameObserver(h.node)
	h.tokens[0].callback()
	assert.equal(h.updates(), 2)
	assert.equal(h.tokens[0].removed, 1)
	assert.equal(h.node.boxFrameOwner, null)
	h.observeBoxFrame(h.node, h.view)
	h.node.view = {}
	h.tokens[1].callback()
	assert.equal(h.updates(), 2)
	assert.equal(h.tokens[1].removed, 1, 'former view notification retires its native observer')
	assert.equal(h.node.boxFrameOwner, null)
})

test('late native handles from reentrant replacement are released without clearing the new owner', () => {
	const h = fixture(), add = h.center.addObserverForNameObjectQueueUsingBlock
	let reenter = true
	h.center.addObserverForNameObjectQueueUsingBlock = (...args: any[]) => {
		const token = add.apply(h.center, args as any)
		if (reenter) { reenter = false; h.observeBoxFrame(h.node, h.view) }
		return token
	}
	h.observeBoxFrame(h.node, h.view)
	assert.equal(h.tokens[0].removed, 1)
	assert.equal(h.node.boxFrameObserver, h.tokens[1])
	h.tokens[0].callback(); h.tokens[1].callback()
	assert.equal(h.updates(), 1)
	h.clearBoxFrameObserver(h.node)
	assert.equal(h.tokens[1].removed, 1)
})

test('captured cleanup retires before native reentry and contains failure without exposing payloads', () => {
	const h = fixture()
	h.center.removeObserver = function(token: any) {
		assert.equal(this, h.center)
		assert.equal(h.node.boxFrameOwner, null)
		token.callback(); token.removed++
		throw Error('private cleanup payload')
	}
	h.observeBoxFrame(h.node, h.view)
	h.center.removeObserver = () => assert.fail('new method received an old token')
	h.Center.defaultCenter = { removeObserver: () => assert.fail('new center received an old token') } as any
	h.clearBoxFrameObserver(h.node)
	assert.equal(h.updates(), 0)
	assert.equal(h.tokens[0].removed, 1)
	assert.deepEqual(h.warnings, ['[macos-css] Box frame cleanup failed'])
})

test('failed registration retires its held callback and a later attempt can bind again', () => {
	const h = fixture(), add = h.center.addObserverForNameObjectQueueUsingBlock
	let held!: () => void
	h.center.addObserverForNameObjectQueueUsingBlock = (_name, _view, _queue, callback) => {
		held = callback; callback(); throw Error('private setup payload')
	}
	h.observeBoxFrame(h.node, h.view)
	held()
	assert.equal(h.updates(), 0)
	assert.equal(h.node.boxFrameOwner, null)
	assert.deepEqual(h.warnings, ['[macos-css] Box frame observation unavailable'])
	h.center.addObserverForNameObjectQueueUsingBlock = add
	h.observeBoxFrame(h.node, h.view)
	h.tokens[0].callback()
	assert.equal(h.updates(), 1)
	h.clearBoxFrameObserver(h.node)
})
