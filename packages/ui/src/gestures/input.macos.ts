import { hostGlobal } from '../internal/platform/host-bridge'
import {
  createMouseGestureAdapter,
  type HostGestureBridge,
  type HostPressBinding,
} from './input.host'

const adapter = createMouseGestureAdapter(
  'AppKit',
  () => hostGlobal<HostGestureBridge>('__xplatAppKit'),
  {
    frame(callback) {
      const id = requestAnimationFrame(callback)

      return () => cancelAnimationFrame(id)
    },
    error(error) {
      queueMicrotask(() => {
        throw error
      })
    },
  },
)

export const attachAppKitGesture = adapter.gesture
// AppKit scroll/momentum suspension remains unsupported.
export const attachAppKitScope = adapter.scope
export const attachAppKitPress = adapter.press
export type AppKitPressBinding = HostPressBinding
