import type { RecorderHost } from './recorder-core.macos'

// The macOS backend talks to AVFAudio/AVFoundation/AppKit through the
// node-api ObjC bridge: class and protocol objects materialize as globals
// once their framework loads (objc.import). Declare the surface this leaf
// calls so the file stays importable in ambient-free processes — a missing
// bridge must degrade to an unsupported recorder, not an import error.
declare const objc: { import(framework: string): void }
declare const interop: {
	handleof(value: unknown): { toNumber(): number }
	types: { void: number; bool: number; id: number }
}

interface NativeObject {
	isKindOfClass(type: unknown): boolean
	isEqual(object: unknown): boolean
	respondsToSelector(selector: string): boolean
}

interface NativeURL {
	readonly path: string
	URLByAppendingPathComponent(component: string): NativeURL
	URLByAppendingPathComponentIsDirectory(component: string, isDirectory: boolean): NativeURL
}

interface NativeData {
	readonly length: number
	base64EncodedStringWithOptions(options: number): string
}

interface NativeDevice extends NativeObject {
	hasMediaType?(mediaType: string): boolean
}

interface NativeArray {
	readonly count: number
	objectAtIndex(index: number): NativeObject
	containsObject(object: unknown): boolean
}

interface NativeRecorder extends NativeObject {
	delegate: unknown
	meteringEnabled: boolean
	readonly currentTime: number
	initWithURLSettingsError?(url: NativeURL, settings: unknown, outError: unknown): unknown
	prepareToRecord(): boolean
	record(): boolean
	pause(): void
	stop(): void
	isRecording(): boolean
	updateMeters(): void
	averagePowerForChannel(channel: number): number
}

declare const AVAudioRecorder: {
	alloc(): {
		initWithURLSettingsError(url: NativeURL, settings: unknown, outError: unknown): NativeRecorder
	}
}

declare const AVAudioRecorderDelegate: unknown
declare const AVCaptureDevice: {
	defaultDeviceWithMediaType(mediaType: string): NativeDevice | null
	devicesWithMediaType(mediaType: string): NativeArray
	authorizationStatusForMediaType(mediaType: string): number
	requestAccessForMediaTypeCompletionHandler(
		mediaType: string,
		handler: (granted: boolean) => void,
	): void
}

declare const NSApplication: {
	readonly sharedApplication: { isActive(): boolean }
}

declare const NSBundle: {
	readonly mainBundle: { objectForInfoDictionaryKey(key: string): unknown }
}

declare const NSData: {
	dataWithContentsOfFile(path: string): NativeData | null
}

declare const NSFileManager: {
	readonly defaultManager: {
		readonly temporaryDirectory: NativeURL
		createDirectoryAtURLWithIntermediateDirectoriesAttributesError(
			url: NativeURL,
			withIntermediateDirectories: boolean,
			attributes: unknown,
			outError: unknown,
		): boolean
		removeItemAtURLError(url: NativeURL, outError: unknown): boolean
	}
}

declare const NSMutableDictionary: {
	dictionary(): { setObjectForKey(value: unknown, key: string): void }
}

declare const NSNotificationCenter: {
	readonly defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(
			name: string,
			object: unknown,
			queue: unknown,
			block: (notification: { object: unknown }) => void,
		): unknown
		removeObserver(observer: unknown): void
	}
}

declare const NSObject: {
	extend(members: unknown, options: unknown): { new: () => unknown }
}

declare const NSOperationQueue: { readonly mainQueue: unknown }
declare const NSUUID: { UUID(): { UUIDString: string } }

declare const AVMediaTypeAudio: string
declare const AVFormatIDKey: string
declare const AVSampleRateKey: string
declare const AVNumberOfChannelsKey: string
declare const AVLinearPCMBitDepthKey: string
declare const AVLinearPCMIsBigEndianKey: string
declare const AVLinearPCMIsFloatKey: string
declare const AVLinearPCMIsNonInterleaved: string
declare const AVCaptureDeviceWasDisconnectedNotification: string
declare const AVCaptureDeviceWasConnectedNotification: string
declare const NSApplicationDidResignActiveNotification: string
declare const NSApplicationDidBecomeActiveNotification: string

// `kAudioFormatLinearPCM` ('lpcm') sits outside the bridged ambient set —
// keep the FourCC literal here, same as the iOS leaf.
const audioFormatLinearPCM = 1819304813

// AVAuthorizationStatus — bridged as a plain integer.
const authNotDetermined = 0
const authRestricted = 1
const authDenied = 2
const authAuthorized = 3

let DelegateClass: { new: () => unknown } | undefined

// The bridge's member lookup resolves to the first metadata-registered class
// on the real isa chain. AVCaptureDevice's concrete subclasses are private
// (class cluster), so device-specific members like hasMediaType: never
// materialize on the wrapper — NSObject members still do. An audio-device
// list snapshot + containsObject matches `device.hasMediaType(.audio)`
// without touching those members.
let audioDevices: NativeArray | undefined
const refreshAudioDevices = () => {
	audioDevices = AVCaptureDevice.devicesWithMediaType(AVMediaTypeAudio)
}

const isAudioDevice = (object: unknown): boolean =>
	object != null &&
	(object as NativeObject).isKindOfClass?.(AVCaptureDevice) === true &&
	audioDevices?.containsObject(object) === true

// One Delegate class serves every host instance; the bridge can deliver a
// different JS wrapper for the same delegate on callback, so handlers are
// keyed by the receiver's native pointer, not by wrapper identity.
const handlers = new Map<number, { finish(flag: boolean): void; error(cause: unknown): void }>()

const delegateClass = () => {
	DelegateClass ??= NSObject.extend(
		{
			audioRecorderDidFinishRecordingSuccessfully(_recorder: unknown, flag: boolean) {
				handlers.get(interop.handleof(this).toNumber())?.finish(flag)
			},
			audioRecorderEncodeErrorDidOccurError(_recorder: unknown, cause: unknown) {
				handlers.get(interop.handleof(this).toNumber())?.error(cause)
			},
		},
		{
			protocols: [AVAudioRecorderDelegate],
			exposedMethods: {
				'audioRecorderDidFinishRecording:successfully:': {
					params: [interop.types.id, interop.types.bool],
					returns: interop.types.void,
				},
				'audioRecorderEncodeErrorDidOccur:error:': {
					params: [interop.types.id, interop.types.id],
					returns: interop.types.void,
				},
			},
		},
	)

	return DelegateClass
}

// Globals materialize only on a real bridge; check the runtime first, then
// load the frameworks this leaf calls so their classes register.
// The macOS bridge globals have no ambient declaration; this named shape is
// the bounded contract this leaf depends on.
interface BridgeGlobals {
	objc?: { import: (name: string) => void }
	interop?: object
	NSObject?: object
}

const bridgeReady = (): boolean => {
	const globals = globalThis as BridgeGlobals
	if (
		typeof globals.objc !== 'object' ||
		typeof globals.interop !== 'object' ||
		typeof globals.NSObject !== 'function'
	) {
		return false
	}
	objc.import('AVFAudio')
	objc.import('AVFoundation')
	objc.import('AppKit')
	// Bridged classes arrive as non-function globals on the node-api host.
	return (
		typeof AVAudioRecorder !== 'undefined' &&
		typeof AVCaptureDevice !== 'undefined' &&
		typeof AVAudioRecorderDelegate !== 'undefined'
	)
}

/** One foreground-only PCM take. JS owns admission and promise settlement;
 *  this leaf owns microphone lifetime, temporary files and finalization. */
export function createNativeRecorderHost(): RecorderHost | undefined {
	if (!bridgeReady()) {
		return undefined
	}

	refreshAudioDevices()
	let recorder: NativeRecorder | undefined
	let takeURL: NativeURL | undefined
	let takeDirectory: NativeURL | undefined
	let takeID = 0
	let emit: ((message: string) => void) | undefined
	let disposed = false
	let finalizing = false
	let capturing = false
	let interrupted = false
	let finalizeTimer: ReturnType<typeof setTimeout> | undefined
	let delegate: unknown
	let delegateKey: number | undefined

	const send = (fields: Record<string, unknown>) => {
		emit?.(JSON.stringify({ ...fields, id: takeID }))
	}

	const releaseDelegate = () => {
		if (delegateKey !== undefined) {
			handlers.delete(delegateKey)
			delegateKey = undefined
		}
		delegate = undefined
	}

	const permissionStatus = (): string => {
		if (disposed) {
			return 'unsupported'
		}
		const usage = NSBundle.mainBundle.objectForInfoDictionaryKey('NSMicrophoneUsageDescription')
		if (usage == null || String(usage).trim() === '') {
			return 'undeclared'
		}
		const status = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeAudio)
		if (status === authDenied) {
			return 'denied'
		}
		if (status === authRestricted) {
			return 'restricted'
		}
		const input = AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeAudio)
		if (status === authNotDetermined) {
			return input == null ? 'unavailable' : 'undetermined'
		}
		if (status === authAuthorized) {
			return input == null ? 'unavailable' : 'granted'
		}
		return 'unsupported'
	}

	const pause = () => {
		recorder?.pause()
		capturing = false
	}

	const interrupt = () => {
		if (recorder === undefined || finalizing || interrupted) {
			return
		}
		pause()
		interrupted = true
		send({ type: 'interrupted' })
	}

	const clearInterruption = () => {
		if (
			!interrupted ||
			finalizing ||
			!NSApplication.sharedApplication.isActive() ||
			permissionStatus() !== 'granted'
		) {
			return
		}
		interrupted = false
		send({ type: 'interruptionEnded' }) // App explicitly chooses resume.
	}

	const cancel = () => {
		const value = recorder
		recorder = undefined
		if (value) {
			value.delegate = null
			value.stop()
		}
		capturing = false
		finalizing = false
		interrupted = false
		if (finalizeTimer !== undefined) {
			clearTimeout(finalizeTimer)
			finalizeTimer = undefined
		}
		releaseDelegate()
		const manager = NSFileManager.defaultManager
		for (const url of [takeURL, takeDirectory]) {
			if (url) {
				try {
					manager.removeItemAtURLError(url, null)
				} catch {
					// Temporary-directory leftovers are reclaimed by the OS.
				}
			}
		}
		takeURL = undefined
		takeDirectory = undefined
	}

	const center = NSNotificationCenter.defaultCenter
	const observers = [
		center.addObserverForNameObjectQueueUsingBlock(
			NSApplicationDidResignActiveNotification,
			null,
			NSOperationQueue.mainQueue,
			() => interrupt(),
		),
		center.addObserverForNameObjectQueueUsingBlock(
			NSApplicationDidBecomeActiveNotification,
			null,
			NSOperationQueue.mainQueue,
			() => clearInterruption(),
		),
		center.addObserverForNameObjectQueueUsingBlock(
			AVCaptureDeviceWasDisconnectedNotification,
			null,
			NSOperationQueue.mainQueue,
			(event) => {
				// The snapshot predates disconnect delivery: a device that was an
				// audio input when it vanished still matches, like hasMediaType.
				if (isAudioDevice(event.object)) {
					interrupt()
				}
				refreshAudioDevices()
			},
		),
		center.addObserverForNameObjectQueueUsingBlock(
			AVCaptureDeviceWasConnectedNotification,
			null,
			NSOperationQueue.mainQueue,
			() => {
				refreshAudioDevices()
				clearInterruption()
			},
		),
	]

	const sameRecorder = (value: NativeRecorder): boolean => {
		const current = recorder
		return (
			current !== undefined &&
			(current === value || (current as NativeObject).isEqual?.(value) === true)
		)
	}

	const onFinish = (value: NativeRecorder, flag: boolean) => {
		if (takeURL === undefined || disposed || !sameRecorder(value)) {
			return
		}
		recorder = undefined // Release the microphone before resolving stop.
		capturing = false
		if (!finalizing || !flag) {
			send({ type: 'error', message: 'AVAudioRecorder ended without a successful stop' })
			cancel()
			return
		}
		const data = NSData.dataWithContentsOfFile(String(takeURL.path))
		if (!data) {
			send({ type: 'error', message: 'Recording file is missing after finalization' })
			cancel()
			return
		}
		if (finalizeTimer !== undefined) {
			clearTimeout(finalizeTimer)
			finalizeTimer = undefined
		}
		send({
			type: 'finished',
			base64: data.base64EncodedStringWithOptions(0),
			path: String(takeURL.path),
		})
		// Validation happens synchronously in JS; on failure it calls cancel
		// while this operation still owns the file. Successful takes transfer.
		takeURL = undefined
		takeDirectory = undefined
		finalizing = false
		interrupted = false
		releaseDelegate()
	}

	const onError = (value: NativeRecorder, cause: unknown) => {
		if (disposed || !sameRecorder(value)) {
			return
		}
		const description =
			typeof cause === 'object' && cause !== null && 'localizedDescription' in cause
				? cause.localizedDescription
				: undefined
		send({
			type: 'error',
			message: description == null ? 'AVAudioRecorder encode error' : String(description),
		})
		cancel()
	}

	return {
		permissionStatus,
		requestPermission(reply) {
			const current = permissionStatus()
			if (current !== 'undetermined') {
				reply(current)
				return
			}
			AVCaptureDevice.requestAccessForMediaTypeCompletionHandler(AVMediaTypeAudio, () => {
				reply(disposed ? 'unsupported' : permissionStatus())
			})
		},
		installObserver(listener) {
			emit = listener
		},
		startTake(serialized) {
			if (disposed || recorder !== undefined || takeURL !== undefined) {
				return 'AudioRecorder is busy or disposed'
			}
			if (permissionStatus() !== 'granted') {
				return 'Microphone authorization or input is unavailable'
			}
			if (!NSApplication.sharedApplication.isActive()) {
				return 'Microphone capture requires an active app'
			}
			let options: { id?: unknown; sampleRate?: unknown; channels?: unknown }
			try {
				options = JSON.parse(serialized) ?? {}
			} catch {
				return 'Invalid PCM recording options'
			}
			const { id, sampleRate: rate, channels } = options
			if (
				!Number.isInteger(id) ||
				!Number.isInteger(rate) ||
				(rate as number) < 1 ||
				(rate as number) > 192000 ||
				(channels !== 1 && channels !== 2)
			) {
				return 'Invalid PCM recording options'
			}
			takeID = id as number
			// A fresh private directory avoids collisions and limits cancellation
			// to this operation; completed results remain owned by the app.
			const manager = NSFileManager.defaultManager
			const directory = manager.temporaryDirectory.URLByAppendingPathComponentIsDirectory(
				`octane-recorder-${NSUUID.UUID().UUIDString}`,
				true,
			)
			const url = directory.URLByAppendingPathComponent('take.wav')
			try {
				if (
					!manager.createDirectoryAtURLWithIntermediateDirectoriesAttributesError(
						directory,
						false,
						null,
						null,
					)
				) {
					throw new Error('AVAudioRecorder could not create the take directory')
				}

				takeURL = url
				takeDirectory = directory
				const settings = NSMutableDictionary.dictionary()
				settings.setObjectForKey(audioFormatLinearPCM, AVFormatIDKey)
				settings.setObjectForKey(rate, AVSampleRateKey)
				settings.setObjectForKey(channels, AVNumberOfChannelsKey)
				settings.setObjectForKey(16, AVLinearPCMBitDepthKey)
				settings.setObjectForKey(false, AVLinearPCMIsBigEndianKey)
				settings.setObjectForKey(false, AVLinearPCMIsFloatKey)
				settings.setObjectForKey(false, AVLinearPCMIsNonInterleaved)
				const value = AVAudioRecorder.alloc().initWithURLSettingsError(url, settings, null)
				if (!value) {
					throw new Error('AVAudioRecorder could not open a recording file')
				}

				recorder = value
				const nextDelegate = delegateClass().new()
				delegate = nextDelegate
				delegateKey = interop.handleof(nextDelegate).toNumber()
				handlers.set(delegateKey, {
					finish: (flag) => onFinish(value, flag),
					error: (cause) => onError(value, cause),
				})

				value.delegate = nextDelegate
				value.meteringEnabled = true
				if (!value.prepareToRecord() || !value.record()) {
					cancel()
					return 'AVAudioRecorder refused to start'
				}

				capturing = true
				interrupted = false
				return ''
			} catch (cause) {
				cancel()
				const description =
					typeof cause === 'object' && cause !== null && 'localizedDescription' in cause
						? cause.localizedDescription
						: undefined

				return description == null ? String(cause) : String(description)
			}
		},
		pause,
		resume() {
			if (disposed || finalizing || interrupted || !NSApplication.sharedApplication.isActive()) {
				return 'Microphone interruption has not cleared'
			}
			if (permissionStatus() !== 'granted') {
				return 'Microphone authorization or input is unavailable'
			}
			if (!recorder || !recorder.record()) {
				return 'AVAudioRecorder refused to resume'
			}
			capturing = true
			return ''
		},
		stop() {
			if (recorder === undefined || finalizing) {
				return
			}
			finalizing = true
			capturing = false
			const value = recorder
			value.stop() // The delegate completes only after the file closes.
			finalizeTimer = setTimeout(() => {
				if (recorder === value && finalizing) {
					send({ type: 'error', message: 'AVAudioRecorder did not finalize the take' })
					cancel()
				}
			}, 10_000)
		},
		cancel,
		status() {
			if (capturing && !(recorder && recorder.isRecording())) {
				interrupt()
			}
			recorder?.updateMeters()
			const power = recorder ? recorder.averagePowerForChannel(0) : -160
			return JSON.stringify({
				durationSeconds: recorder ? recorder.currentTime : 0,
				meterLevel: capturing ? Math.min(1, Math.max(0, (power + 60) / 60)) : null,
			})
		},
		dispose() {
			if (disposed) {
				return
			}
			disposed = true
			cancel()
			for (const observer of observers) {
				center.removeObserver(observer)
			}
			observers.length = 0
			emit = undefined
		},
	}
}
