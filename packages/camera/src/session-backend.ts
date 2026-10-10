import { CameraCaptureError } from './types'
import type { CameraSessionBackend } from './session-core'
import type { CameraSessionConfig } from './types'

/** Default adapter for platforms without a movie-capture implementation
 *  yet. Honest `unsupported` reporting — never fabricated capture. Kept
 *  platform-pure so web and native fallback builds share it. */
export function createSessionBackend(_config: CameraSessionConfig): CameraSessionBackend {
	const unsupported = (operation: string) =>
		new CameraCaptureError({
			kind: 'unsupportedPlatform',
			operation,
			message: 'Movie recording is not implemented on this platform yet',
		})

	return {
		platform: 'unsupported',
		supported: false,
		checkPermission: async () => 'unavailable',
		requestPermission: async () => 'unavailable',
		getCapabilities: async () => ({
			supported: false,
			reason: 'Movie recording is not implemented on this platform yet',
			available: false,
			cameras: [],
			profiles: [],
			audio: false,
			orientations: [],
			durationLimit: 'bestEffort',
			elapsedTime: 'estimated',
			output: {
				mimeType: '',
				container: '',
				storage: 'appPrivateFile',
				destinationFileUrl: false,
			},
		}),
		previewReady: () => false,
		attachPreview: () => {
			throw unsupported('attachPreview')
		},
		startCapture: (_request, sink) => {
			sink.settled({
				kind: 'failed',
				stage: 'preparation',
				issue: unsupported('startRecording'),
			})
		},
		stopCapture: () => {},
		elapsedMs: () => 0,
		openOutput: async () => {
			throw unsupported('openOutput')
		},
		release: async () => {},
		setObserver: () => {},
	}
}
