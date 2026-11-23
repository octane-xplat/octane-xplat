// Package-owned Core Location facade, loaded by the existing macOS native graph.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import type { GeolocationImpl, GeolocationPosition } from './types'

type NativeStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported'

declare const XplatGeolocation: {
  isAvailable(): boolean
  getStatus(completion: (result: NativeStatus) => void): void
  ensure(completion: (result: NativeStatus) => void): void
  positionTimeoutMaximumAgeCompletion(
    highAccuracy: boolean,
    timeout: number,
    maximumAge: number,
    completion: (positionJSON: string | null, code: number, message: string) => void,
  ): void
}

const available = () => typeof XplatGeolocation !== 'undefined' && XplatGeolocation.isAvailable()

const milliseconds = (value: number | undefined, fallback: number) =>
  value === undefined || Number.isNaN(value) ? fallback : Math.max(0, value)

const impl: GeolocationImpl = {
  getCurrentPosition(options) {
    return new Promise((resolve, reject) => {
      if (!available()) {
        reject(new UnavailabilityError('geolocation'))

        return
      }

      const timeout = milliseconds(options?.timeout, Infinity)

      XplatGeolocation.positionTimeoutMaximumAgeCompletion(
        options?.enableHighAccuracy ?? false,
        timeout === Infinity ? -1 : timeout,
        milliseconds(options?.maximumAge, 0),
        (positionJSON, code, message) => {
          if (code === 0 && positionJSON) {
            try {
              resolve(JSON.parse(positionJSON) as GeolocationPosition)
            } catch (error) {
              reject(error)
            }
          } else {
            reject(
              Object.assign(new Error(message || 'Location unavailable'), {
                code: code || 2,
              }),
            )
          }
        },
      )
    })
  },
}

const response = (raw: string): PermissionResponse => {
  const status: NativeStatus = ['granted', 'denied', 'undetermined'].includes(raw)
    ? (raw as NativeStatus)
    : 'unsupported'

  return {
    status,
    granted: status === 'granted',
    canAskAgain: status === 'granted' || status === 'undetermined',
  }
}

// getStatus() is the non-prompting read; ensure() may prompt. A stale bridge
// without getStatus reports unsupported rather than prompting on a read.
const permission = (method: 'getStatus' | 'ensure'): Promise<PermissionResponse> =>
  !available() || typeof XplatGeolocation[method] !== 'function'
    ? Promise.resolve(response('unsupported'))
    : new Promise((resolve) => {
        XplatGeolocation[method]((status) => resolve(response(status)))
      })

/** Geolocation service — single-shot position fixes. */
export const geolocation: Permissioned<GeolocationImpl> = {
  get supported() {
    return available()
  },
  isAvailable: async () => available(),
  getPermissions: () => permission('getStatus'),
  requestPermissions: () => permission('ensure'),
  ...impl,
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})

permissionOwners.location = {
  getPermissions: () => geolocation.getPermissions(),
  requestPermissions: () => geolocation.requestPermissions(),
}
