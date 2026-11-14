import type { Driver } from './types'
import type { DriverBindings } from './driver-contract'
import { waitUntil } from './runner'

/** Shared fixtures remain inspectable on native; automatic DOM evidence is web-only. */
export function createNativeHarnessDriver(bindings: DriverBindings, target: string): Driver {
  return {
    target,
    build: import.meta.env.DEV ? 'development / workspace sources' : 'production / workspace build',
    evidence: 'unavailable',
    unavailable:
      'Automatic DOM checks are unavailable on this host. Open shared fixtures and qualify them with the host’s input/inspection tooling; record a manual observation separately.',
    async mount(spec) {
      bindings.mount(spec)
    },
    async cleanup() {
      bindings.clear()
      await waitUntil(
        () => (bindings.resources() === 0 ? 'Owned resources released' : undefined),
        new AbortController().signal,
      )
    },
    async perform() {
      throw new Error('No DOM driver on this host.')
    },
  }
}
