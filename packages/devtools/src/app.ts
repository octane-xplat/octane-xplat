// App-side devtools channel: declares a channel on the app's dev socket so
// the xplat dev hub routes its frames to the target's backend and connected
// devtools panels. Inert outside `xplat dev` — the Vite fallback bridge has
// no channels and reports 'unavailable'.

import {
  registerDevChannel,
  type ChannelErrorCode,
  type DevChannelState,
  type DevChannelRegistration,
} from '@octane-xplat/platform/dev-actions'

export type { ChannelErrorCode, DevChannelState }

/** One routed channel message delivered to the app. */
export interface DevChannelMessage<In> {
  from: 'backend' | 'panel'
  panel?: string
  data: In
}

/** A routing failure the hub bounced back to this channel's sender. */
export interface DevChannelFailure {
  code: ChannelErrorCode
  detail: string
}

/** An app-side devtools channel. @internal */
export interface DevChannel<In, Out> {
  readonly state: DevChannelState
  /** False unless the app socket is live and the hub advertised 'channels'. */
  send(to: 'backend' | 'panels', data: Out): boolean
  subscribe(listener: (message: DevChannelMessage<In>) => void): () => void
  onStateChange(listener: (state: DevChannelState) => void): () => void
  onError(listener: (failure: DevChannelFailure) => void): () => void
  close(): void
}

/**
 * Declare a devtools channel. `id` must match /^[a-z][a-z0-9-]{0,31}$/ and
 * `version` a positive int32; the pair joins the app's registry announcement.
 */
export function openDevChannel<In = unknown, Out = unknown>(
  id: string,
  version: number,
): DevChannel<In, Out> {
  const listeners = new Set<(message: DevChannelMessage<In>) => void>()
  const stateListeners = new Set<(state: DevChannelState) => void>()
  const errorListeners = new Set<(failure: DevChannelFailure) => void>()
  let current: DevChannelState = 'connecting'

  const registration: DevChannelRegistration = registerDevChannel(id, version, {
    message(frame) {
      // Channel payloads are typed by the channel's own protocol; `as In` is
      // the documented boundary for this module.
      for (const listener of listeners) {
        listener({
          from: frame.from,
          ...(frame.panel ? { panel: frame.panel } : {}),
          data: frame.data as In,
        })
      }
    },
    state(state) {
      current = state
      for (const listener of stateListeners) {
        listener(state)
      }
    },
    error(failure) {
      for (const listener of errorListeners) {
        listener(failure)
      }
    },
  })

  let closed = false

  return {
    get state() {
      return current
    },
    send(to, data) {
      return !closed && registration.send(to, data)
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    onStateChange(listener) {
      stateListeners.add(listener)
      return () => stateListeners.delete(listener)
    },
    onError(listener) {
      errorListeners.add(listener)
      return () => errorListeners.delete(listener)
    },
    close() {
      if (!closed) {
        closed = true
        registration.dispose()
      }
    },
  }
}
