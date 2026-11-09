// Windows leaf — @nativescript-community/gesturehandler has no windows
// implementation; pan gestures are inert until one exists.
import type { PanCallbacks } from './host-types'

export function attachPan(_node: any, _axis: true | 'x' | 'y', _callbacks: PanCallbacks): () => void {
  return () => {}
}
