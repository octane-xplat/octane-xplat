import { Application, ApplicationSettings, Utils } from '@nativescript/core'
import { decodeBase64, wavHeader } from './wav'
import type {
	AudioRecorder,
	RecorderOptions,
	RecorderPermissionState,
	RecorderSnapshot,
	RecorderState,
	RecordingResult,
} from './types'

const PERMISSION = 'android.permission.RECORD_AUDIO'
// Android cannot distinguish "never asked" from "denied permanently" without
// tracking it — the leaf remembers whether it has prompted on this install.
const ASKED_KEY = 'octane-xplat.recorder.asked'
let requestCode = 7921

// `Utils.android` is a {} stub in the pinned Windows core build.
const appContext = () => (Utils.android as any).getApplicationContext()

function microphonePresent(): boolean {
	try {
		return (
			appContext()?.getPackageManager?.().hasSystemFeature?.('android.hardware.microphone') !==
			false
		)
	} catch {
		return true
	}
}

export function microphonePermissionState(): RecorderPermissionState {
	if (!microphonePresent()) {
		return 'unavailable'
	}

	const context = appContext()
	if (!context?.checkSelfPermission) {
		return 'unsupported'
	}

	if (
		context.checkSelfPermission(PERMISSION) === android.content.pm.PackageManager.PERMISSION_GRANTED
	) {
		return 'granted'
	}

	return ApplicationSettings.getBoolean(ASKED_KEY, false) ? 'denied' : 'undetermined'
}

export async function requestMicrophonePermission(): Promise<RecorderPermissionState> {
	if (!microphonePresent()) {
		return 'unavailable'
	}

	const context = appContext()
	const activity = Application.android?.foregroundActivity ?? Application.android?.startActivity
	if (!context?.checkSelfPermission || !activity?.requestPermissions) {
		return 'unsupported'
	}

	if (
		context.checkSelfPermission(PERMISSION) === android.content.pm.PackageManager.PERMISSION_GRANTED
	) {
		return 'granted'
	}

	ApplicationSettings.setBoolean(ASKED_KEY, true)
	return await new Promise<RecorderPermissionState>((resolve) => {
		const code = requestCode++
		const onResult = (args: any) => {
			if (args.requestCode !== code) {
				return
			}

			Application.android.off(Application.android.activityRequestPermissionsEvent, onResult)
			resolve(
				args.grantResults?.[0] === android.content.pm.PackageManager.PERMISSION_GRANTED
					? 'granted'
					: 'denied',
			)
		}

		Application.android.on(Application.android.activityRequestPermissionsEvent, onResult)
		activity.requestPermissions([PERMISSION], code)
	})
}

const asError = (cause: unknown) => (cause instanceof Error ? cause : new Error(String(cause)))

/** Copy a Uint8Array into a Java byte[] for java.io writers. */
const toJavaBytes = (bytes: Uint8Array) => {
	const native = (Array as any).create('byte', bytes.length)
	for (let i = 0; i < bytes.length; i++) {
		native[i] = bytes[i]
	}

	return native
}

/** Patch the two RIFF size fields after streaming PCM — RandomAccessFile
 *  writes big-endian, so emit each little-endian byte directly. */
const patchWavSizes = (file: any, dataLength: number) => {
	const raf = new java.io.RandomAccessFile(file, 'rw')
	try {
		const sizes = new Uint8Array(8)
		const view = new DataView(sizes.buffer)
		view.setUint32(0, 36 + dataLength, true)
		view.setUint32(4, dataLength, true)
		raf.seek(4)
		raf.write(toJavaBytes(sizes.subarray(0, 4)))
		raf.seek(40)
		raf.write(toJavaBytes(sizes.subarray(4, 8)))
	} finally {
		raf.close()
	}
}

const readFileBytes = (path: string): Uint8Array => {
	// java.nio.file.Files is API 26+; the repo's floor is 24 — read the file
	// the way @nativescript/core's own FileSystemAccess does.
	const file = new java.io.File(path)
	const stream = new java.io.FileInputStream(file)
	try {
		const bytes = (Array as any).create('byte', file.length())
		new java.io.DataInputStream(stream).readFully(bytes)
		return decodeBase64(android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP))
	} finally {
		stream.close()
	}
}

export const createAudioRecorder = (): AudioRecorder => {
	const listeners = new Set<(snapshot: RecorderSnapshot) => void>()
	let record: android.media.AudioRecord | undefined
	let thread: java.lang.Thread | undefined
	let recordingCallback: android.media.AudioManager.AudioRecordingCallback | undefined
	let output: java.io.FileOutputStream | undefined
	let takePath: string | undefined
	let capturing = false
	let bytesWritten = 0
	let peak = 0
	let state: RecorderState = 'idle'
	let permission: RecorderPermissionState = microphonePermissionState()
	let error: Error | undefined
	let options: Required<RecorderOptions> = { sampleRate: 44100, channels: 1 }
	let timer: ReturnType<typeof setInterval> | undefined
	let opening = false
	let disposed = false

	const snapshot = (): RecorderSnapshot => ({
		state,
		permission,
		durationSeconds: bytesWritten / (options.sampleRate * options.channels * 2),
		meterLevel: state === 'recording' ? peak / 32768 : null,
		error,
	})

	const emit = () => {
		const value = snapshot()
		for (const listener of listeners) {
			listener(value)
		}
	}

	const updatePeak = (buffer: any, length: number) => {
		for (let i = 0; i + 1 < length; i += 2) {
			const sample = Math.abs((((buffer[i + 1] << 8) | (buffer[i] & 0xff)) << 16) >> 16)
			if (sample > peak) {
				peak = sample
			}
		}
	}

	const readLoop = (audioRecord: android.media.AudioRecord, out: any, chunkSize: number) => {
		const chunk = (Array as any).create('byte', chunkSize)
		while (capturing) {
			const read = audioRecord.read(chunk, 0, chunkSize)
			if (read > 0) {
				try {
					out.write(chunk, 0, read)
					bytesWritten += read
					updatePeak(chunk, read)
				} catch {
					// The writer is closing while a read finished — discard the tail.
				}
			} else if (read < 0) {
				fail(new Error(`AudioRecord read failed (${read})`))
				return
			}
		}
	}

	const suspendCapture = () => {
		capturing = false
		try {
			record?.stop()
		} catch {
			// Already stopped — e.g. the OS silenced the input mid-take.
		}

		try {
			// join() on our own read thread would just stall — the loop is
			// already exiting via `capturing = false`.
			if (thread && java.lang.Thread.currentThread() !== thread) {
				thread.join(500)
			}
		} catch {
			// A stuck read loop is abandoned with the AudioRecord on release.
		}

		thread = undefined
	}

	const resumeCapture = () => {
		const audioRecord = record
		const out = output
		if (!audioRecord || !out) {
			throw new Error('AudioRecorder has no open take')
		}

		audioRecord.startRecording()
		capturing = true
		const chunkSize = Math.max(4096, audioRecord.getBufferSizeInFrames() * options.channels * 2)

		thread = new java.lang.Thread(
			new (java.lang.Runnable as any)({ run: () => readLoop(audioRecord, out, chunkSize) }),
		)

		thread.start()
	}

	const fail = (cause: Error) => {
		error = cause
		suspendCapture()
		state = 'error'
		emit()
	}

	const closeTake = (discard: boolean) => {
		suspendCapture()
		try {
			output?.close()
		} catch {
			// Already closed.
		}

		output = undefined
		if (recordingCallback && record) {
			try {
				record.unregisterAudioRecordingCallback(recordingCallback)
			} catch {
				// Callback was already gone.
			}
		}

		recordingCallback = undefined
		try {
			record?.release()
		} catch {
			// Release is best-effort during failure paths.
		}

		record = undefined
		if (discard && takePath) {
			try {
				new java.io.File(takePath).delete()
			} catch {
				// Cache-directory leftovers are reclaimed by the OS.
			}
		}
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
		bytesWritten = 0
		peak = 0
		const context = appContext()
		if (!context) {
			throw new Error('AudioRecorder needs an Android application context')
		}

		const channelConfig =
			options.channels === 2
				? android.media.AudioFormat.CHANNEL_IN_STEREO
				: android.media.AudioFormat.CHANNEL_IN_MONO

		const encoding = android.media.AudioFormat.ENCODING_PCM_16BIT
		const minBuffer = android.media.AudioRecord.getMinBufferSize(
			options.sampleRate,
			channelConfig,
			encoding,
		)

		try {
			if (minBuffer <= 0) {
				throw new Error(
					`This device cannot capture ${options.sampleRate} Hz ${options.channels}-channel PCM`,
				)
			}

			record = new android.media.AudioRecord(
				android.media.MediaRecorder.AudioSource.MIC,
				options.sampleRate,
				channelConfig,
				encoding,
				Math.max(minBuffer, 4096),
			)

			if (record.getState() !== android.media.AudioRecord.STATE_INITIALIZED) {
				throw new Error('AudioRecord failed to initialize — no usable microphone input')
			}

			const file = java.io.File.createTempFile('octane-recorder-', '.wav', context.getCacheDir())

			takePath = file.getAbsolutePath()
			output = new java.io.FileOutputStream(file)
			output.write(toJavaBytes(wavHeader(0, options.sampleRate, options.channels)))
			// AudioRecordingCallback reports the OS silencing this input
			// (calls, mic arbitration) so interrupted takes are real, not silent
			// stretches of zeroes. Callbacks run on the main looper.
			const mainHandler = new android.os.Handler(android.os.Looper.getMainLooper())
			const executor = new (java.util.concurrent.Executor as any)({
				execute(command: java.lang.Runnable) {
					mainHandler.post(command)
				},
			})

			recordingCallback = new (android.media.AudioManager.AudioRecordingCallback as any).extend({
				onRecordingConfigChanged(configs: java.util.List<any>) {
					let silenced = false
					for (let i = 0; configs && i < configs.size(); i++) {
						silenced ||= configs.get(i).isClientSilenced() === true
					}

					if (silenced && (state === 'recording' || state === 'paused')) {
						suspendCapture()
						state = 'interrupted'
						emit()
					} else if (!silenced && state === 'interrupted') {
						state = 'paused'
						emit()
					}
				},
			})()

			record.registerAudioRecordingCallback(
				executor,
				recordingCallback as android.media.AudioManager.AudioRecordingCallback,
			)

			resumeCapture()
		} catch (cause) {
			closeTake(true)
			error = asError(cause)
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

		suspendCapture()
		state = 'paused'
		emit()
	}

	const resume = async () => {
		if (state !== 'paused') {
			throw new Error(`AudioRecorder cannot resume while ${state}`)
		}

		try {
			resumeCapture()
		} catch (cause) {
			fail(asError(cause))
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
		if (!record || !takePath || !output) {
			throw new Error('AudioRecorder has no take to stop')
		}

		const takenPath = takePath
		const dataLength = bytesWritten
		closeTake(false)
		const file = new java.io.File(takenPath)
		patchWavSizes(file, dataLength)
		const result: RecordingResult = {
			mimeType: 'audio/wav',
			bytes: readFileBytes(takenPath),
			durationSeconds: dataLength / (options.sampleRate * options.channels * 2),
			sampleRate: options.sampleRate,
			channels: options.channels,
			path: takenPath,
		}

		takePath = undefined
		state = 'idle'
		emit()
		return result
	}

	const cancel = async () => {
		if (state === 'idle' && !record && !takePath) {
			return
		}

		closeTake(true)
		takePath = undefined
		state = 'idle'
		error = undefined
		emit()
	}

	return {
		capabilities: () => ({
			supported: true,
			pause: true,
			metering: true,
			userGestureRequired: false,
			reason:
				'Foreground capture only — background microphone use needs an app-owned foreground service.',
		}),
		snapshot,
		subscribe: (listener) => {
			listeners.add(listener)
			listener(snapshot())
			timer ??= setInterval(() => {
				emit()
				peak = 0
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
			closeTake(true)
			takePath = undefined
			if (timer) {
				clearInterval(timer)
			}

			timer = undefined
			listeners.clear()
			state = 'idle'
		},
	}
}
