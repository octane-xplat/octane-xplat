import { createExternalGestureInput } from './external-shared'
import { attachWindowsGesture, attachWindowsPress } from './input.windows'

const input = createExternalGestureInput({
  pan: (host, gesture) => attachWindowsGesture(host, gesture, 'parent'),
  press: (host, options) => {
    const binding = attachWindowsPress(host, options)

    return () => binding.dispose()
  },
})

export const attachOwnedPan = input.attachPan
export const observeOwnedPress = input.observePress
