import { createExternalGestureInput } from './external-shared'
import { attachGtkGesture, attachGtkPress } from './input.gtk'

const input = createExternalGestureInput({
  pan: (host, gesture, basis) => attachGtkGesture(host, gesture, basis),
  press: (host, options) => {
    const binding = attachGtkPress(host, options)

    return () => binding.dispose()
  },
})

export const attachOwnedPan = input.attachPan
export const observeOwnedPress = input.observePress

export type { PanAdmission } from './controller'

export { useInputCallbackGuard } from './callbacks.tsrx'
