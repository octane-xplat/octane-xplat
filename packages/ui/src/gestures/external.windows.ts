import { createExternalGestureInput } from './external-shared'
import { attachWindowsGesture, attachWindowsPress } from './input.windows'

const input = createExternalGestureInput({
  pan: (host, gesture, basis) => attachWindowsGesture(host, gesture, basis),
  press: (host, options) => {
    const binding = attachWindowsPress(host, options)

    return () => binding.dispose()
  },
})

export const attachOwnedPan = input.attachPan
export const observeOwnedPress = input.observePress

export type { PanAdmission } from './controller'

export { useInputCallbackGuard } from './callbacks.tsrx'
