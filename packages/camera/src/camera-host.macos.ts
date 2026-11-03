// TypeScript port of the removed Swift XplatCameraHost. The bridge wraps
// AVFoundation instances as untyped NativeObject — re-pointing the prototype
// (same idiom as the packaged host's WebSocket shim) binds the class members.
// Serial session operations are preserved: the JS thread serializes calls,
// while start/stopRunning dispatch natively on detached threads through
// performSelectorInBackground — gated by the session-op queue below because
// detached threads carry no ordering.
declare const objc: { import(framework: string): void }
declare const NSObject: any
declare const NativeClass: (cls: unknown) => void
declare const interop: any

const g = globalThis as any

declare const AVCaptureSession: any
declare const AVCaptureDevice: any
declare const AVCaptureDeviceInput: any
declare const AVCaptureDeviceDiscoverySession: any
declare const AVCaptureMovieFileOutput: any
declare const AVCapturePhotoOutput: any
declare const AVCapturePhotoSettings: any
declare const AVCapturePhoto: any
declare const AVCaptureVideoPreviewLayer: any
declare const AVCaptureConnection: any
declare const AVCaptureFileOutputRecordingDelegate: any
declare const AVCapturePhotoCaptureDelegate: any
declare const AVURLAsset: any
declare const AVAssetTrack: any
declare const NSError: any
declare const NSBundle: any
declare const NSFileManager: any
declare const NSMutableDictionary: any
declare const NSNotificationCenter: any
declare const NSOperationQueue: any
declare const NSURL: any
declare const NSNumber: any

declare const AVMediaTypeVideo: string
declare const AVMediaTypeAudio: string
declare const AVCaptureDeviceTypeBuiltInWideAngleCamera: string
declare const AVCaptureDeviceTypeExternalUnknown: string
declare const AVCaptureSessionPreset1280x720: string
declare const AVCaptureSessionWasInterruptedNotification: string
declare const AVCaptureSessionInterruptionEndedNotification: string
declare const AVCaptureSessionRuntimeErrorNotification: string
declare const AVCaptureSessionDidStartRunningNotification: string
declare const AVCaptureSessionDidStopRunningNotification: string
declare const AVCaptureDeviceWasDisconnectedNotification: string
declare const AVCaptureDeviceWasConnectedNotification: string
declare const AVVideoCodecKey: string
declare const AVVideoCodecTypeJPEG: string
declare const AVErrorRecordingSuccessfullyFinishedKey: string

declare const CMTimeGetSeconds: (time: unknown) => number
declare const CMTimeMakeWithSeconds: (seconds: number, timescale: number) => unknown
declare const CMVideoFormatDescriptionGetDimensions: (desc: unknown) => {
	width: number
	height: number
}

declare const CMFormatDescriptionGetMediaSubType: (desc: unknown) => number

// AVAuthorizationStatus.
const authNotDetermined = 0
const authRestricted = 1
const authDenied = 2
const authAuthorized = 3

// AVErrorMaximumDurationReached — the constant is absent from the bridge
// metadata; the numeric value is stable ABI in AVFoundation/AVError.h.
const avErrorMaximumDurationReached = -11847

const typed = (object: any, cls: any): any =>
	object == null ? object : Object.setPrototypeOf(object, cls.prototype)

let RecordingDelegateClass: any
const recordingDelegateClass = () => {
	// captureOutput:didStartRecordingToOutputFileAtURL:fromConnections: is
	// deliberately absent: delivering it to a JS delegate crashes the host —
	// it fires re-entrantly while startRecording is still returning. Start
	// confirmation is synthesized from isRecording polling instead (see
	// startRecording), which preserves the recordingStarted contract.
	RecordingDelegateClass ??= NSObject.extend(
		{
			captureOutputDidFinishRecordingToOutputFileAtURLFromConnectionsError(
				output: any,
				url: any,
				_connections: any,
				error: any,
			) {
				;(this as any).onFinish?.(output, url, error)
			},
		},
		{
			protocols: [AVCaptureFileOutputRecordingDelegate],
			exposedMethods: {
				'captureOutput:didFinishRecordingToOutputFileURL:fromConnections:error:': {
					params: [interop.types.id, interop.types.id, interop.types.id, interop.types.id],
					returns: interop.types.void,
				},
			},
		},
	)
	return RecordingDelegateClass
}

let PhotoDelegateClass: any
const photoDelegateClass = () => {
	PhotoDelegateClass ??= NSObject.extend(
		{
			captureOutputDidFinishProcessingPhotoError(_output: any, photo: any, error: any) {
				;(this as any).onPhoto?.(photo, error)
			},
		},
		{
			protocols: [AVCapturePhotoCaptureDelegate],
			exposedMethods: {
				'captureOutput:didFinishProcessingPhoto:error:': {
					params: [interop.types.id, interop.types.id, interop.types.id],
					returns: interop.types.void,
				},
			},
		},
	)
	return PhotoDelegateClass
}

// Shared across preview, movie and still-photo hosts: a busy source is never
// stolen. Single-threaded JS makes the Swift NSLock unnecessary.
const cameraOwners = new Map<string, object>()
const claimCamera = (id: string, owner: object): boolean => {
	const current = cameraOwners.get(id)
	if (current !== undefined && current !== owner) {
		return false
	}
	cameraOwners.set(id, owner)
	return true
}

const releaseCamera = (id: string, owner: object): void => {
	if (cameraOwners.get(id) === owner) {
		cameraOwners.delete(id)
	}
}

// Degrees → AVCaptureVideoOrientation (landscapeRight native = 0).
const orientationForAngle = (angle: number): number | undefined =>
	angle === 0 ? 3 : angle === 90 ? 1 : angle === 180 ? 4 : angle === 270 ? 2 : undefined

const fourCharCode = (value: number): string =>
	String.fromCharCode(
		(value >>> 24) & 0xff,
		(value >>> 16) & 0xff,
		(value >>> 8) & 0xff,
		value & 0xff,
	)

export interface CameraHost {
	attachPreview(view: object): string | null
	detachPreview(): void
	installObserver(listener: (message: string) => void): void
	permissionStatus(kind: string): string
	requestPermissionReply(kind: string, reply: (status: string) => void): void
	devices(): string
	audioDeviceAvailable(): boolean
	audioInputAttached(): boolean
	activeDeviceId(): string | null
	configure(options: {
		cameraId?: string
		photo?: boolean
		audio?: boolean
		rotationAngle?: number
	}): string | null
	focusAtPoint(point: { x: number; y: number }): boolean
	supportsRotationAngles(): boolean
	movieDirectory(): string | null
	startRecording(path: string, maximumDurationMs: number): string | null
	stopRecording(): void
	recording(): boolean
	recordedMs(): number
	previewSize(): string
	capturePhoto(reply: (data: unknown) => void): string | null
	dispose(): void
}

/** One capture host: an AVCaptureSession shared by an optional preview layer,
 *  one still-photo output and one movie-file output at a time. */
export function createCameraHost(): CameraHost {
	objc.import('AVFoundation')
	objc.import('CoreMedia')
	objc.import('QuartzCore')
	objc.import('AppKit')

	let session: any
	let videoInput: any
	let audioInput: any
	let movieOutput: any
	let photoOutput: any
	let photoReply: ((data: any) => void) | undefined
	let photoDelegate: any
	let claimedCameraIds = new Set<string>()
	let previewLayer: any
	let previewView: WeakRef<any> | null = null
	let configuredCameraId: string | undefined
	let rotationAngle: number | undefined
	let emit: ((message: string) => void) | undefined
	let observers: any[] = []
	let disposed = false
	let recordingPath: string | undefined
	let recordingDelegate: any
	let startPollTimer: ReturnType<typeof setInterval> | undefined

	// Serial session operations: detached ops (start/stopRunning) run one at a
	// time; synchronous ops wait behind any in-flight detached op, matching the
	// Swift private serial queue.
	type DetachedKind = 'start' | 'stop'
	interface InFlightOp {
		id: number
		kind: DetachedKind
	}
	let opInFlight: InFlightOp | undefined
	let nextOpId = 0
	const opQueue: Array<{ kind: DetachedKind; run: () => void }> = []
	const drainOps = () => {
		if (opInFlight || !opQueue.length) {
			return
		}
		const op = opQueue.shift()!
		op.run()
	}
	const enqueueOp = (kind: DetachedKind, run: () => void) => {
		opQueue.push({ kind, run })
		drainOps()
	}
	const detached = (kind: DetachedKind, fn: () => void) => {
		const current: InFlightOp = { id: ++nextOpId, kind }
		opInFlight = current
		fn()
		// Detached native dispatch has no completion callback; the paired
		// session notification releases the queue. A generation-scoped stall
		// guard keeps a lost notification from wedging later operations without
		// releasing a successor's gate.
		setTimeout(() => {
			if (opInFlight === current) {
				opInFlight = undefined
				drainOps()
			}
		}, 2000)
	}
	const releaseOp = (kind?: DetachedKind) => {
		if (opInFlight && (kind === undefined || opInFlight.kind === kind)) {
			opInFlight = undefined
			drainOps()
		}
	}

	const send = (payload: Record<string, unknown>) => {
		try {
			emit?.(JSON.stringify(payload))
		} catch {
			// A failed listener must not fault the session.
		}
	}

	const statusFor = (mediaType: string): string => {
		switch (AVCaptureDevice.authorizationStatusForMediaType(mediaType)) {
			case authAuthorized:
				return 'granted'
			case authDenied:
				return 'denied'
			case authRestricted:
				return 'restricted'
			case authNotDetermined:
				return 'notDetermined'
			default:
				return 'unknown'
		}
	}
	const mediaKind = (kind: string) => (kind === 'microphone' ? AVMediaTypeAudio : AVMediaTypeVideo)
	const declared = (mediaType: string) => {
		const key =
			mediaType === AVMediaTypeAudio ? 'NSMicrophoneUsageDescription' : 'NSCameraUsageDescription'
		return NSBundle.mainBundle.objectForInfoDictionaryKey(key) != null
	}

	const cameraDevices = (): any[] => {
		const discovery =
			AVCaptureDeviceDiscoverySession.discoverySessionWithDeviceTypesMediaTypePosition(
				[AVCaptureDeviceTypeBuiltInWideAngleCamera, AVCaptureDeviceTypeExternalUnknown],
				AVMediaTypeVideo,
				0,
			)
		typed(discovery, AVCaptureDeviceDiscoverySession)
		const found: any[] = []
		const list = discovery.devices
		for (let i = 0; i < (list?.count ?? 0); i++) {
			found.push(list.objectAtIndex(i))
		}
		// The discovery session is authoritative; keep the legacy enumerator as
		// a merge source for devices on older system builds.
		const legacy = AVCaptureDevice.devicesWithMediaType(AVMediaTypeVideo)
		for (let i = 0; i < (legacy?.count ?? 0); i++) {
			const device = legacy.objectAtIndex(i)
			if (!found.some((entry) => entry === device || entry.isEqual?.(device))) {
				found.push(device)
			}
		}
		for (const device of found) {
			typed(device, AVCaptureDevice)
		}
		return found
	}

	const movieClipInfo = (url: any) => {
		const asset = typed(AVURLAsset.alloc().initWithURL(url), AVURLAsset)
		let width = 0,
			height = 0,
			rotation = 0
		let videoCodec: string | undefined
		const videoTracks = asset.tracksWithMediaType(AVMediaTypeVideo)
		if (videoTracks.count > 0) {
			const track = typed(videoTracks.objectAtIndex(0), AVAssetTrack)
			const size = track.naturalSize
			const t = track.preferredTransform
			width = Math.abs(size.width * t.a + size.height * t.c)
			height = Math.abs(size.width * t.b + size.height * t.d)
			rotation = (Math.atan2(t.b, t.a) * 180) / Math.PI
			if (rotation < 0) {
				rotation += 360
			}

			const descriptions = track.formatDescriptions
			if (descriptions.count > 0) {
				const subtype = fourCharCode(
					CMFormatDescriptionGetMediaSubType(descriptions.objectAtIndex(0)),
				)

				if (subtype === 'avc1') {
					videoCodec = 'avc1'
				} else if (subtype === 'hvc1' || subtype === 'hev1') {
					videoCodec = 'hvc1'
				}
			}
		}
		const duration = CMTimeGetSeconds(asset.duration)
		const attrs = NSFileManager.defaultManager.attributesOfItemAtPathError(String(url.path), null)
		const size = Number(attrs?.objectForKey?.('NSFileSize') ?? 0)
		const info: Record<string, unknown> = {
			fileUrl: String(url.absoluteString),
			durationMs: Number.isFinite(duration) ? duration * 1000 : 0,
			width,
			height,
			rotationAngle: (Math.round(rotation / 90) * 90) % 360,
			fileSize: Number.isFinite(size) ? size : 0,
			hasAudio: asset.tracksWithMediaType(AVMediaTypeAudio).count > 0,
			mimeType: 'video/quicktime',
			container: 'mov',
		}
		if (videoCodec) {
			info.videoCodec = videoCodec
		}
		return info
	}

	const handleSessionNotification = (name: string) => {
		switch (name) {
			case AVCaptureSessionWasInterruptedNotification:
				// macOS publishes no interruption-reason keys.
				send({ type: 'interrupted', cause: 'unknown' })
				return
			case AVCaptureSessionInterruptionEndedNotification:
				send({ type: 'interruptionEnded' })
				return
			case AVCaptureSessionRuntimeErrorNotification:
				releaseOp()
				send({ type: 'availability', available: false })
				send({ type: 'interrupted', cause: 'cameraInUse' })
				return
			case AVCaptureSessionDidStartRunningNotification:
				releaseOp('start')
				send({ type: 'previewReady', ready: true })
				return
			case AVCaptureSessionDidStopRunningNotification:
				releaseOp('stop')
				send({ type: 'previewReady', ready: false })
				return
		}
	}

	const ensureSession = (): any => {
		if (session) {
			return session
		}
		if (statusFor(AVMediaTypeVideo) !== 'granted') {
			return undefined
		}
		const created = typed(AVCaptureSession.alloc().init(), AVCaptureSession)
		if (created.canSetSessionPreset(AVCaptureSessionPreset1280x720)) {
			created.sessionPreset = AVCaptureSessionPreset1280x720
		}
		session = created
		const center = NSNotificationCenter.defaultCenter
		for (const name of [
			AVCaptureSessionWasInterruptedNotification,
			AVCaptureSessionInterruptionEndedNotification,
			AVCaptureSessionRuntimeErrorNotification,
			AVCaptureSessionDidStartRunningNotification,
			AVCaptureSessionDidStopRunningNotification,
		]) {
			observers.push(
				center.addObserverForNameObjectQueueUsingBlock(
					name,
					created,
					NSOperationQueue.mainQueue,
					() => handleSessionNotification(name),
				),
			)
		}
		for (const [name, available] of [
			[AVCaptureDeviceWasDisconnectedNotification, false],
			[AVCaptureDeviceWasConnectedNotification, true],
		] as const) {
			observers.push(
				center.addObserverForNameObjectQueueUsingBlock(name, null, NSOperationQueue.mainQueue, () =>
					send({ type: 'availability', available }),
				),
			)
		}
		return created
	}

	const applyOrientation = (connection: any) => {
		if (connection == null || rotationAngle === undefined) {
			return
		}
		typed(connection, AVCaptureConnection)
		const orientation = orientationForAngle(rotationAngle)
		if (orientation !== undefined && connection.isVideoOrientationSupported()) {
			connection.videoOrientation = orientation
		}
	}

	const configure = (options: {
		cameraId?: string
		photo?: boolean
		audio?: boolean
		rotationAngle?: number
	}): string | null => {
		if (disposed) {
			return 'unavailable'
		}
		const current = ensureSession()
		if (!current) {
			return 'permissionDenied'
		}
		// Synchronous on the JS thread — identical blocking semantics to the
		// Swift queue.sync. begin/commit mutations are legal while a detached
		// start/stop is in flight (AVFoundation's designed use), so a configure
		// issued behind a detached op may overlap it; detached start/stop ops
		// themselves stay strictly serialized.
		return configureNow(options)
	}

	const configureNow = (options: {
		cameraId?: string
		photo?: boolean
		audio?: boolean
		rotationAngle?: number
	}): string | null => {
		if (disposed) {
			return 'unavailable'
		}
		const cameraId = options.cameraId
		const photo = options.photo === true
		const audio = !photo && options.audio === true
		rotationAngle = typeof options.rotationAngle === 'number' ? options.rotationAngle : undefined
		const devices = cameraDevices()
		const device =
			cameraId != null
				? devices.find((entry) => String(entry.uniqueID) === cameraId)
				: (devices[0] ??
					typed(AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeVideo), AVCaptureDevice))
		if (!device) {
			return 'unavailable'
		}
		const deviceId = String(device.uniqueID)
		if (!claimCamera(deviceId, host)) {
			return 'busy'
		}
		claimedCameraIds.add(deviceId)
		let failure: string | null = null
		let videoConnection: any
		try {
			session.beginConfiguration()
			if (videoInput == null || String(videoInput.device.uniqueID) !== deviceId) {
				const alloc = typed(AVCaptureDeviceInput.alloc(), AVCaptureDeviceInput)
				const input = typed(alloc.initWithDeviceError(device, null), AVCaptureDeviceInput)
				if (input == null) {
					throw new Error('input')
				}

				if (videoInput != null) {
					session.removeInput(videoInput)
				}

				videoInput = input
				if (session.canAddInput(input)) {
					session.addInput(input)
				} else {
					failure = 'unavailable'
				}
			}

			if (audio && audioInput == null) {
				const microphone = typed(
					AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeAudio),
					AVCaptureDevice,
				)

				if (microphone) {
					const alloc = typed(AVCaptureDeviceInput.alloc(), AVCaptureDeviceInput)
					const input = typed(alloc.initWithDeviceError(microphone, null), AVCaptureDeviceInput)
					if (input != null && session.canAddInput(input)) {
						audioInput = input
						session.addInput(input)
					}
				}
			} else if (!audio && audioInput != null) {
				session.removeInput(audioInput)
				audioInput = undefined
			}

			if (photo && photoOutput == null) {
				const output = AVCapturePhotoOutput.new()
				if (session.canAddOutput(output)) {
					session.addOutput(output)
					photoOutput = typed(output, AVCapturePhotoOutput)
				} else {
					failure = 'unavailable'
				}
			}

			if (!photo && movieOutput == null) {
				const output = AVCaptureMovieFileOutput.new()
				if (session.canAddOutput(output)) {
					session.addOutput(output)
					movieOutput = typed(output, AVCaptureMovieFileOutput)
				}
			}

			session.commitConfiguration()
			if (rotationAngle !== undefined) {
				videoConnection = typed(
					movieOutput?.connectionWithMediaType(AVMediaTypeVideo),
					AVCaptureConnection,
				)

				const supported =
					videoConnection != null &&
					orientationForAngle(rotationAngle) !== undefined &&
					videoConnection.isVideoOrientationSupported() === true

				if (!supported) {
					failure = 'unsupportedConfiguration'
				}
			}
		} catch {
			try {
				session.commitConfiguration()
			} catch {
				// A committed-partial configuration is already consistent.
			}

			return 'unavailable'
		}
		if (failure != null) {
			return failure
		}
		// Failed reconfiguration may retain either input. Hold both claims until
		// disposal rather than admitting an overlapping session.
		for (const old of claimedCameraIds) {
			if (old !== deviceId) {
				releaseCamera(old, host)
			}
		}
		claimedCameraIds = new Set([deviceId])
		configuredCameraId = deviceId
		applyOrientation(videoConnection)
		applyOrientation(previewLayer?.connection)
		return null
	}

	const host = {
		attachPreview(view: object): string | null {
			const current = ensureSession()
			if (!current) {
				return 'permissionDenied'
			}
			previewView = new WeakRef(view as any)
			previewLayer = typed(
				AVCaptureVideoPreviewLayer.layerWithSession(current),
				AVCaptureVideoPreviewLayer,
			)
			previewLayer.videoGravity = 'AVLayerVideoGravityResizeAspectFill'
			;(view as any).wantsLayer = true
			previewLayer.frame = {
				origin: { x: 0, y: 0 },
				size: (view as any).bounds?.size ?? { width: 0, height: 0 },
			}
			previewLayer.autoresizingMask = (1 << 4) | (1 << 2)
			;(view as any).layer?.addSublayer(previewLayer)
			applyOrientation(previewLayer.connection)
			enqueueOp('start', () =>
				detached('start', () => {
					if (!disposed && !session.isRunning()) {
						session.performSelectorInBackgroundWithObject('startRunning', null)
					} else {
						releaseOp()
					}
				}),
			)
			return null
		},
		detachPreview(): void {
			previewLayer?.removeFromSuperlayer()
			previewLayer = undefined
			previewView = null
			enqueueOp('stop', () =>
				detached('stop', () => {
					session?.performSelectorInBackgroundWithObject('stopRunning', null)
				}),
			)
		},
		installObserver(listener: (message: string) => void): void {
			emit = listener
		},
		permissionStatus(kind: string): string {
			const mediaType = mediaKind(kind)
			return declared(mediaType) ? statusFor(mediaType) : 'undeclared'
		},
		requestPermissionReply(kind: string, reply: (status: string) => void): void {
			const mediaType = mediaKind(kind)
			if (!declared(mediaType)) {
				reply('undeclared')
				return
			}
			const current = statusFor(mediaType)
			if (current !== 'notDetermined') {
				reply(current)
				return
			}
			AVCaptureDevice.requestAccessForMediaTypeCompletionHandler(mediaType, () => {
				NSOperationQueue.mainQueue.addOperationWithBlock(() => reply(statusFor(mediaType)))
			})
		},
		devices(): string {
			try {
				return JSON.stringify(
					cameraDevices().map((device) => ({
						id: String(device.uniqueID),
						name: String(device.localizedName),
						facing: null,
						focusPointOfInterest: device.isFocusPointOfInterestSupported?.() === true,
						exposurePointOfInterest: device.isExposurePointOfInterestSupported?.() === true,
					})),
				)
			} catch {
				return '[]'
			}
		},
		audioDeviceAvailable(): boolean {
			return (AVCaptureDevice.devicesWithMediaType(AVMediaTypeAudio)?.count ?? 0) > 0
		},
		audioInputAttached(): boolean {
			return audioInput != null
		},
		activeDeviceId(): string | null {
			return videoInput != null ? String(videoInput.device.uniqueID) : null
		},
		configure(options: {
			cameraId?: string
			photo?: boolean
			audio?: boolean
			rotationAngle?: number
		}): string | null {
			return configure(options)
		},
		/** Meters one autofocus/auto-exposure pass at a normalized preview point
		 *  (0-1, top-left origin as the user sees it). */
		focusAtPoint(point: { x: number; y: number }): boolean {
			if (disposed || previewLayer == null) {
				return false
			}
			const bounds = previewLayer.bounds
			const layerPoint = {
				x: Math.min(Math.max(point.x, 0), 1) * bounds.size.width,
				y: Math.min(Math.max(point.y, 0), 1) * bounds.size.height,
			}
			const view = previewView?.deref()
			if (view != null && view.isFlipped?.() === false) {
				layerPoint.y = bounds.size.height - layerPoint.y
			}
			const devicePoint = previewLayer.captureDevicePointOfInterestForPoint(layerPoint)
			const device = videoInput?.device
			if (device == null) {
				return false
			}
			const focus =
				device.isFocusPointOfInterestSupported?.() === true &&
				device.isFocusModeSupported?.(1) === true
			const expose =
				device.isExposurePointOfInterestSupported?.() === true &&
				device.isExposureModeSupported?.(1) === true
			if (!focus && !expose) {
				return false
			}
			try {
				if (!device.lockForConfiguration(null)) {
					return false
				}

				if (focus) {
					device.focusPointOfInterest = devicePoint
					device.focusMode = 1 // autoFocus
				}

				if (expose) {
					device.exposurePointOfInterest = devicePoint
					device.exposureMode = 1 // autoExpose
				}

				device.unlockForConfiguration()
				return true
			} catch {
				return false
			}
		},
		supportsRotationAngles(): boolean {
			return (
				typeof AVCaptureConnection.instancesRespondToSelector === 'function' &&
				AVCaptureConnection.instancesRespondToSelector('isVideoOrientationSupported') === true
			)
		},
		movieDirectory(): string | null {
			const urls = NSFileManager.defaultManager.URLsForDirectoryInDomains(14, 1)
			const base = urls?.count > 0 ? urls.objectAtIndex(0) : null
			if (base == null) {
				return null
			}
			const identifier = NSBundle.mainBundle.bundleIdentifier
			const bundleId = identifier == null ? 'org.octane.xplat' : String(identifier)
			const directory = base
				.URLByAppendingPathComponent(bundleId)
				.URLByAppendingPathComponent('octane-camera')
			const manager = NSFileManager.defaultManager
			if (
				!manager.createDirectoryAtURLWithIntermediateDirectoriesAttributesError(
					directory,
					true,
					null,
					null,
				)
			) {
				return null
			}
			return String(directory.absoluteString)
		},
		startRecording(path: string, maximumDurationMs: number): string | null {
			// Recording without active connections raises an ObjC exception —
			// fatal to the host. The session must be running.
			if (session == null || movieOutput == null || session.isRunning() !== true) {
				return 'unavailable'
			}
			const url = NSURL.fileURLWithPath(path)
			recordingPath = path
			movieOutput.maxRecordedDuration =
				maximumDurationMs > 0
					? CMTimeMakeWithSeconds(maximumDurationMs / 1000, 1000)
					: ({ seconds: 0, timescale: 0, flags: 0, epoch: 0 } as any)
			recordingDelegate = recordingDelegateClass().new()
			recordingDelegate.onFinish = (_output: any, fileUrl: any, failure: any) => {
				const succeeded =
					failure == null ||
					failure.userInfo?.objectForKey?.(AVErrorRecordingSuccessfullyFinishedKey) === true
				const limitReached = failure != null && failure.code === avErrorMaximumDurationReached
				const payload: Record<string, unknown> = {
					type: 'recordingFinished',
					fileUrl: String(fileUrl.absoluteString),
					succeeded,
					limitReached,
				}
				const filePath = String(fileUrl.path)
				if (succeeded && NSFileManager.defaultManager.fileExistsAtPath(filePath)) {
					payload.clip = movieClipInfo(fileUrl)
				} else {
					try {
						NSFileManager.defaultManager.removeItemAtURLError(fileUrl, null)
					} catch {
						// Reclaim only the file this attempt created.
					}

					payload.error = {
						domain: failure != null ? String(failure.domain) : 'XplatCamera',
						code: failure != null ? Number(failure.code) : -1,
						message:
							failure != null
								? String(failure.localizedDescription)
								: 'Movie recording did not complete',
					}
				}
				send(payload)
			}
			movieOutput.startRecordingToOutputFileURLRecordingDelegate(url, recordingDelegate)
			// didStart cannot reach a JS delegate (host crash — see
			// recordingDelegateClass). Poll isRecording to emit the same event.
			if (startPollTimer !== undefined) {
				clearInterval(startPollTimer)
			}
			let polls = 0
			startPollTimer = setInterval(() => {
				polls += 1
				if (disposed || movieOutput == null || polls > 100) {
					clearInterval(startPollTimer!)
					startPollTimer = undefined
					return
				}
				if (movieOutput.isRecording()) {
					clearInterval(startPollTimer!)
					startPollTimer = undefined
					send({
						type: 'recordingStarted',
						fileUrl: String(url.absoluteString),
						audio: audioInput != null,
					})
				}
			}, 50)
			return null
		},
		stopRecording(): void {
			movieOutput?.stopRecording()
		},
		recording(): boolean {
			return movieOutput?.isRecording() === true
		},
		recordedMs(): number {
			const duration = movieOutput?.recordedDuration
			if (duration == null) {
				return 0
			}
			const seconds = CMTimeGetSeconds(duration)
			return Number.isFinite(seconds) ? seconds * 1000 : 0
		},
		previewSize(): string {
			const device = videoInput?.device
			if (device == null) {
				return '{}'
			}
			const format = typed(device.activeFormat, g.AVCaptureDeviceFormat)
			if (format == null) {
				return '{}'
			}
			const dimensions = CMVideoFormatDescriptionGetDimensions(format.formatDescription)
			return `{"width":${dimensions.width},"height":${dimensions.height}}`
		},
		capturePhoto(reply: (data: any) => void): string | null {
			if (disposed || photoReply != null || photoOutput == null || session?.isRunning() !== true) {
				return 'unavailable'
			}
			const codecs = photoOutput.availablePhotoCodecTypes
			if (codecs == null || !codecs.containsObject(AVVideoCodecTypeJPEG)) {
				return 'unavailable'
			}
			const delegate = photoDelegateClass().new()
			photoDelegate = delegate
			delegate.onPhoto = (photo: any, error: any) => {
				const callback = photoReply
				photoReply = undefined
				photoDelegate = undefined
				callback?.(
					error == null && photo != null
						? typed(photo, AVCapturePhoto).fileDataRepresentation()
						: null,
				)
			}
			photoReply = reply
			const format = NSMutableDictionary.dictionary()
			format.setObjectForKey(AVVideoCodecTypeJPEG, AVVideoCodecKey)
			const settings = AVCapturePhotoSettings.photoSettingsWithFormat(format)
			photoOutput.capturePhotoWithSettingsDelegate(settings, delegate)
			return null
		},
		dispose(): void {
			if (disposed) {
				return
			}
			disposed = true
			const center = NSNotificationCenter.defaultCenter
			for (const observer of observers) {
				center.removeObserver(observer)
			}
			observers = []
			previewLayer?.removeFromSuperlayer()
			previewLayer = undefined
			previewView = null
			photoReply = undefined
			photoDelegate = undefined
			if (startPollTimer !== undefined) {
				clearInterval(startPollTimer)
				startPollTimer = undefined
			}
			const ending = session
			const claims = [...claimedCameraIds]
			enqueueOp('stop', () =>
				detached('stop', () => {
					ending?.performSelectorInBackgroundWithObject('stopRunning', null)
					// Keep the claims until the session stop is dispatched: releasing
					// sooner could admit another host while AVFoundation still holds
					// the hardware.
					for (const id of claims) {
						releaseCamera(id, host)
					}
					releaseOp()
				}),
			)
			claimedCameraIds = new Set()
			session = undefined
			videoInput = undefined
			audioInput = undefined
			movieOutput = undefined
			photoOutput = undefined
			recordingDelegate = undefined
			emit = undefined
		},
	}
	return host
}
