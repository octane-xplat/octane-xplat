import type {
	FrameworkHostEvents,
	FrameworkHostServices,
} from '@octane-xplat/platform/host/services'

export interface CameraProofServices extends FrameworkHostServices {
	application: {
		report(result: CameraProofResult): boolean
	}
}

export interface CameraProofEvents extends FrameworkHostEvents {}

export interface CameraProofResult {
	ok: boolean
	cameraService: boolean
	mediaPermission: string
	microphonePermission: string
	storageRoundTrip: boolean
	sessionStorageKind: string
	sessionCameras: number
	error?: string
}
