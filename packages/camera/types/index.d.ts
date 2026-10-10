import type { UniversalComponent } from 'octane/universal'
import type { CameraViewProps } from './props.js'
import type { CameraSession, CameraSessionConfig } from './types.js'
import type { SyntheticCameraScript, SyntheticCameraStorage } from './synthetic-session.js'

export declare const CameraView: UniversalComponent<CameraViewProps>
export type { CameraViewHandle, CameraViewProps, CameraAccessibilityRole } from './props.js'

export declare function createCameraSession(config?: CameraSessionConfig): CameraSession
export declare function createSyntheticCameraSession(
	config?: CameraSessionConfig,
	script?: Partial<SyntheticCameraScript>,
	storage?: SyntheticCameraStorage,
): CameraSession

export declare function createMemoryCameraStorage(): SyntheticCameraStorage & {
	files: Map<string, Uint8Array>
}

export { CameraCaptureError } from './types.js'
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
} from './types.js'

export type { SyntheticCameraScript, SyntheticCameraStorage } from './synthetic-session.js'
