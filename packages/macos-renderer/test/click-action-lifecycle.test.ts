import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
function fn(name: string) {
	const start = source.indexOf('function ' + name + '(')
	return source.slice(start, source.indexOf('\nfunction ', start + 1))
}
function fixture() {
	const handlers = new Map(), ids = new WeakMap(), recognizers: any[] = [], calls: string[] = []
	const api = runSlice(fn('wireViewAction') + '\n' + fn('setAction') + '\n({wireViewAction,setAction})', {
		actionHandlers: handlers, actionIdsByView: ids, nextActionId: 1, buttonActionTarget: {},
		configureGesture: (recognizer: object) => recognizer,
		NSClickGestureRecognizer: { alloc: () => ({ initWithTargetAction: () => ({ enabled: true }) }) }, console,
	})
	const view = { addGestureRecognizer: (recognizer: object) => recognizers.push(recognizer) }
	const node: any = { view, props: {}, container: { root: { eventScope: (_: string, callback: () => void) => callback() } } }
	return { ...api, handlers, ids, recognizers, calls, view, node }
}

test('semantic-only checkbox mount can acquire exactly one click recognizer later', () => {
	const f = fixture()
	f.node.actionId = f.wireViewAction(f.view, { accessibilityRole: 'checkbox' })
	assert.equal(typeof f.node.actionId, 'number')
	assert.equal(f.recognizers.length, 0)
	f.setAction(f.node, () => f.calls.push('first'))
	assert.equal(f.recognizers.length, 1)
	assert.equal(f.recognizers[0].enabled, true)
	f.handlers.get(f.node.actionId)()
	f.setAction(f.node, () => f.calls.push('latest'))
	f.handlers.get(f.node.actionId)()
	assert.deepEqual(f.calls, ['first', 'latest'])
	assert.equal(f.recognizers.length, 1)
})

test('clear/re-add and disabled callbacks retain identity without live no-op gestures', () => {
	const f = fixture()
	f.node.actionId = f.wireViewAction(f.view, { accessibilityRole: 'radio' })
	f.node.props.disabled = true
	f.setAction(f.node, () => f.calls.push('press'))
	const recognizer = f.node.clickGestureRecognizer
	assert.equal(recognizer.enabled, false)
	f.handlers.get(f.node.actionId)()
	assert.deepEqual(f.calls, [])
	f.node.props.disabled = false
	f.setAction(f.node, () => f.calls.push('press'))
	assert.equal(recognizer.enabled, true)
	f.setAction(f.node, undefined)
	assert.equal(recognizer.enabled, false)
	assert.equal(f.handlers.get(f.node.actionId), null)
	f.setAction(f.node, () => f.calls.push('again'))
	assert.equal(f.node.clickGestureRecognizer, recognizer)
	assert.equal(recognizer.enabled, true)
	assert.equal(f.recognizers.length, 1)
})

test('clearing a noninteractive host does not manufacture an identity or recognizer', () => {
	const f = fixture()
	f.setAction(f.node, undefined)
	assert.equal(f.node.actionId, undefined)
	assert.equal(f.recognizers.length, 0)
})
