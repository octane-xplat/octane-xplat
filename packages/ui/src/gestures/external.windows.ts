import { bindLoadedNativeHost } from './native-host-lifecycle'
import { createExternalGestureInput } from './external-shared'
import { attachWindowsGesture, attachWindowsPress, windowsInputReady } from './input.windows'

const input = createExternalGestureInput({
  pan: (host, gesture, basis) =>
    bindLoadedNativeHost(
      host,
      (view) => attachWindowsGesture(view, gesture, basis),
      windowsInputReady,
    ),
  press: (host, options) =>
    bindLoadedNativeHost(
      host,
      (view) => {
        const binding = attachWindowsPress(view, options)

        return () => binding.dispose()
      },
      windowsInputReady,
    ),
})

export const attachOwnedPan = input.attachPan
export const observeOwnedPress = input.observePress

export type { PanAdmission } from './controller'

export { useInputCallbackGuard } from './callbacks.tsrx'
