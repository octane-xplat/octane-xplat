import { createMacOSRecorder } from './recorder-core.macos'
import { createNativeRecorderHost } from './recorder-host.macos'
import type { AudioRecorder, RecorderPermissionState } from './types'

export const createAudioRecorder: () => AudioRecorder = (): AudioRecorder =>
  createMacOSRecorder(createNativeRecorderHost())

export function microphonePermissionState(): RecorderPermissionState {
  const recorder = createAudioRecorder()

  try {
    return recorder.snapshot().permission
  } finally {
    recorder.dispose()
  }
}

export async function requestMicrophonePermission(): Promise<RecorderPermissionState> {
  const recorder = createAudioRecorder()

  try {
    return await recorder.requestPermission()
  } finally {
    recorder.dispose()
  }
}
