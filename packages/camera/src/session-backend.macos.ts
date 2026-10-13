import '@nativescript/macos-node-api'

import { CameraCaptureError } from './types'
import { canonicalizePath } from './session-core'
import type { BackendCaptureRequest, BackendCaptureSink, BackendObserver } from './session-core'
import type { CameraSessionBackend } from './session-core'
import type { BackendPreviewListener } from './session-core'
import type {
	CameraDeviceInfo,
	CameraOrientation,
	CameraPermissionKind,
	CameraPermissionStatus,
	CameraSessionCapabilities,
	CameraSessionConfig,
	CaptureIssue,
	EffectiveCaptureConfig,
	MovieOutputHandle,
} from './types'

declare const NSFileManager: any

interface CameraHost {
	attachPreview(view: object): string | null
	detachPreview(): void
	installObserver(emit: (message: string) => void): void
	permissionStatus(kind: string): string
	requestPermissionReply(kind: string, reply: (status: string) => void): void
	devices(): string
	audioDeviceAvailable(): boolean
	audioInputAttached(): boolean
	activeDeviceId(): string | null
	configure(options: { cameraId?: string; audio?: boolean; rotationAngle?: number }): string | null
	/** Optional so a host built before the metering leaf shipped degrades
	 *  to a no-op instead of a selector error. */
	focusAtPoint?(point: { x: number; y: number }): boolean
	supportsRotationAngles(): boolean
	movieDirectory(): string | null
	startRecording(path: string, maximumDurationMs: number): string | null
	stopRecording(): void
	recording(): boolean
	recordedMs(): number
	previewSize(): string
	dispose(): void
}

declare const XplatCameraHost: {
	alloc(): { init(): CameraHost }
}

type HostEvent =
	| { type: 'recordingStarted'; fileUrl: string; audio: boolean }
	| {
			type: 'recordingFinished'
			fileUrl: string
			succeeded: boolean
			limitReached: boolean
			clip?: {
				fileUrl: string
				durationMs: number
				width: number
				height: number
				rotationAngle: number
				fileSize: number
				hasAudio: boolean
				videoCodec?: string
			}
			error?: { domain: string; code: number; message: string }
	  }
	| { type: 'interrupted'; cause: string }
	| { type: 'interruptionEnded' }
	| { type: 'availability'; available: boolean }
	| { type: 'previewReady'; ready: boolean }

const orientationToRotationAngle = (orientation: CameraOrientation): number | undefined =>
	orientation === 'portrait'
		? 90
		: orientation === 'portraitUpsideDown'
			? 270
			: orientation === 'landscapeLeft'
				? 180
				: orientation === 'landscapeRight'
					? 0
					: undefined

const orientationFromRotationAngle = (angle: number): CameraOrientation =>
	angle === 90
		? 'portrait'
		: angle === 270
			? 'portraitUpsideDown'
			: angle === 180
				? 'landscapeLeft'
				: angle === 0
					? 'landscapeRight'
					: 'unspecified'

const usageKey = (kind: CameraPermissionKind) =>
	kind === 'camera' ? 'NSCameraUsageDescription' : 'NSMicrophoneUsageDescription'

/** AppKit adapter: one XplatCameraHost (AVCaptureSession) shared between the
 *  attached preview and a single AVCaptureMovieFileOutput capture attempt.
 *  The Swift leaf owns the session, inputs, preview layer, and recording
 *  delegate; this adapter owns admission, semantics, and contract mapping. */
export function createSessionBackend(config: CameraSessionConfig): CameraSessionBackend {
	const host = XplatCameraHost.alloc().init()
	let currentConfig = { ...config }
	let previewReadyFlag = false
	let observer: BackendObserver | undefined
	let captureSink: BackendCaptureSink | undefined
	let captureRequest: BackendCaptureRequest | undefined
	let captureFilePath = ''
	let released = false

	const emitIssue = (
		kind: CaptureIssue['kind'],
		operation: string,
		message: string,
		cause?: unknown,
	): CaptureIssue => ({ kind, operation, message, cause })

	const error = (kind: CaptureIssue['kind'], operation: string, message: string, cause?: unknown) =>
		new CameraCaptureError({ kind, operation, message, cause })

	const devices = (): CameraDeviceInfo[] => {
		try {
			return (
				JSON.parse(host.devices()) as {
					id: string
					name: string
					facing?: 'front' | 'back' | null
				}[]
			).map((entry) => ({
				id: entry.id,
				label: entry.name,
				facing: entry.facing ?? undefined,
			}))
		} catch {
			return []
		}
	}

	const previewSize = (): { width: number; height: number } | undefined => {
		try {
			const size = JSON.parse(host.previewSize())
			return size.width > 0 ? { width: size.width, height: size.height } : undefined
		} catch {
			return undefined
		}
	}

	/** Point-of-interest metering support on the selected device, read
	 *  from the same device list `devices()` reports. */
	const pointOfInterestSupport = (): { focus: boolean; exposure: boolean } => {
		try {
			const list = JSON.parse(host.devices()) as {
				id: string
				focusPointOfInterest?: boolean
				exposurePointOfInterest?: boolean
			}[]

			const selected = selectedCameraId()
			const device = list.find((entry) => entry.id === selected) ?? list[0]
			return {
				focus: device?.focusPointOfInterest === true,
				exposure: device?.exposurePointOfInterest === true,
			}
		} catch {
			return { focus: false, exposure: false }
		}
	}

	const selectedCameraId = (config: CameraSessionConfig = currentConfig): string | undefined => {
		const selection = config.camera
		if (selection && typeof selection === 'object' && 'deviceId' in selection) {
			return selection.deviceId
		}

		// 'default'/'front'/'back' resolve to the first available device —
		// macOS cameras carry no front/back facing semantics.
		return devices()[0]?.id
	}

	host.installObserver((message) => {
		let event: HostEvent
		try {
			event = JSON.parse(message)
		} catch {
			return
		}

		switch (event.type) {
			case 'recordingStarted': {
				if (!sameFile(event.fileUrl, captureFilePath) || !captureSink || !captureRequest) {
					return
				}

				const size = previewSize()
				const configuration: EffectiveCaptureConfig = {
					cameraId: host.activeDeviceId() ?? selectedCameraId() ?? '',
					audio: event.audio,
					width: size?.width ?? 1280,
					height: size?.height ?? 720,
					frameRate: 30,
					orientation: captureRequest.orientation ?? 'unspecified',
					mimeType: 'video/quicktime',
					container: 'mov',
				}

				captureSink.started(configuration)
				return
			}
			case 'recordingFinished': {
				if (!sameFile(event.fileUrl, captureFilePath) || !captureSink || !captureRequest) {
					return
				}

				const sink = captureSink
				const request = captureRequest
				captureSink = undefined
				captureRequest = undefined

				if (!event.succeeded || !event.clip) {
					sink.settled({
						kind: 'failed',
						stage: 'capture',
						issue: emitIssue(
							'captureFailed',
							'finalize',
							event.error?.message ?? 'Movie recording did not complete',
						),
					})

					return
				}

				if (
					!(event.clip.durationMs > 0) ||
					!(event.clip.width > 0) ||
					!(event.clip.height > 0)
				) {
					sink.settled({
						kind: 'failed',
						stage: 'capture',
						issue: emitIssue(
							'captureFailed',
							'finalize',
							'The finalized movie has no usable video media',
						),
					})

					return
				}

				if (request.audio && !event.clip.hasAudio) {
					sink.settled({
						kind: 'failed',
						stage: 'capture',
						issue: emitIssue(
							'captureFailed',
							'finalize',
							'Requested audio track is missing from the finalized movie',
						),
					})

					return
				}

				sink.settled({
					kind: 'clip',
					output: {
						kind: 'nativeFile',
						resourceId: event.fileUrl,
						fileUrl: event.fileUrl,
					},
					mimeType: 'video/quicktime',
					durationMs: event.clip.durationMs,
					width: event.clip.width,
					height: event.clip.height,
					orientation:
						request.orientation ?? orientationFromRotationAngle(event.clip.rotationAngle),
					hasAudio: request.audio && event.clip.hasAudio,
					limitReached: event.limitReached,
				})

				return
			}
			case 'interrupted':
				observer?.interruption(
					'began',
					(event.cause as Parameters<BackendObserver['interruption']>[1]) ?? 'unknown',
				)

				observer?.previewReady(previewReadyFlag)
				return
			case 'interruptionEnded':
				observer?.interruption('ended')
				observer?.previewReady(previewReadyFlag)
				return
			case 'availability':
				observer?.availability(event.available)
				return
			case 'previewReady':
				previewReadyFlag = event.ready
				observer?.previewReady(previewReadyFlag)
				return
		}
	})

	const checkPermission = async (kind: CameraPermissionKind): Promise<CameraPermissionStatus> => {
		const status = host.permissionStatus(kind)
		return (status === 'undeclared' ? 'unknown' : status) as CameraPermissionStatus
	}

	const requestPermission = async (kind: CameraPermissionKind): Promise<CameraPermissionStatus> => {
		if (host.permissionStatus(kind) === 'undeclared') {
			throw error(
				'configurationMissing',
				'requestPermission',
				`Missing ${usageKey(kind)} in the app Info.plist`,
			)
		}

		const status = await new Promise<string>((resolve) =>
			host.requestPermissionReply(kind, resolve),
		)

		return (status === 'undeclared' ? 'unknown' : status) as CameraPermissionStatus
	}

	const recordingsDirectory = (): string => {
		const root = host.movieDirectory()
		if (!root) {
			throw error(
				'destinationUnavailable',
				'startRecording',
				'The app has no writable private camera directory',
			)
		}

		return decodeURIComponent(root.replace(/^file:\/\//, '').replace(/\/$/, ''))
	}

	// Durable output must stay app-private: destinations resolve inside the
	// app's own Application Support root — the recordings directory's parent.
	const appPrivateRoot = () =>
		recordingsDirectory().slice(0, recordingsDirectory().lastIndexOf('/'))

	const pathExists = (path: string): boolean =>
		Boolean(NSFileManager.defaultManager.fileExistsAtPath(path))

	// Correlate capture events by path, not serialized URL — Foundation's
	// URL(fileURLWithPath:).absoluteString escapes differently than
	// encodeURIComponent, so URL equality drops real start/finish events.
	const sameFile = (fileUrl: string | undefined, filePath: string): boolean => {
		if (!fileUrl || !filePath) {
			return false
		}

		const raw = fileUrl.startsWith('file://') ? fileUrl.slice('file://'.length) : fileUrl
		try {
			return decodeURIComponent(raw) === filePath
		} catch {
			return raw === filePath
		}
	}

	return {
		platform: 'macos',
		get supported() {
			return !released
		},
		checkPermission,
		requestPermission,
		getCapabilities: async (): Promise<CameraSessionCapabilities> => {
			const list = devices()
			const available = list.length > 0
			const size = previewSize()
			const pointOfInterest = pointOfInterestSupport()
			return {
				supported: available,
				reason: available ? undefined : 'No camera device is available on this host',
				available,
				cameras: list,
				profiles: [
					{
						profile: 'standard',
						width: size?.width ?? 1280,
						height: size?.height ?? 720,
						frameRate: 30,
					},
				],
				audio: host.audioDeviceAvailable(),
				focusPointOfInterest: pointOfInterest.focus,
				exposurePointOfInterest: pointOfInterest.exposure,
				// AVCaptureConnection rotation angles exist on macOS 14+;
				// earlier hosts cannot lock a take's orientation.
				orientations: host.supportsRotationAngles()
					? ['landscapeLeft', 'landscapeRight', 'portrait', 'portraitUpsideDown']
					: [],
				durationLimit: 'native',
				elapsedTime: 'nativeMedia',
				output: {
					mimeType: 'video/quicktime',
					container: 'mov',
					storage: 'appPrivateFile',
					destinationFileUrl: true,
				},
			}
		},
		previewReady: () => previewReadyFlag,
		attachPreview: (target, listener?: BackendPreviewListener) => {
			if (released) {
				throw error('unavailable', 'attachPreview', 'CameraSession is disposed')
			}

			if (host.permissionStatus('camera') !== 'granted') {
				throw error(
					'permissionDenied',
					'attachPreview',
					'Camera preview requires an explicit granted camera permission',
				)
			}

			if (!devices().length) {
				throw error('unavailable', 'attachPreview', 'No camera device is available on this host')
			}

			const configured = host.configure({
				cameraId: selectedCameraId(),
				audio: currentConfig.audio ?? false,
			})

			if (configured) {
				throw error(
					configured === 'busy'
						? 'busy'
						: configured === 'permissionDenied'
							? 'permissionDenied'
							: 'unavailable',
					'attachPreview',
					`Failed to configure the capture session: ${configured}`,
				)
			}

			const failure = host.attachPreview(target as object)
			if (failure) {
				throw error(
					failure === 'permissionDenied' ? 'permissionDenied' : 'unavailable',
					'attachPreview',
					`Failed to start camera preview: ${failure}`,
				)
			}

			listener?.onReady?.()
			return () => {
				previewReadyFlag = false
				observer?.previewReady(false)
				host.detachPreview()
			}
		},
		configure: (next) => {
			const configured = host.configure({
				cameraId: selectedCameraId(next),
				audio: next.audio ?? false,
			})

			if (configured) {
				throw error(
					configured === 'busy'
						? 'busy'
						: configured === 'permissionDenied'
							? 'permissionDenied'
							: configured === 'unsupportedConfiguration'
								? 'unsupportedConfiguration'
								: 'unavailable',
					'configure',
					`Failed to configure the capture session: ${configured}`,
				)
			}

			currentConfig = { ...next }
		},
		focusAtPoint: (point) => {
			try {
				host.focusAtPoint?.({ x: point.x, y: point.y })
			} catch {
				// A missed metering pass must not fault the session.
			}
		},
		startCapture: (request, sink) => {
			if (host.permissionStatus('camera') === 'undeclared') {
				sink.settled({
					kind: 'failed',
					stage: 'preparation',
					issue: emitIssue(
						'configurationMissing',
						'startRecording',
						"Missing NSCameraUsageDescription in the host app's Info.plist",
					),
				})

				return
			}

			if (request.audio) {
				if (host.permissionStatus('microphone') === 'undeclared') {
					sink.settled({
						kind: 'failed',
						stage: 'preparation',
						issue: emitIssue(
							'configurationMissing',
							'startRecording',
							"Missing NSMicrophoneUsageDescription in the host app's Info.plist",
						),
					})

					return
				}

				const mic = host.permissionStatus('microphone')
				if (mic !== 'granted') {
					sink.settled({
						kind: 'failed',
						stage: 'preparation',
						issue: emitIssue(
							mic === 'restricted' ? 'permissionRestricted' : 'permissionDenied',
							'startRecording',
							`Microphone permission is ${mic}`,
						),
					})

					return
				}

				if (!host.audioDeviceAvailable()) {
					sink.settled({
						kind: 'failed',
						stage: 'preparation',
						issue: emitIssue('unavailable', 'startRecording', 'No audio input device is available'),
					})

					return
				}
			}

			const rotationAngle =
				request.orientation !== undefined
					? orientationToRotationAngle(request.orientation)
					: undefined

			if (request.orientation !== undefined && rotationAngle === undefined) {
				sink.settled({
					kind: 'failed',
					stage: 'preparation',
					issue: emitIssue(
						'unsupportedConfiguration',
						'startRecording',
						`Orientation '${request.orientation}' is not supported by this connection`,
					),
				})

				return
			}

			const configured = host.configure({
				cameraId: selectedCameraId(),
				audio: request.audio || (currentConfig.audio ?? false),
				rotationAngle,
			})

			if (configured) {
				sink.settled({
					kind: 'failed',
					stage: 'preparation',
					issue: emitIssue(
						configured === 'unsupportedConfiguration' ? 'unsupportedConfiguration' : 'unavailable',
						'startRecording',
						configured === 'unsupportedConfiguration'
							? `Orientation '${request.orientation}' is not supported by this connection`
							: 'The requested capture configuration is unavailable',
					),
				})

				return
			}

			let filePath: string
			if (request.destinationPath) {
				// Canonicalize before the prefix check — a '..' segment keeps
				// the root prefix on a raw string while resolving outside it.
				const destination = canonicalizePath(request.destinationPath)
				const inside = destination.startsWith(`${appPrivateRoot()}/`)
				const directory = destination.slice(0, destination.lastIndexOf('/'))

				const directoryExists = inside && pathExists(directory)
				const fileExists = inside && pathExists(destination)
				if (!inside || !directoryExists || fileExists) {
					sink.settled({
						kind: 'failed',
						stage: 'preparation',
						issue: emitIssue(
							'destinationUnavailable',
							'startRecording',
							!inside
								? 'destinationFileUrl must resolve inside the app-private recordings directory'
								: fileExists
									? 'destinationFileUrl already exists'
									: 'destinationFileUrl directory does not exist',
						),
					})

					return
				}

				if (!/\.mov$/i.test(destination)) {
					sink.settled({
						kind: 'failed',
						stage: 'preparation',
						issue: emitIssue(
							'destinationUnavailable',
							'startRecording',
							'destinationFileUrl must use a .mov file name',
						),
					})

					return
				}

				filePath = destination
			} else {
				try {
					filePath = `${recordingsDirectory()}/clip-${Date.now()}-${Math.random()
						.toString(36)
						.slice(2, 8)}.mov`
				} catch (cause) {
					sink.settled({
						kind: 'failed',
						stage: 'preparation',
						issue: emitIssue(
							'destinationUnavailable',
							'startRecording',
							cause instanceof Error ? cause.message : String(cause),
							cause,
						),
					})

					return
				}
			}

			captureFilePath = filePath

			captureSink = sink
			captureRequest = request
			const failure = host.startRecording(filePath, request.maximumDurationMs ?? 0)
			if (failure) {
				captureSink = undefined
				captureRequest = undefined
				captureFilePath = ''
				sink.settled({
					kind: 'failed',
					stage: 'preparation',
					issue: emitIssue(
						'unavailable',
						'startRecording',
						`Failed to start movie capture: ${failure}`,
					),
				})
			}
		},
		stopCapture: () => {
			host.stopRecording()
		},
		elapsedMs: () => host.recordedMs(),
		openOutput: async (output) => {
			if (output.kind !== 'nativeFile' || !output.fileUrl) {
				throw error(
					'invalidArgument',
					'openOutput',
					'Only file-backed output can be opened on macOS',
				)
			}

			const filePath = decodeURIComponent(output.fileUrl.slice('file://'.length))
			if (!pathExists(filePath)) {
				throw error('unavailable', 'openOutput', `Movie file is missing at ${output.fileUrl}`)
			}

			const handle: MovieOutputHandle = {
				url: output.fileUrl,
				fileUrl: output.fileUrl,
				release: () => {},
			}

			return handle
		},
		release: async () => {
			released = true
			previewReadyFlag = false
			captureSink = undefined
			captureRequest = undefined
			host.dispose()
		},
		onPreviewDetached: () => {
			// The view went away while a take settles; the Swift side keeps the
			// session alive until recordingFinished arrives.
		},
		setObserver: (next) => {
			observer = next
		},
	}
}
