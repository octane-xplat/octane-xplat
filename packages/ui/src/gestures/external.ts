import { createExternalGestureInput } from './external-shared'
import { attachNativeGesture, attachNativePress, parentGestureSurface } from './input.native'

import { nativeGestureSurface } from './native-surface'
import { bindLoadedNativeHost } from './native-host-lifecycle'

const input = createExternalGestureInput({
  pan: (host, gesture, basis) =>
    bindLoadedNativeHost(host, (view) =>
      attachNativeGesture(
        basis === 'parent'
          ? parentGestureSurface(nativeGestureSurface(view))
          : nativeGestureSurface(view),
        gesture,
      ),
    ),
  press: (host, options) =>
    bindLoadedNativeHost(host, (view) => {
      const binding = attachNativePress(nativeGestureSurface(view), options, () => ({
        commit() {},
        dispose() {},
      }))

      return () => binding.dispose()
    }),
})

export const attachOwnedPan = input.attachPan
export const observeOwnedPress = input.observePress

export type { PanAdmission } from './controller'

export { useInputCallbackGuard } from './callbacks.tsrx'
