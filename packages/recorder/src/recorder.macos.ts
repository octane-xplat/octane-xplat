import { createMacOSRecorder } from './recorder-core.macos'
import type { RecorderHost } from './recorder-core.macos'
import type { AudioRecorder, RecorderPermissionState } from './types'

declare const XplatAudioRecorder: { alloc(): { init(): RecorderHost } }

export const createAudioRecorder: () => AudioRecorder = (): AudioRecorder =>
	createMacOSRecorder(
		typeof XplatAudioRecorder === 'undefined' ? undefined : XplatAudioRecorder.alloc().init(),
	)

export async function requestMicrophonePermission(): Promise<RecorderPermissionState> {
	const recorder = createAudioRecorder()
	try {
		return await recorder.requestPermission()
	} finally {
		recorder.dispose()
	}
}
