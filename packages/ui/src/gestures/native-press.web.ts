import type { NativeGestureView } from './input.native'
import type { PressRegistration } from './owner'
import type { PressOptions } from './press'
import type { NativePressTransport } from './native-press-contract'

export type { NativePressTransport } from './native-press-contract'
export function observeNativePress(
  _view: NativeGestureView,
  _registration: PressRegistration,
  _options: PressOptions,
): NativePressTransport {
  throw new Error('Native semantic recognizers are unavailable in the browser')
}
