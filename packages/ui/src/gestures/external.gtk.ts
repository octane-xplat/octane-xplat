import { createExternalGestureInput } from './external-shared'
import { attachGtkGesture, attachGtkPress } from './input.gtk'

const input = createExternalGestureInput({
  pan: (host, gesture) => attachGtkGesture(host, gesture, 'parent'),
  press: (host, options) => {
    const binding = attachGtkPress(host, options)

    return () => binding.dispose()
  },
})

export const attachOwnedPan = input.attachPan
export const observeOwnedPress = input.observePress
