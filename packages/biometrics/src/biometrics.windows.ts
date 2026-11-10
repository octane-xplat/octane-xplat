// Windows leaf — Windows Hello via
// Windows.Security.Credentials.UI.UserConsentVerifier through the app-shipped
// `OctaneXplat.Interop.ServiceInterop` managed helper. On runtimes before
// `@nativescript/windows@1.0.0-beta.24` the projected `NSWinRT.toPromise`
// await on UserConsentVerifier panics the JS isolate when its completion
// crosses contexts (NativeScript/NativeScript#11627, fixed in beta.24), so
// the operation runs on the captured dispatcher inside the helper and JS
// polls `HelloState` (the same bridge the files pickers use). Apps without
// the interop helper get the explicit
// unsupported shape. The prompt is owned by the OS consent UI; no per-app
// permission grant exists, so permission answers mirror device availability.
import { NSWinRT } from '@octane-xplat/platform/windows'
import { UnavailabilityError } from '@octane-xplat/lib'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import type { BiometricsImpl } from './types'

const HELLO_TYPE = 'OctaneXplat.Interop.ServiceInterop'
// UserConsentVerifierAvailability / UserConsentVerificationResult values.
const AVAILABLE = 0
const VERIFIED = 0

interface DotnetBridge {
  invoke: (assembly: string, type: string, method: string, args: unknown[]) => unknown
}

interface Win32Bridge {
  call: (lib: string, fn: string, ret: string) => unknown
}

function dotnetInvoke(method: string, args: unknown[]): string {
  const dotnet = (NSWinRT as { dotnet?: DotnetBridge }).dotnet

  if (typeof dotnet?.invoke !== 'function') {
    throw new UnavailabilityError('biometrics')
  }

  return String(dotnet.invoke('', HELLO_TYPE, method, args))
}

function ownerHwnd(): number | null {
  const win32 = (NSWinRT as { win32?: Win32Bridge }).win32

  if (typeof win32?.call !== 'function') {
    return null
  }

  for (const fn of ['GetActiveWindow', 'GetForegroundWindow']) {
    try {
      const value = win32.call('user32.dll', fn, 'pointer')

      if (typeof value === 'number' && value !== 0) {
        return value
      }
    } catch {}
  }

  return null
}

function helperAvailable(): boolean {
  try {
    // A benign probe: HelloState is pure-managed and returns immediately.
    return typeof dotnetInvoke('HelloState', []) === 'string'
  } catch {
    return false
  }
}

async function managedHello(reason: string): Promise<string> {
  const start = dotnetInvoke('HelloStart', [ownerHwnd() ?? 0, reason])

  if (start !== 'started') {
    throw new Error(`biometrics: ${start}`)
  }

  while (true) {
    const state = dotnetInvoke('HelloState', [])

    if (state !== 'pending') {
      return state
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

async function availability(): Promise<number | null> {
  const state = await managedHello('')

  if (state.startsWith('ok:avail:')) {
    return Number(state.slice('ok:avail:'.length))
  }

  if (state.startsWith('ok:unavailable:')) {
    return Number(state.slice('ok:unavailable:'.length))
  }

  return null
}

const GRANTED: PermissionResponse = { status: 'granted', granted: true, canAskAgain: false }
const UNSUPPORTED: PermissionResponse = {
  status: 'unsupported',
  granted: false,
  canAskAgain: false,
}

const DENIED: PermissionResponse = { status: 'denied', granted: false, canAskAgain: false }

let verifying = false

async function checkAvailable(): Promise<boolean> {
  try {
    return (await availability()) === AVAILABLE
  } catch {
    return false
  }
}

/** Biometric verification facade — Windows Hello consent prompts. */
export const biometrics: Permissioned<BiometricsImpl> = {
  get supported() {
    return helperAvailable()
  },
  async isAvailable() {
    return await checkAvailable()
  },
  async getPermissions() {
    if (!helperAvailable()) {
      return UNSUPPORTED
    }

    return (await checkAvailable()) ? GRANTED : DENIED
  },
  // No promptable permission — availability already reflects enrollment.
  async requestPermissions() {
    return biometrics.getPermissions()
  },
  async verify(reason: string): Promise<boolean> {
    if (!helperAvailable() || verifying || !(await checkAvailable())) {
      return false
    }

    verifying = true
    try {
      const state = await managedHello(reason)

      return state.startsWith('ok:verify:') && Number(state.slice('ok:verify:'.length)) === VERIFIED
    } catch {
      return false
    } finally {
      verifying = false
    }
  },
}
