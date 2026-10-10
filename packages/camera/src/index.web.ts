export { CameraView } from './CameraView.web.tsrx'
export type { CameraAccessibilityRole, CameraViewHandle, CameraViewProps } from './props'
export { createCameraSession } from './session'
export { CameraCaptureError } from './types'
export type {
	CameraCaptureErrorKind,
	CameraDeviceInfo,
	CameraFacing,
	CameraInterruptionReason,
	CameraOrientation,
	CameraPermissionKind,
	CameraPermissionStatus,
	CameraProfileCapability,
	CameraRecorderState,
	CameraSelection,
	CameraSession,
	CameraSessionCapabilities,
	CameraSessionConfig,
	CameraSessionEvent,
	CameraSessionSnapshot,
	CaptureIssue,
	EffectiveCaptureConfig,
	MovieClip,
	MovieEndReason,
	MovieOutcome,
	MovieOutput,
	MovieOutputHandle,
	MovieTake,
	StartRecordingOptions,
} from './types'

export { createMemoryCameraStorage, createSyntheticCameraSession } from './synthetic-session'
export type { SyntheticCameraScript, SyntheticCameraStorage } from './synthetic-session'
