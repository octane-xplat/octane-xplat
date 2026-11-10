// Windows leaf — Windows Hello via
// Windows.Security.Credentials.UI.UserConsentVerifier through the projected
// `NSWinRT.toPromise`. Runtimes before `@nativescript/windows@1.0.0-beta.24`
// panicked the isolate when this class's completion crossed contexts
// (NativeScript/NativeScript#11627, fixed in beta.24); beta.24 is the minimum
// supported runtime. The prompt is owned by the OS consent UI; no per-app
// permission grant exists, so permission answers mirror device availability.
import { NSWinRT, Windows } from '@octane-xplat/platform/windows'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import type { BiometricsImpl } from './types'

// UserConsentVerifierAvailability / UserConsentVerificationResult values.
const AVAILABLE = 0
const VERIFIED = 0

function verifier(): {
  CheckAvailabilityAsync?: () => unknown
  RequestVerificationAsync?: (reason: string) => unknown
} | null {
  return Windows?.Security?.Credentials?.UI?.UserConsentVerifier ?? null
}

async function checkAvailable(): Promise<boolean> {
  try {
    const api = verifier()

    if (typeof api?.CheckAvailabilityAsync !== 'function') {
      return false
    }

    return (await NSWinRT.toPromise(api.CheckAvailabilityAsync())) === AVAILABLE
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
    return typeof verifier()?.CheckAvailabilityAsync === 'function'
  },
  async isAvailable() {
    return await checkAvailable()
  },
  async getPermissions() {
    if (!biometrics.supported) {
      return UNSUPPORTED
    }

    return (await checkAvailable()) ? GRANTED : DENIED
  },
  // No promptable permission — availability already reflects enrollment.
  async requestPermissions() {
    return biometrics.getPermissions()
  },
  async verify(reason: string): Promise<boolean> {
    const api = verifier()

    if (typeof api?.RequestVerificationAsync !== 'function' || verifying) {
      return false
    }

    if (!(await checkAvailable())) {
      return false
    }

    verifying = true
    try {
      return (await NSWinRT.toPromise(api.RequestVerificationAsync(reason))) === VERIFIED
    } catch {
      return false
    } finally {
      verifying = false
    }
  },
}
