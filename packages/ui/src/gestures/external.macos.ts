import { createExternalGestureInput } from './external-shared'
import { attachAppKitGesture, attachAppKitPress } from './input.macos'

const input = createExternalGestureInput({
  pan: (host, gesture, basis) => attachAppKitGesture(host, gesture, basis),
  press: (host, options) => {
    const binding = attachAppKitPress(host, options)

    return () => binding.dispose()
  },
})

export const attachOwnedPan = input.attachPan
export const observeOwnedPress = input.observePress

export type { PanAdmission } from './controller'

export { useInputCallbackGuard } from './callbacks.tsrx'
