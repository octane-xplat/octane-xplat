import { createExternalGestureInput } from './external-shared'
import { attachWebGesture, observeWebPress } from './input.web'

function element(host: object): HTMLElement {
  if (!('ownerDocument' in host) || !('style' in host)) {
    throw new Error('Web gesture input requires a mounted element')
  }

  // The platform integration receives an element ref from its DOM renderer.
  return host as HTMLElement
}

const input = createExternalGestureInput({
  pan: (host, gesture, basis) => attachWebGesture(element(host), gesture, basis),
  press: (host, options) => {
    return observeWebPress(element(host), options)
  },
})

export const attachOwnedPan = input.attachPan
export const observeOwnedPress = input.observePress

export type { PanAdmission } from './controller'

export { useInputCallbackGuard } from './callbacks.tsrx'
