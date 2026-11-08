// Geolocation — native leaf. The plugin's enableLocationRequest() owns the
// runtime prompt; getCurrentLocation() is normalized to the web position shape.
import * as geolocationApi from '@nativescript/geolocation'
import { CoreTypes } from '@nativescript/core'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import type { GeolocationImpl, GeolocationPosition } from './types'

function asPosition(nativeLocation: any): GeolocationPosition {
  const android = nativeLocation.android
  const ios = nativeLocation.ios
  const heading = nativeLocation.direction ?? nativeLocation.heading
  const speed = nativeLocation.speed

  return {
    latitude: nativeLocation.latitude,
    longitude: nativeLocation.longitude,
    accuracy: Math.max(0, nativeLocation.horizontalAccuracy ?? nativeLocation.accuracy ?? 0),
    // Altitude itself can be negative; iOS validity uses verticalAccuracy.
    altitude:
      (android && !android.hasAltitude()) || (ios && ios.verticalAccuracy < 0)
        ? null
        : (nativeLocation.altitude ?? null),
    heading: (android && !android.hasBearing()) || heading == null || heading < 0 ? null : heading,
    speed: (android && !android.hasSpeed()) || speed == null || speed < 0 ? null : speed,
    timestamp: Number(nativeLocation.timestamp ?? Date.now()),
  }
}

// Shared failure contract (web GeolocationPositionError, macOS facade): every
// position rejection carries `code` — 1 denied, 2 unavailable, 3 timeout.
// @nativescript/geolocation 9.0.0 rejects with plain Errors (or non-Error
// values on Android) and no code, so the leaf classifies at the boundary.
// Only the plugin's own deterministic literals mark denial/timeout; localized
// NSError text and every other failure stay POSITION_UNAVAILABLE — an iOS
// denial racing an in-flight request (kCLErrorDenied) loses its domain there.
const DENIED_MESSAGES = new Set([
  'Authorization Denied.', // iOS enableLocationRequest denial
  'User denied location permission previously', // Android pre-prompt denial
  'User needs to enable permission from settings', // Android settings-only denial
])

const TIMEOUT_MESSAGE = 'Timeout while searching for location!'
const ANDROID_LOCATION_PERMISSIONS = [
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
]

function positionErrorCode(reason: unknown): 1 | 2 | 3 {
  if (typeof reason === 'object' && reason !== null) {
    if (ANDROID_LOCATION_PERMISSIONS.some((permission) => permission in reason)) {
      return 1
    }

    if (reason instanceof Error) {
      if (DENIED_MESSAGES.has(reason.message)) {
        return 1
      }

      if (reason.message === TIMEOUT_MESSAGE) {
        return 3
      }
    }
  }

  return 2
}

function asPositionError(reason: unknown): Error & { code: 1 | 2 | 3 } {
  const code = positionErrorCode(reason)

  if (reason instanceof Error) {
    return Object.assign(reason, { code })
  }

  return Object.assign(
    new Error(typeof reason === 'string' && reason ? reason : 'Location unavailable'),
    { code, cause: reason },
  )
}

const impl: GeolocationImpl = {
  async getCurrentPosition(options) {
    const nativePosition = await geolocationApi
      .getCurrentLocation({
        desiredAccuracy: options?.enableHighAccuracy
          ? CoreTypes.Accuracy.high
          : CoreTypes.Accuracy.any,
        maximumAge: options?.maximumAge,
        timeout: options?.timeout,
      })
      .catch((reason) => Promise.reject(asPositionError(reason)))

    return asPosition(nativePosition)
  },
}

const respond = (granted: boolean, canAskAgain: boolean): PermissionResponse => ({
  status: granted ? 'granted' : 'denied',
  granted,
  canAskAgain,
})

/** Geolocation service — single-shot position fixes. */
export const geolocation: Permissioned<GeolocationImpl> = {
  supported: true,
  isAvailable: async () => true,
  async getPermissions() {
    // isEnabled() is the plugin's only non-prompting read — services-off and
    // denied both read as 'denied'.
    return respond(await geolocationApi.isEnabled(), true)
  },
  async requestPermissions() {
    try {
      await geolocationApi.enableLocationRequest()
      return respond(true, true)
    } catch {
      return respond(false, false)
    }
  },
  ...impl,
}

// See @octane-xplat/media for the pattern — registers the kind this leaf owns
// for the platform permissions dispatcher.
const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})

permissionOwners.location = {
  getPermissions: () => geolocation.getPermissions(),
  requestPermissions: () => geolocation.requestPermissions(),
}
