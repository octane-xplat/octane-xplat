import { path as fileSystemPath } from '@nativescript/core'
import type {
	AudioRecorder,
	RecorderOptions,
	RecorderPermissionState,
	RecorderSnapshot,
	RecorderState,
	RecordingResult,
} from './types'

// NSData -> ArrayBuffer bridge provided by the NativeScript iOS runtime.
declare const interop: { bufferFromData(data: NSData): ArrayBuffer }

// NativeScript's ambient const enums cannot be read with verbatimModuleSyntax,
// and CoreAudioTypes' `kAudioFormatLinearPCM` const sits outside the default
// ambient set — keep the 'lpcm' FourCC literal here.
const audioFormatLinearPCM = 1819304813 // kAudioFormatLinearPCM
const permissionGranted = 1735552628 // AVAudioSessionRecordPermission.Granted
const permissionDenied = 1684369017 // AVAudioSessionRecordPermission.Denied
const interruptionBegan = 1 // AVAudioSessionInterruptionType.Began
const notifyOthersOnDeactivation = 1 // AVAudioSessionSetActiveOptions.NotifyOthersOnDeactivation
// AVAudioSessionCategoryOptions: MixWithOthers | DuckOthers — the app can keep
// playing while the recorder owns the mic, and other audio ducks under dictation.
const playAndRecordMixDuck = 3 as AVAudioSessionCategoryOptions

const readPermission = (session: AVAudioSession): RecorderPermissionState => {
	if ((session as any).inputAvailable === false) {
		return 'unavailable'
	}

	const status = session.recordPermission as unknown as number
	return status === permissionGranted
		? 'granted'
		: status === permissionDenied
			? 'denied'
			: 'undetermined'
}

export async function requestMicrophonePermission(): Promise<RecorderPermissionState> {
	const session = AVAudioSession.sharedInstance()
	const status = readPermission(session)
	if (status !== 'undetermined') {
		return status
	}

	return await new Promise<RecorderPermissionState>((resolve) => {
		session.requestRecordPermission((granted) => resolve(granted ? 'granted' : 'denied'))
	})
}

export const createAudioRecorder = (): AudioRecorder => {
	const session = AVAudioSession.sharedInstance()
	const listeners = new Set<(snapshot: RecorderSnapshot) => void>()
	let recorder: AVAudioRecorder | undefined
	let state: RecorderState = 'idle'
	let permission: RecorderPermissionState = readPermission(session)
	let error: Error | undefined
	let options: Required<RecorderOptions> = { sampleRate: 44100, channels: 1 }
	let filePath: string | undefined
	let meterLevel: number | null = null
	let timer: ReturnType<typeof setInterval> | undefined
	let opening = false
	let disposed = false
	let interruptionObserver: NSObjectProtocol | undefined
	let resetObserver: NSObjectProtocol | undefined

	// AVAudioRecorderDelegate is a protocol — extend NSObject with the
	// optional callbacks so encode/write failures surface as 'error'
	// instead of a silently truncated take.
	const Delegate = (NSObject as any).extend(
		{
			audioRecorderDidFinishRecordingSuccessfully(_recorder: unknown, success: boolean) {
				if (!success) {
					fail(new Error('AVAudioRecorder reported a write failure'))
				}
			},
			audioRecorderEncodeErrorDidOccurError(_recorder: unknown, cause: NSError) {
				fail(new Error(cause?.localizedDescription ?? 'AVAudioRecorder encode error'))
			},
		},
		{ protocols: [AVAudioRecorderDelegate] },
	)

	const snapshot = (): RecorderSnapshot => ({
		state,
		permission,
		durationSeconds: recorder && state !== 'idle' ? recorder.currentTime : 0,
		meterLevel,
		error,
	})

	const emit = () => {
		const value = snapshot()
		for (const listener of listeners) {
			listener(value)
		}
	}

	const deactivateSession = () => {
		try {
			// The Objective-C error-out argument is intentionally null at
			// runtime; the generated type only permits Reference<NSError> |
			// undefined.
			const noErrorOut = null as unknown as Parameters<typeof session.setActiveWithOptionsError>[2]

			session.setActiveWithOptionsError(false, notifyOthersOnDeactivation, noErrorOut)
		} catch {
			// Deactivation failure leaves the session active for the OS to
			// reclaim — record nothing; the take result is already decided.
		}
	}

	const closeTake = () => {
		recorder?.stop()
		recorder = undefined
		meterLevel = null
		deactivateSession()
	}

	const fail = (cause: Error) => {
		error = cause
		closeTake()
		state = 'error'
		emit()
	}

	const removeTake = () => {
		if (!filePath) {
			return
		}

		try {
			if (!recorder?.deleteRecording()) {
				NSFileManager.defaultManager.removeItemAtPathError(filePath, undefined)
			}
		} catch {
			// Temporary-directory leftovers are reclaimed by the OS.
		}

		filePath = undefined
	}

	const start = async (next?: RecorderOptions) => {
		if (disposed) {
			throw new Error('AudioRecorder is disposed')
		}

		if (state !== 'idle' || opening) {
			throw new Error(`AudioRecorder cannot start while ${opening ? 'starting' : state}`)
		}

		opening = true
		try {
			permission = await requestMicrophonePermission()
			emit()
			if (permission !== 'granted') {
				error = new Error(`Microphone permission is ${permission}`)
				emit()
				throw error
			}
		} finally {
			opening = false
		}

		options = {
			sampleRate: next?.sampleRate ?? options.sampleRate,
			channels: next?.channels ?? options.channels,
		}

		error = undefined
		filePath = fileSystemPath.join(NSTemporaryDirectory(), `octane-recorder-${Date.now()}.wav`)

		const settings = NSMutableDictionary.dictionary()
		settings.setObjectForKey(audioFormatLinearPCM, AVFormatIDKey)
		settings.setObjectForKey(options.sampleRate, AVSampleRateKey)
		settings.setObjectForKey(options.channels, AVNumberOfChannelsKey)
		settings.setObjectForKey(16, AVLinearPCMBitDepthKey)
		settings.setObjectForKey(false, AVLinearPCMIsBigEndianKey)
		settings.setObjectForKey(false, AVLinearPCMIsFloatKey)
		try {
			session.setCategoryModeOptionsError(
				AVAudioSessionCategoryPlayAndRecord,
				AVAudioSessionModeDefault,
				playAndRecordMixDuck,
				undefined,
			)

			session.setActiveWithOptionsError(true, 0 as AVAudioSessionSetActiveOptions, undefined)
			const url = NSURL.fileURLWithPath(filePath)
			recorder = AVAudioRecorder.alloc().initWithURLSettingsError(url, settings, undefined)
			if (!recorder) {
				throw new Error('AVAudioRecorder could not open a recording file')
			}

			recorder.delegate = Delegate.new()
			recorder.meteringEnabled = true
			if (!recorder.record()) {
				throw new Error('AVAudioRecorder refused to start recording')
			}
		} catch (cause) {
			closeTake()
			error = cause instanceof Error ? cause : new Error(String(cause))
			state = 'error'
			emit()
			throw error
		}

		state = 'recording'
		emit()
	}

	const pause = async () => {
		if (state !== 'recording') {
			throw new Error(`AudioRecorder cannot pause while ${state}`)
		}

		recorder?.pause()
		state = 'paused'
		emit()
	}

	const resume = async () => {
		if (state !== 'paused') {
			throw new Error(`AudioRecorder cannot resume while ${state}`)
		}

		try {
			session.setActiveWithOptionsError(true, 0 as AVAudioSessionSetActiveOptions, undefined)
			if (!recorder?.record()) {
				throw new Error('AVAudioRecorder refused to resume recording')
			}
		} catch (cause) {
			fail(cause instanceof Error ? cause : new Error(String(cause)))
			throw error
		}

		state = 'recording'
		emit()
	}

	const restart = async (next?: RecorderOptions) => {
		if (state !== 'idle') {
			await cancel()
		}

		await start(next)
	}

	const stop = async (): Promise<RecordingResult> => {
		if (!recorder || !filePath) {
			throw new Error('AudioRecorder has no take to stop')
		}

		const taken = recorder
		const takenPath = filePath
		const durationSeconds = taken.currentTime
		taken.stop()
		deactivateSession()
		const result: RecordingResult = {
			mimeType: 'audio/wav',
			bytes: readTake(takenPath),
			durationSeconds,
			sampleRate: options.sampleRate,
			channels: options.channels,
			path: takenPath,
		}

		recorder = undefined
		filePath = undefined
		meterLevel = null
		state = 'idle'
		emit()
		return result
	}

	const cancel = async () => {
		if (state === 'idle' && !recorder) {
			return
		}

		closeTake()
		removeTake()
		state = 'idle'
		error = undefined
		emit()
	}

	interruptionObserver = NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
		AVAudioSessionInterruptionNotification,
		null,
		NSOperationQueue.mainQueue,
		(notification) => {
			const type = notification.userInfo?.objectForKey(
				AVAudioSessionInterruptionTypeKey,
			)?.unsignedIntegerValue

			if (type === interruptionBegan) {
				if (state === 'recording' || state === 'paused') {
					recorder?.pause()
					state = 'interrupted'
					emit()
				}
			} else if (state === 'interrupted') {
				// The interruption cleared; the app decides whether the take
				// continues — resume(), stop(), or cancel().
				state = 'paused'
				emit()
			}
		},
	)

	resetObserver = NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
		AVAudioSessionMediaServicesWereResetNotification,
		null,
		NSOperationQueue.mainQueue,
		() => {
			if (state !== 'idle') {
				fail(new Error('Audio media services were reset'))
			}
		},
	)

	return {
		capabilities: () => ({
			supported: true,
			pause: true,
			metering: true,
			userGestureRequired: false,
		}),
		snapshot,
		subscribe: (listener) => {
			listeners.add(listener)
			listener(snapshot())
			timer ??= setInterval(() => {
				if (recorder && state === 'recording') {
					recorder.updateMeters()
					const power = recorder.averagePowerForChannel(0)
					meterLevel = Math.max(0, Math.min(1, (power + 60) / 60))
				} else {
					meterLevel = null
				}

				emit()
			}, 250)

			return () => {
				listeners.delete(listener)
				if (!listeners.size && timer) {
					clearInterval(timer)
					timer = undefined
				}
			}
		},
		requestPermission: async () => {
			permission = await requestMicrophonePermission()
			emit()
			return permission
		},
		start,
		pause,
		resume,
		restart,
		stop,
		cancel,
		dispose: () => {
			if (disposed) {
				return
			}

			disposed = true
			closeTake()
			removeTake()
			if (interruptionObserver) {
				NSNotificationCenter.defaultCenter.removeObserver(interruptionObserver)
			}

			if (resetObserver) {
				NSNotificationCenter.defaultCenter.removeObserver(resetObserver)
			}

			interruptionObserver = undefined
			resetObserver = undefined
			if (timer) {
				clearInterval(timer)
			}

			timer = undefined
			listeners.clear()
			state = 'idle'
		},
	}
}

const readTake = (filePath: string): Uint8Array => {
	const data = NSData.dataWithContentsOfFile(filePath)
	if (!data) {
		throw new Error(`Recording file is missing at ${filePath}`)
	}

	return new Uint8Array(interop.bufferFromData(data))
}
