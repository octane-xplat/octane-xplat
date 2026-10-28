import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'
import { isPrimaryClickBoundary, shouldReceivePrimaryClick } from '../src/primary-click.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
function fn(name: string) {
	const start = source.indexOf('function ' + name + '(')
	return source.slice(start, source.indexOf('\nfunction ', start + 1))
}
function fixture() {
	const handlers = new Map(), ids = new WeakMap(), recognizers: any[] = [], calls: string[] = []
	const cssNodesByView = new WeakMap()
	const api = runSlice(fn('wireViewAction') + '\n' + fn('setAction') + '\n({wireViewAction,setAction})', {
		actionHandlers: handlers, actionIdsByView: ids, nextActionId: 1, buttonActionTarget: {},
		configureGesture: (recognizer: any, attempt: unknown) => { recognizer.attempt = attempt; return recognizer },
		cssNodesByView, isPrimaryClickBoundary, shouldReceivePrimaryClick,
		NSClickGestureRecognizer: { alloc: () => ({ initWithTargetAction: () => ({ enabled: true }) }) }, console,
	})
	const view = { addGestureRecognizer: (recognizer: object) => recognizers.push(recognizer) }
	const node: any = { view, props: {}, container: { root: { eventScope: (_: string, callback: () => void) => callback() } } }
	return { ...api, handlers, ids, recognizers, calls, view, node, cssNodesByView }
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


test('primary click wiring reads current descendant semantics and action ownership', () => {
	const f = fixture(), view: any = f.view
	const window: any = {}, child: any = { superview: view, window }
	window.contentView = { hitTest: () => child }
	view.window = window
	const target: any = { type: 'masonview', props: {}, actionId: 99 }
	f.cssNodesByView.set(child, target)
	f.setAction(f.node, () => {})
	const recognizer = f.node.clickGestureRecognizer
	const event = { type: 1, window, locationInWindow: { x: 10, y: 10 } }
	assert.equal(recognizer.attempt(event), true)
	target.props = { accessibilityRole: 'button', disabled: true }
	assert.equal(recognizer.attempt(event), false)
	target.props = {}
	f.handlers.set(99, () => {})
	assert.equal(recognizer.attempt(event), false)
	f.handlers.set(99, null)
	assert.equal(recognizer.attempt(event), true)
	target.type = 'textfield'
	assert.equal(recognizer.attempt(event), false)
	f.setAction(f.node, undefined)
	f.setAction(f.node, () => {})
	assert.equal(f.node.clickGestureRecognizer, recognizer)
	assert.equal(recognizer.attempt(event), false)
})
