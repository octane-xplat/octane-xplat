import { requestMicrophonePermission } from './recorder.macos'
export * from './types'
export { createAudioRecorder } from './recorder.macos'

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.microphone = async () => {
	const state = await requestMicrophonePermission()
	return state === 'granted' ? 'granted' : state === 'unsupported' ? 'unsupported' : 'denied'
}
