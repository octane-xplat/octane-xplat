import { createExternalGestureInput } from './external-shared'
import { attachAppKitGesture, attachAppKitPress } from './input.macos'

const input = createExternalGestureInput({
  pan: (host, gesture) => attachAppKitGesture(host, gesture, 'parent'),
  press: (host, options) => {
    const binding = attachAppKitPress(host, options)

    return () => binding.dispose()
  },
})

export const attachOwnedPan = input.attachPan
export const observeOwnedPress = input.observePress
