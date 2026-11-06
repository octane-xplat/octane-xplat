import type { PinchEvent } from '../../props'

/** GTK dispatches the shared gesture payload when a recognizer exists. */
export function usePinch(cb?: (event: PinchEvent) => void): ((event: any) => void) | undefined {
  return cb
}
