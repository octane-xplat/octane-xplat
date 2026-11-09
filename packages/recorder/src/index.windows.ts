// Windows leaf — no MediaCapture-backed recorder leaf exists yet; report
// explicit unavailability rather than resolving the ios/android imports that
// the unsuffixed index would reach on this platform.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { AudioRecorder } from './types'

export * from './types'

/** Create an owned microphone recorder — unavailable on Windows. */
export const createAudioRecorder = (): AudioRecorder => {
  throw new UnavailabilityError('microphone recorder')
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})

permissionOwners.microphone = async () => 'unsupported'
