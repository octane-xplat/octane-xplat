import { microphonePermissionState, requestMicrophonePermission } from './recorder.macos'
import type { RecorderPermissionState } from './types'

export * from './types'
export { createAudioRecorder } from './recorder.macos'

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})

const toResponse = (state: RecorderPermissionState) => ({
  status: state === 'unavailable' ? ('denied' as const) : state,
  granted: state === 'granted',
  canAskAgain: state === 'granted' || state === 'undetermined',
})

permissionOwners.microphone = {
  getPermissions: async () => toResponse(microphonePermissionState()),
  requestPermissions: async () => toResponse(await requestMicrophonePermission()),
}
