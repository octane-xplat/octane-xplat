import { hostGlobal } from '../internal/platform/host-bridge'
import { createMouseGestureAdapter, type HostGestureBridge } from './input.host'

interface GtkGestureBridge extends HostGestureBridge {
  gestureFrame(callback: () => void): () => void
}

const bridge = () => hostGlobal<GtkGestureBridge>('__octaneGtkHost')
const adapter = createMouseGestureAdapter('GTK', bridge, {
  frame(callback) {
    const host = bridge()

    if (!host) {
      throw new Error('GTK gesture scheduler unavailable')
    }

    return host.gestureFrame(callback)
  },
  error(error) {
    Promise.resolve().then(() => {
      throw error
    })
  },
})

export const attachGtkGesture = adapter.gesture
export const attachGtkScope = adapter.scope
export const attachGtkPress = adapter.press
