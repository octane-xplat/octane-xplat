// Windows leaf — Windows Hello via
// Windows.Security.Credentials.UI.UserConsentVerifier. The prompt is owned
// by the OS consent UI; no per-app permission grant exists, so permission
// answers mirror device availability.
import { Windows, NSWinRT } from '@octane-xplat/platform/windows'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import type { BiometricsImpl } from './types'

// UserConsentVerifierAvailability / UserConsentVerificationResult — the
// projection surfaces WinRT enums as numbers.
const AVAILABLE = 0
const VERIFIED = 0

function verifier(): any {
  const api = Windows?.Security?.Credentials?.UI?.UserConsentVerifier

  return typeof api?.CheckAvailabilityAsync === 'function' &&
    typeof api?.RequestVerificationAsync === 'function'
    ? api
    : null
}

async function checkAvailable(api: any): Promise<boolean> {
  try {
    const availability = Number(await NSWinRT?.toPromise?.(api.CheckAvailabilityAsync()))

    return availability === AVAILABLE
  } catch {
    return false
  }
}

const GRANTED: PermissionResponse = { status: 'granted', granted: true, canAskAgain: false }
const UNSUPPORTED: PermissionResponse = {
  status: 'unsupported',
  granted: false,
  canAskAgain: false,
}
const DENIED: PermissionResponse = { status: 'denied', granted: false, canAskAgain: false }

let verifying = false

/** Biometric verification facade — Windows Hello consent prompts. */
export const biometrics: Permissioned<BiometricsImpl> = {
  get supported() {
    return verifier() !== null
  },
  async isAvailable() {
    const api = verifier()

    return api ? await checkAvailable(api) : false
  },
  async getPermissions() {
    const api = verifier()

    if (!api) {
      return UNSUPPORTED
    }

    return (await checkAvailable(api)) ? GRANTED : DENIED
  },
  // No promptable permission — availability already reflects enrollment.
  async requestPermissions() {
    return biometrics.getPermissions()
  },
  async verify(reason: string): Promise<boolean> {
    const api = verifier()

    if (!api || verifying || !(await checkAvailable(api))) {
      return false
    }

    verifying = true
    try {
      const result = Number(await NSWinRT?.toPromise?.(api.RequestVerificationAsync(reason)))

      return result === VERIFIED
    } catch {
      return false
    } finally {
      verifying = false
    }
  },
}
