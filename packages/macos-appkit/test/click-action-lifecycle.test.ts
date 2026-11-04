import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createActionStore } from '../src/action-store.ts'
import { mockNativeBoundary } from './native-boundary.ts'
import { isPrimaryClickBoundary } from '../src/primary-click.ts'

const hooks = mockNativeBoundary()
const { createActions } = await import('../src/actions.ts')
hooks.deregister()

function fixture() {
  const store = createActionStore(),
    recognizers: any[] = [],
    calls: string[] = []
  const cssNodesByView = new WeakMap()
  const actions = createActions({
    store,
    registry: { cssNodesByView },
    textElements: {
      primaryClickBoundary: () => (view) => {
        const target = cssNodesByView.get(view)
        return (
          target != null &&
          isPrimaryClickBoundary(
            target.type,
            target.props.accessibilityRole,
            store.hasHandler(view),
          )
        )
      },
      textLinkCharacterIndex: () => null,
    },
    cssPseudoState: { syncPseudoState() {} },
    inputElements: {} as any,
  })
  const view = { addGestureRecognizer: (recognizer: object) => recognizers.push(recognizer) }
  const node: any = {
    view,
    props: {},
    container: { root: { eventScope: (_: string, callback: () => void) => callback() } },
  }
  return { ...actions, store, recognizers, calls, view, node, cssNodesByView }
}

test('semantic-only checkbox needs no action and can acquire exactly one click recognizer later', () => {
  const f = fixture()
  f.node.props.accessibilityRole = 'checkbox'
  assert.equal(f.node.actionId, undefined)
  assert.equal(f.recognizers.length, 0)
  f.setAction(f.node, () => f.calls.push('first'))
  assert.equal(f.recognizers.length, 1)
  assert.equal(f.recognizers[0].enabled, true)
  f.invokeAction(f.node.actionId)
  f.setAction(f.node, () => f.calls.push('latest'))
  f.invokeAction(f.node.actionId)
  assert.deepEqual(f.calls, ['first', 'latest'])
  assert.equal(f.recognizers.length, 1)
})

test('clear/re-add and disabled callbacks retain identity without live no-op gestures', () => {
  const f = fixture()
  f.node.props.accessibilityRole = 'radio'
  f.node.props.disabled = true
  f.setAction(f.node, () => f.calls.push('press'))
  const recognizer = f.node.clickGestureRecognizer
  assert.equal(recognizer.enabled, false)
  f.invokeAction(f.node.actionId)
  assert.deepEqual(f.calls, [])
  f.node.props.disabled = false
  f.setAction(f.node, () => f.calls.push('press'))
  assert.equal(recognizer.enabled, true)
  f.setAction(f.node, undefined)
  assert.equal(recognizer.enabled, false)
  assert.equal(f.store.hasHandler(f.view), false)
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
  const f = fixture(),
    view: any = f.view
  const window: any = {},
    child: any = { superview: view, window }
  window.contentView = { hitTest: () => child }
  view.window = window
  const target: any = { type: 'masonview', props: {}, actionId: 99 }
  f.cssNodesByView.set(child, target)
  f.setAction(f.node, () => {})
  const recognizer = f.node.clickGestureRecognizer
  const event = { type: 1, window, locationInWindow: { x: 10, y: 10 } }
  assert.equal(
    recognizer.delegate.gestureRecognizerShouldAttemptToRecognizeWithEvent(recognizer, event),
    true,
  )
  target.props = { accessibilityRole: 'button', disabled: true }
  assert.equal(
    recognizer.delegate.gestureRecognizerShouldAttemptToRecognizeWithEvent(recognizer, event),
    false,
  )
  target.props = {}
  const childAction = f.store.allocate(child)
  childAction.setHandler(() => {})
  assert.equal(
    recognizer.delegate.gestureRecognizerShouldAttemptToRecognizeWithEvent(recognizer, event),
    false,
  )
  childAction.setHandler(undefined)
  assert.equal(
    recognizer.delegate.gestureRecognizerShouldAttemptToRecognizeWithEvent(recognizer, event),
    true,
  )
  target.type = 'textfield'
  assert.equal(
    recognizer.delegate.gestureRecognizerShouldAttemptToRecognizeWithEvent(recognizer, event),
    false,
  )
  f.setAction(f.node, undefined)
  f.setAction(f.node, () => {})
  assert.equal(f.node.clickGestureRecognizer, recognizer)
  assert.equal(
    recognizer.delegate.gestureRecognizerShouldAttemptToRecognizeWithEvent(recognizer, event),
    false,
  )
})
