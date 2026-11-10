import { expect, it } from 'vitest'
import { reserveNativeGesturePolicy } from './native-policy'
import { createScope } from 'octane/signals'
import { createPanController, createPinchController } from './controller'
import { simultaneous } from './composition'
import { observeGesturePolicy, touchActionForPolicy } from './gesture-policy'

it('updates reserved axes after committed options and live enablement without observer replacement', () => {
  const scope = createScope({ scopeKey: 'gesture-policy-test' }),
    enabled$ = scope.signal$('enabled', true)

  const pan = createPanController({ axis: 'x', enabled$ }),
    pinch = createPinchController({ enabled: false })

  pan.attach({}, () => {})
  pinch.attach({}, () => {})

  let action = ''
  const release = observeGesturePolicy(simultaneous(pan.handle, pinch.handle), (policy) => {
    action = touchActionForPolicy(policy)
  })

  try {
    expect(action).toBe('pan-y pinch-zoom')
    enabled$.set(false)
    expect(action).toBe('auto')
    pan.commit({ axis: 'y', enabled$ })
    enabled$.set(true)
    expect(action).toBe('pan-x pinch-zoom')
    pinch.commit({})
    expect(action).toBe('none')
    pinch.dispose()
    expect(action).toBe('pan-x pinch-zoom')
  } finally {
    release()
    pan.dispose()
    pinch.dispose()
    scope.dispose()
  }
})

it('reserves native input without widening authored restrictions and preserves live author updates', () => {
  const pan = createPanController({ axis: 'x' }),
    style = { touchAction: 'pan-y' }

  pan.attach({}, () => {})

  const release = reserveNativeGesturePolicy(style, pan.handle)

  try {
    expect(style.touchAction).toBe('pan-y')
    pan.commit({ axis: 'y' })
    expect(style.touchAction).toBe('none')
    style.touchAction = 'pan-left pinch-zoom'
    pan.commit({ axis: 'y' })
    expect(style.touchAction).toBe('pan-left pinch-zoom')
    pan.commit({ axis: 'y', enabled: false })
    expect(style.touchAction).toBe('pan-left pinch-zoom')
    release()
    expect(style.touchAction).toBe('pan-left pinch-zoom')
  } finally {
    release()
    pan.dispose()
  }
})
