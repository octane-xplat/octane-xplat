import { File, knownFolders, path } from '@nativescript/core'
import { CameraCaptureError } from './types'
import type {
	BackendCaptureRequest,
	BackendCaptureSink,
	BackendObserver,
	BackendPreviewListener,
	CameraSessionBackend,
} from './session-core'

import type {
	CameraDeviceInfo,
	CameraInterruptionReason,
	CameraOrientation,
	CameraPermissionKind,
	CameraPermissionStatus,
	CaptureIssue,
	CameraSessionConfig,
	EffectiveCaptureConfig,
	MovieOutputHandle,
} from './types'

// AVAuthorizationStatus numeric values — the ambient const enum cannot be
// read under verbatimModuleSyntax in every build lane.
const authorizationNotDetermined = 0
const authorizationRestricted = 1
const authorizationDenied = 2
const authorizationAuthorized = 3

// CoreMedia sits outside the common NativeScript iOS ambient set — declare
// the handful of C functions this adapter needs instead of referencing the
// full typings.
declare function CMTimeGetSeconds(time: any): number
declare function CMTimeMakeWithSeconds(seconds: number, preferredTimescale: number): any
declare function CMVideoFormatDescriptionGetDimensions(videoDesc: any): {
	width: number
	height: number
}

// Ambient const enums cannot be read under verbatimModuleSyntax — keep the
// numeric values here with their Objective-C names.
const captureDevicePositionUnspecified = 0
const captureDevicePositionBack = 1
const captureDevicePositionFront = 2
const videoOrientationPortrait = 1
const videoOrientationPortraitUpsideDown = 2
const videoOrientationLandscapeRight = 3
const videoOrientationLandscapeLeft = 4
const interruptionVideoDeviceNotAvailableInBackground = 1
const interruptionAudioDeviceInUseByAnotherClient = 2
const interruptionVideoDeviceInUseByAnotherClient = 3
const interruptionVideoDeviceNotAvailableWithMultipleForegroundApps = 4
const interruptionVideoDeviceNotAvailableDueToSystemPressure = 5
const avErrorMaximumDurationReached = -11810

const mediaTypeFor = (kind: CameraPermissionKind): string =>
	kind === 'camera' ? AVMediaTypeVideo : AVMediaTypeAudio

const usageKeyFor = (kind: CameraPermissionKind): string =>
	kind === 'camera' ? 'NSCameraUsageDescription' : 'NSMicrophoneUsageDescription'

const readPermission = (kind: CameraPermissionKind): CameraPermissionStatus => {
	const status = AVCaptureDevice.authorizationStatusForMediaType(
		mediaTypeFor(kind),
	) as unknown as number

	switch (status) {
		case authorizationAuthorized:
			return 'granted'
		case authorizationDenied:
			return 'denied'
		case authorizationRestricted:
			return 'restricted'
		case authorizationNotDetermined:
			return 'notDetermined'
		default:
			return 'unknown'
	}
}

const requestAccess = (kind: CameraPermissionKind): Promise<CameraPermissionStatus> => {
	const declaration = NSBundle.mainBundle.objectForInfoDictionaryKey(usageKeyFor(kind))
	if (!declaration) {
		// Requesting access without the usage-description key crashes the
		// host app — refuse before reaching AVFoundation.
		return Promise.reject(
			new CameraCaptureError({
				kind: 'configurationMissing',
				operation: 'requestPermission',
				permission: kind,
				message: `Missing ${usageKeyFor(kind)} in the host app's Info.plist`,
			}),
		)
	}

	const status = readPermission(kind)
	if (status !== 'notDetermined') {
		// Repeated requests must not pretend to show a prompt the system
		// will not display.
		return Promise.resolve(status)
	}

	return new Promise<CameraPermissionStatus>((resolve) => {
		AVCaptureDevice.requestAccessForMediaTypeCompletionHandler(mediaTypeFor(kind), () =>
			resolve(readPermission(kind)),
		)
	})
}

const facingForPosition = (position: number): 'front' | 'back' | undefined =>
	position === captureDevicePositionFront
		? 'front'
		: position === captureDevicePositionBack
			? 'back'
			: undefined

const listCameras = (): AVCaptureDevice[] => {
	const types = [
		AVCaptureDeviceTypeBuiltInWideAngleCamera,
		AVCaptureDeviceTypeBuiltInUltraWideCamera,
		AVCaptureDeviceTypeBuiltInTelephotoCamera,
		AVCaptureDeviceTypeBuiltInDualCamera,
		AVCaptureDeviceTypeBuiltInDualWideCamera,
		AVCaptureDeviceTypeBuiltInTripleCamera,
		AVCaptureDeviceTypeBuiltInTrueDepthCamera,
	].filter((entry) => typeof entry === 'string')

	const discovery =
		AVCaptureDeviceDiscoverySession.discoverySessionWithDeviceTypesMediaTypePosition(
			types,
			AVMediaTypeVideo,
			captureDevicePositionUnspecified,
		)

	const devices: AVCaptureDevice[] = []
	const found = discovery?.devices
	const count = found?.count ?? 0
	for (let index = 0; index < count; index++) {
		devices.push(found.objectAtIndex(index))
	}

	if (!devices.length) {
		// Older runtime or no discovery support — fall back to the flat
		// device list so simulator-style "no camera" stays honest.
		const legacy = AVCaptureDevice.devicesWithMediaType(AVMediaTypeVideo)
		for (let index = 0; index < (legacy?.count ?? 0); index++) {
			devices.push(legacy.objectAtIndex(index))
		}
	}

	return devices
}

const selectDevice = (
	camera: CameraSessionConfig['camera'],
	devices: AVCaptureDevice[],
): AVCaptureDevice | undefined => {
	if (camera && typeof camera === 'object' && 'deviceId' in camera) {
		return devices.find((device) => device.uniqueID === camera.deviceId)
	}

	if (camera === 'front' || camera === 'back') {
		const position = camera === 'front' ? captureDevicePositionFront : captureDevicePositionBack
		return devices.find((device) => device.position === position)
	}

	return devices.find((device) => device.position === captureDevicePositionBack) ?? devices[0]
}

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

const orientationToLegacyConstant = (orientation: CameraOrientation): number | undefined =>
	orientation === 'portrait'
		? videoOrientationPortrait
		: orientation === 'portraitUpsideDown'
			? videoOrientationPortraitUpsideDown
			: orientation === 'landscapeLeft'
				? videoOrientationLandscapeLeft
				: orientation === 'landscapeRight'
					? videoOrientationLandscapeRight
					: undefined

/** Derive the cardinal capture orientation from a video track's
 *  preferred transform; `undefined` when it cannot be told honestly. */
const orientationFromTransform = (transform: CGAffineTransform): CameraOrientation => {
	const { a, b, c, d } = transform
	if (a === 0 && b === 1 && c === -1 && d === 0) {
		return 'portrait'
	}

	if (a === 0 && b === -1 && c === 1 && d === 0) {
		return 'portraitUpsideDown'
	}

	if (a === 1 && b === 0 && c === 0 && d === 1) {
		return 'landscapeRight'
	}

	if (a === -1 && b === 0 && c === 0 && d === -1) {
		return 'landscapeLeft'
	}

	return 'unspecified'
}

const mapInterruptionReason = (raw: number | undefined): CameraInterruptionReason => {
	switch (raw) {
		case interruptionVideoDeviceNotAvailableInBackground:
			return 'background'
		case interruptionAudioDeviceInUseByAnotherClient:
			return 'audioInUse'
		case interruptionVideoDeviceInUseByAnotherClient:
			return 'cameraInUse'
		case interruptionVideoDeviceNotAvailableWithMultipleForegroundApps:
			return 'multitasking'
		case interruptionVideoDeviceNotAvailableDueToSystemPressure:
			return 'systemPressure'
		default:
			return 'unknown'
	}
}

const recordingsDirectory = (): string => {
	const directory = path.join(knownFolders.documents().path, 'octane-camera')
	if (!File.exists(directory)) {
		NSFileManager.defaultManager.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(
			directory,
			true,
			null,
			undefined,
		)
	}

	return directory
}

const hasUsageDeclaration = (kind: CameraPermissionKind): boolean =>
	Boolean(NSBundle.mainBundle.objectForInfoDictionaryKey(usageKeyFor(kind)))

const minFreeDiskBytes = 64 * 1024 * 1024

const freeDiskBytes = (): number => {
	try {
		const attributes = NSFileManager.defaultManager.attributesOfFileSystemForPathError(
			knownFolders.documents().path,
			undefined,
		)

		const free = attributes?.objectForKey(NSFileSystemFreeSize) as unknown as NSNumber | undefined
		return free ? Number(free.longLongValue ?? free.doubleValue ?? 0) : Number.MAX_SAFE_INTEGER
	} catch {
		return Number.MAX_SAFE_INTEGER
	}
}

/** iOS adapter: one AVCaptureSession shared between the attached preview
 *  and a single AVCaptureMovieFileOutput capture attempt. */
export function createSessionBackend(config: CameraSessionConfig): CameraSessionBackend {
	let currentConfig = { ...config }
	let session: AVCaptureSession | undefined
	let videoInput: AVCaptureDeviceInput | undefined
	let audioInput: AVCaptureDeviceInput | undefined
	let movieOutput: AVCaptureMovieFileOutput | undefined
	let previewLayer: AVCaptureVideoPreviewLayer | undefined
	let previewHost: any
	let detachFrame: (() => void) | undefined
	let previewReadyFlag = false
	let device: AVCaptureDevice | undefined
	let observer: BackendObserver | undefined
	let observers: NSObjectProtocol[] = []
	let captureSink: BackendCaptureSink | undefined
	let captureRequest: BackendCaptureRequest | undefined
	let limitRequested = false
	let noDurationLimit: any
	let interrupted = false

	const RecordingDelegate = (NSObject as any).extend(
		{
			captureOutputDidStartRecordingToOutputFileAtURLFromConnections(
				_output: unknown,
				_url: unknown,
				_connections: unknown,
			) {
				onCaptureStarted()
			},
			captureOutputDidFinishRecordingToOutputFileAtURLFromConnectionsError(
				_output: unknown,
				url: NSURL,
				_connections: unknown,
				error: NSError | null,
			) {
				onCaptureFinished(url, error)
			},
		},
		{ protocols: [AVCaptureFileOutputRecordingDelegate] },
	)

	const recordingDelegate = RecordingDelegate.new()

	const emitIssue = (
		kind: CaptureIssue['kind'],
		operation: string,
		message: string,
		cause?: unknown,
	): CaptureIssue => ({
		kind,
		operation,
		message,
		cause,
	})

	const notify = (phase: 'began' | 'ended', reason?: CameraInterruptionReason) => {
		interrupted = phase === 'began'
		observer?.interruption(phase, reason)
		observer?.previewReady(previewReadyFlag && !interrupted)
	}

	const observeSession = (target: AVCaptureSession) => {
		const center = NSNotificationCenter.defaultCenter
		const add = (name: string, object: unknown, handler: (note: NSNotification) => void) => {
			observers.push(
				center.addObserverForNameObjectQueueUsingBlock(
					name,
					object as any,
					NSOperationQueue.mainQueue,
					handler,
				),
			)
		}

		add(AVCaptureSessionWasInterruptedNotification, target, (note) => {
			const raw = note.userInfo?.objectForKey(AVCaptureSessionInterruptionReasonKey) as
				| NSNumber
				| undefined

			notify('began', mapInterruptionReason(raw ? Number(raw.integerValue) : undefined))
		})

		add(AVCaptureSessionInterruptionEndedNotification, target, () => {
			notify('ended')
		})

		add(AVCaptureSessionRuntimeErrorNotification, target, () => {
			observer?.availability(false)
		})

		add(AVCaptureDeviceWasDisconnectedNotification, device, () => {
			observer?.availability(false)
		})

		add(AVCaptureDeviceWasConnectedNotification, null, () => {
			observer?.availability(true)
		})

		add(UIApplicationDidEnterBackgroundNotification, null, () => {
			notify('began', 'background')
		})

		add(UIApplicationWillEnterForegroundNotification, null, () => {
			notify('ended', 'background')
		})
	}

	const clearObservers = () => {
		const center = NSNotificationCenter.defaultCenter
		for (const entry of observers) {
			center.removeObserver(entry)
		}

		observers = []
	}

	const supportedPreset = (target: AVCaptureSession, captureDevice: AVCaptureDevice) =>
		target.canSetSessionPreset(AVCaptureSessionPreset1280x720) &&
		captureDevice.supportsAVCaptureSessionPreset(AVCaptureSessionPreset1280x720)

	/** Resolve the effective standard profile for the current camera:
	 *  720p/30 when the device supports it, otherwise the device's own
	 *  active format disclosed honestly. */
	const standardProfile = (captureDevice: AVCaptureDevice | undefined) => {
		if (captureDevice && session && supportedPreset(session, captureDevice)) {
			return { width: 1280, height: 720, frameRate: 30 }
		}

		const format = captureDevice?.activeFormat
		const dimensions = format
			? CMVideoFormatDescriptionGetDimensions(format.formatDescription)
			: undefined

		const range = captureDevice?.activeVideoMinFrameDuration
		const frameRate =
			range && range.timescale > 0 && range.value > 0
				? Math.round(range.timescale / range.value)
				: 30

		return {
			width: dimensions?.width ?? 1280,
			height: dimensions?.height ?? 720,
			frameRate,
		}
	}

	const ensureAudioInput = (target: AVCaptureSession): boolean => {
		if (audioInput) {
			return true
		}

		const mic = AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeAudio)
		if (!mic) {
			return false
		}

		const input = AVCaptureDeviceInput.deviceInputWithDeviceError(mic, undefined)
		if (!input || !target.canAddInput(input)) {
			return false
		}

		target.addInput(input)
		audioInput = input
		return true
	}

	const ensureSession = (): AVCaptureSession => {
		if (session) {
			return session
		}

		const target = AVCaptureSession.new()
		target.beginConfiguration()
		device = selectDevice(currentConfig.camera, listCameras())
		if (!device) {
			target.commitConfiguration()
			throw new CameraCaptureError({
				kind: 'unavailable',
				operation: 'startPreview',
				message: 'No camera device is available',
			})
		}

		if (supportedPreset(target, device)) {
			target.sessionPreset = AVCaptureSessionPreset1280x720
		}

		const input = AVCaptureDeviceInput.deviceInputWithDeviceError(device, undefined)
		if (!input || !target.canAddInput(input)) {
			target.commitConfiguration()
			throw new CameraCaptureError({
				kind: 'unavailable',
				operation: 'startPreview',
				message: 'Camera input is unavailable',
			})
		}

		target.addInput(input)
		videoInput = input
		const output = AVCaptureMovieFileOutput.new()
		if (target.canAddOutput(output)) {
			target.addOutput(output)
			movieOutput = output
			noDurationLimit = output.maxRecordedDuration
		} else {
			target.commitConfiguration()
			throw new CameraCaptureError({
				kind: 'unsupportedPlatform',
				operation: 'startPreview',
				message: 'Movie file output is unavailable on this device',
			})
		}

		if (currentConfig.audio && readPermission('microphone') === 'granted') {
			ensureAudioInput(target)
		}

		target.commitConfiguration()
		session = target
		observeSession(target)
		return target
	}

	const stopSessionIfIdle = () => {
		if (!session || captureSink || previewHost) {
			return
		}

		session.stopRunning()
		clearObservers()
		session = undefined
		videoInput = undefined
		audioInput = undefined
		movieOutput = undefined
		previewLayer = undefined
		device = undefined
	}

	const onCaptureStarted = () => {
		const request = captureRequest
		const sink = captureSink
		if (!request || !sink || !device) {
			return
		}

		const profile = standardProfile(device)
		const configuration: EffectiveCaptureConfig = {
			cameraId: device.uniqueID,
			facing: facingForPosition(device.position),
			audio: request.audio && audioInput !== undefined,
			width: profile.width,
			height: profile.height,
			frameRate: profile.frameRate,
			orientation: request.orientation ?? 'unspecified',
			mimeType: 'video/quicktime',
			container: 'mov',
		}

		sink.started(configuration)
	}

	const onCaptureFinished = (url: NSURL, error: NSError | null) => {
		const request = captureRequest
		const sink = captureSink
		captureRequest = undefined
		captureSink = undefined
		if (!request || !sink) {
			return
		}

		const filePath = url?.path ? String(url.path) : ''
		const succeeded =
			!error ||
			error.userInfo?.objectForKey(AVErrorRecordingSuccessfullyFinishedKey)?.boolValue === true

		if (!succeeded) {
			// Clean up only the file this attempt created — never a
			// pre-existing app file (admission rejects existing paths).
			try {
				if (filePath && File.exists(filePath)) {
					NSFileManager.defaultManager.removeItemAtPathError(filePath, undefined)
				}
			} catch {
				// Temporary leftovers are reclaimed by the OS.
			}

			sink.settled({
				kind: 'failed',
				stage: 'capture',
				issue: emitIssue(
					'captureFailed',
					'finalize',
					error?.localizedDescription ?? 'Movie recording did not complete',
					error,
				),
			})

			stopSessionIfIdle()
			return
		}

		const limitReached = limitRequested && error?.code === avErrorMaximumDurationReached
		try {
			const asset = AVURLAsset.assetWithURL(url)
			const durationSeconds = asset ? CMTimeGetSeconds(asset.duration) : 0
			const videoTracks = asset?.tracksWithMediaType(AVMediaTypeVideo)
			const audioTracks = asset?.tracksWithMediaType(AVMediaTypeAudio)
			const track = videoTracks && videoTracks.count > 0 ? videoTracks.objectAtIndex(0) : null
			if (!track || !(durationSeconds > 0)) {
				try {
					if (filePath && File.exists(filePath)) {
						NSFileManager.defaultManager.removeItemAtPathError(filePath, undefined)
					}
				} catch {
					// Temporary leftovers are reclaimed by the OS.
				}

				sink.settled({
					kind: 'failed',
					stage: 'capture',
					issue: emitIssue('noMedia', 'finalize', 'The finalized movie contains no playable media'),
				})

				stopSessionIfIdle()
				return
			}

			const naturalSize = track.naturalSize
			const transform = track.preferredTransform
			const orientation =
				request.orientation && request.orientation !== 'unspecified'
					? request.orientation
					: orientationFromTransform(transform)

			const rotated = Math.abs(transform.b) === 1 && Math.abs(transform.c) === 1
			const width = rotated ? naturalSize.height : naturalSize.width
			const height = rotated ? naturalSize.width : naturalSize.height
			if (request.audio && !(audioTracks && audioTracks.count > 0)) {
				// Requested audio missing must not masquerade as silent
				// capture — classify as failure, not a successful clip.
				try {
					if (filePath && File.exists(filePath)) {
						NSFileManager.defaultManager.removeItemAtPathError(filePath, undefined)
					}
				} catch {
					// Temporary leftovers are reclaimed by the OS.
				}

				sink.settled({
					kind: 'failed',
					stage: 'capture',
					issue: emitIssue(
						'captureFailed',
						'finalize',
						'Requested audio track is missing from the finalized movie',
					),
				})

				stopSessionIfIdle()
				return
			}

			sink.settled({
				kind: 'clip',
				output: {
					kind: 'nativeFile',
					resourceId: `file:${filePath}`,
					fileUrl: `file://${filePath}`,
				},
				mimeType: 'video/quicktime',
				durationMs: Math.round(durationSeconds * 1000),
				width,
				height,
				orientation,
				hasAudio: request.audio && (audioTracks?.count ?? 0) > 0,
				limitReached,
			})
		} catch (cause) {
			sink.settled({
				kind: 'failed',
				stage: 'finalization',
				issue: emitIssue(
					'finalizationFailed',
					'finalize',
					cause instanceof Error ? cause.message : String(cause),
					cause,
				),
			})
		}

		stopSessionIfIdle()
	}

	return {
		platform: 'ios',
		supported: typeof AVCaptureMovieFileOutput !== 'undefined',
		checkPermission: async (kind) => {
			if (!hasUsageDeclaration(kind)) {
				// Missing declarations are a setup error, not a permission
				// status — surface through start/configure failures instead of
				// pretending a status.
				return 'unknown'
			}

			return readPermission(kind)
		},
		requestPermission: (kind) => requestAccess(kind),
		getCapabilities: async () => {
			const devices = listCameras()
			const cameras: CameraDeviceInfo[] = devices.map((entry) => ({
				id: entry.uniqueID,
				label: entry.localizedName ?? entry.uniqueID,
				facing: facingForPosition(entry.position),
			}))

			const selected = device ?? selectDevice(currentConfig.camera, devices)
			const profile = selected
				? (() => {
						const probe = AVCaptureSession.new()
						probe.beginConfiguration()
						const supported = supportedPreset(probe, selected)
						probe.commitConfiguration()
						return supported
							? { width: 1280, height: 720, frameRate: 30 }
							: standardProfile(selected)
					})()
				: { width: 1280, height: 720, frameRate: 30 }

			const available = cameras.length > 0
			const supported = typeof AVCaptureMovieFileOutput !== 'undefined' && available
			return {
				supported,
				reason: !available
					? 'No camera device is available on this host'
					: typeof AVCaptureMovieFileOutput === 'undefined'
						? 'Movie file output is unsupported by this runtime'
						: undefined,
				available,
				cameras,
				profiles: [{ profile: 'standard', ...profile }],
				audio: typeof AVCaptureDevice.defaultDeviceWithMediaType === 'function',
				orientations: ['portrait', 'portraitUpsideDown', 'landscapeLeft', 'landscapeRight'],
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
		previewReady: () => previewReadyFlag && !interrupted,
		attachPreview: (host, listener?: BackendPreviewListener) => {
			let target: AVCaptureSession
			try {
				target = ensureSession()
			} catch (error) {
				throw error instanceof CameraCaptureError
					? error
					: new CameraCaptureError({
							kind: 'unavailable',
							operation: 'startPreview',
							message: error instanceof Error ? error.message : String(error),
							cause: error,
						})
			}

			const view = host as any
			const nativeView = view?.ios ?? view?.nativeViewProtected
			if (!nativeView?.layer) {
				throw new CameraCaptureError({
					kind: 'invalidArgument',
					operation: 'attachPreview',
					message: 'Camera preview host is unavailable',
				})
			}

			const layer = AVCaptureVideoPreviewLayer.layerWithSession(target)
			layer.videoGravity = AVLayerVideoGravityResizeAspectFill
			const connection = layer.connection
			if (connection) {
				connection.automaticallyAdjustsVideoMirroring = false
				if (connection.supportsVideoMirroring) {
					connection.videoMirrored = device?.position === captureDevicePositionFront
				}
			}

			nativeView.layer.addSublayer(layer)
			previewLayer = layer
			previewHost = view
			const updateFrame = () => {
				layer.frame = nativeView.bounds
			}

			detachFrame = () => view.off?.('layoutChanged', updateFrame)
			view.on?.('layoutChanged', updateFrame)
			updateFrame()
			target.startRunning()
			previewReadyFlag = true
			observer?.previewReady(true)
			listener?.onReady?.()
			return () => {
				previewReadyFlag = false
				view.off?.('layoutChanged', updateFrame)
				layer.removeFromSuperlayer()
				previewLayer = undefined
				previewHost = undefined
				detachFrame = undefined
				observer?.previewReady(false)
				stopSessionIfIdle()
			}
		},
		configure: (next) => {
			const previous = currentConfig
			currentConfig = { ...next }
			const target = session
			if (!target || !device) {
				return
			}

			target.beginConfiguration()
			const wanted = selectDevice(next.camera ?? previous.camera, listCameras())
			if (wanted && wanted !== device && videoInput) {
				const input = AVCaptureDeviceInput.deviceInputWithDeviceError(wanted, undefined)
				if (input && target.canAddInput(input)) {
					target.removeInput(videoInput)
					target.addInput(input)
					videoInput = input
					device = wanted
				}
			}

			if (next.audio === true && readPermission('microphone') === 'granted') {
				ensureAudioInput(target)
			} else if (next.audio === false && audioInput) {
				target.removeInput(audioInput)
				audioInput = undefined
			}

			target.commitConfiguration()
		},
		startCapture: (request, sink) => {
			const target = session
			if (!target || !movieOutput || !device) {
				sink.settled({
					kind: 'failed',
					stage: 'preparation',
					issue: emitIssue('unavailable', 'startRecording', 'The camera session is not running'),
				})

				return
			}

			if (!hasUsageDeclaration('camera')) {
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
				if (!hasUsageDeclaration('microphone')) {
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

				const micStatus = readPermission('microphone')
				if (micStatus !== 'granted') {
					sink.settled({
						kind: 'failed',
						stage: 'preparation',
						issue: emitIssue(
							micStatus === 'restricted' ? 'permissionRestricted' : 'permissionDenied',
							'startRecording',
							`Microphone permission is ${micStatus}`,
							{ permission: 'microphone' },
						),
					})

					return
				}

				if (!audioInput) {
					target.beginConfiguration()
					const added = ensureAudioInput(target)
					target.commitConfiguration()
					if (!added) {
						sink.settled({
							kind: 'failed',
							stage: 'preparation',
							issue: emitIssue(
								'unavailable',
								'startRecording',
								'No audio input device is available',
							),
						})

						return
					}
				}
			}

			const connection = movieOutput.connectionWithMediaType(AVMediaTypeVideo)
			if (request.orientation) {
				const angle = orientationToRotationAngle(request.orientation)
				const legacy = orientationToLegacyConstant(request.orientation)
				let applied = false
				if (
					connection &&
					angle !== undefined &&
					typeof connection.isVideoRotationAngleSupported === 'function' &&
					connection.isVideoRotationAngleSupported(angle)
				) {
					connection.videoRotationAngle = angle
					applied = true
				} else if (connection && legacy !== undefined && connection.supportsVideoOrientation) {
					connection.videoOrientation = legacy
					applied = true
				}

				if (!applied) {
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
			}

			if (connection) {
				// Recorded output is unmirrored, including the front camera —
				// the preview may stay mirrored under its existing behavior.
				connection.automaticallyAdjustsVideoMirroring = false
				if (connection.supportsVideoMirroring) {
					connection.videoMirrored = false
				}
			}

			let filePath: string
			if (request.destinationPath) {
				const directory = request.destinationPath.slice(0, request.destinationPath.lastIndexOf('/'))
				if (!File.exists(directory) || File.exists(request.destinationPath)) {
					sink.settled({
						kind: 'failed',
						stage: 'preparation',
						issue: emitIssue(
							'destinationUnavailable',
							'startRecording',
							File.exists(request.destinationPath)
								? 'destinationFileUrl already exists'
								: 'destinationFileUrl directory does not exist',
						),
					})

					return
				}

				filePath = request.destinationPath
			} else {
				try {
					filePath = path.join(
						recordingsDirectory(),
						`clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mov`,
					)
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

			if (freeDiskBytes() < minFreeDiskBytes) {
				sink.settled({
					kind: 'failed',
					stage: 'preparation',
					issue: emitIssue(
						'insufficientStorage',
						'startRecording',
						'Not enough local storage for a movie recording',
					),
				})

				return
			}

			limitRequested = request.maximumDurationMs !== undefined
			movieOutput.maxRecordedDuration =
				request.maximumDurationMs !== undefined
					? CMTimeMakeWithSeconds(request.maximumDurationMs / 1000, 600)
					: (noDurationLimit ?? movieOutput.maxRecordedDuration)

			captureRequest = request
			captureSink = sink
			try {
				movieOutput.startRecordingToOutputFileURLRecordingDelegate(
					NSURL.fileURLWithPath(filePath),
					recordingDelegate,
				)
			} catch (cause) {
				captureRequest = undefined
				captureSink = undefined
				sink.settled({
					kind: 'failed',
					stage: 'preparation',
					issue: emitIssue(
						'captureFailed',
						'startRecording',
						cause instanceof Error ? cause.message : String(cause),
						cause,
					),
				})
			}
		},
		stopCapture: () => {
			try {
				if (movieOutput?.recording) {
					movieOutput.stopRecording()
				}
			} catch {
				// Settlement still arrives through the delegate callback.
			}
		},
		elapsedMs: () => {
			try {
				const duration = movieOutput?.recordedDuration
				if (!duration) {
					return 0
				}

				return Math.max(0, Math.round(CMTimeGetSeconds(duration) * 1000))
			} catch {
				return 0
			}
		},
		openOutput: async (output) => {
			if (output.kind !== 'nativeFile') {
				throw new CameraCaptureError({
					kind: 'invalidArgument',
					operation: 'openOutput',
					message: 'Only file-backed output can be opened on iOS',
				})
			}

			const filePath = output.fileUrl.slice('file://'.length)
			if (!File.exists(filePath)) {
				throw new CameraCaptureError({
					kind: 'unavailable',
					operation: 'openOutput',
					message: `Movie file is missing at ${output.fileUrl}`,
				})
			}

			const handle: MovieOutputHandle = {
				url: output.fileUrl,
				fileUrl: output.fileUrl,
				release: () => {},
			}

			return handle
		},
		release: async () => {
			previewReadyFlag = false
			detachFrame?.()
			detachFrame = undefined
			if (previewHost) {
				try {
					previewLayer?.removeFromSuperlayer()
				} catch {}
			}

			previewHost = undefined
			previewLayer = undefined
			captureRequest = undefined
			captureSink = undefined
			clearObservers()
			try {
				session?.stopRunning()
			} catch {}

			session = undefined
			videoInput = undefined
			audioInput = undefined
			movieOutput = undefined
			device = undefined
		},
		onPreviewDetached: () => {
			// The view went away; if a settle is still in flight the session
			// stays alive until it arrives (stopSessionIfIdle re-checks).
			stopSessionIfIdle()
		},
		setObserver: (next) => {
			observer = next
		},
	}
}
