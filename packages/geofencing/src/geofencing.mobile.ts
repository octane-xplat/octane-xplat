// Shared listener registry for the geofencing platform leaves: native
// transitions fan out through emitRegionEvent, buffered while no listener is
// attached and replayed to the first subscriber.
import type { RegionEvent, RegionEventListener } from './types'

const listeners = new Set<RegionEventListener>()
let buffer: RegionEvent[] = []

export function emitRegionEvent(event: RegionEvent): void {
  if (listeners.size === 0) {
    buffer.push(event)
    return
  }

  for (const listener of listeners) {
    listener(event)
  }
}

export function attachRegionListener(listener: RegionEventListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function flushRegionEvents(listener: RegionEventListener): void {
  const pending = buffer

  buffer = []
  for (const event of pending) {
    listener(event)
  }
}
