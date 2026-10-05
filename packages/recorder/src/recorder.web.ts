import { encodeWavFloat32 } from './wav'
import type {
	AudioRecorder,
	RecorderOptions,
	RecorderPermissionState,
	RecorderSnapshot,
	RecorderState,
	RecordingResult,
} from './types'

// Captured PCM crosses the worklet boundary as per-channel Float32Array
// copies — the processor's input buffers are recycled by the renderer.
const WORKLET_SOURCE = `class XplatRecorderTap extends AudioWorkletProcessor {
	process(inputs) {
		const input = inputs[0]
		if (input && input.length && input[0].length) {
			this.port.postMessage(input.map((channel) => channel.slice()))
		}
		return true
	}
}
registerProcessor('xplat-recorder-tap', XplatRecorderTap)`

const supported = () =>
	typeof navigator !== 'undefined' &&
	!!navigator.mediaDevices?.getUserMedia &&
	typeof AudioContext !== 'undefined'

const mapMediaError = (cause: unknown): RecorderPermissionState => {
	const name = (cause as { name?: string })?.name
	if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
		return 'denied'
	}

	if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'NotReadableError') {
		return 'unavailable'
	}

	if (name === 'NotSupportedError' || name === 'TypeError') {
		return 'unsupported'
	}

	return 'denied'
}

export async function requestMicrophonePermission(): Promise<RecorderPermissionState> {
	if (!supported()) {
		return 'unsupported'
	}

	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
		for (const track of stream.getTracks()) {
			track.stop()
		}

		return 'granted'
	} catch (cause) {
		return mapMediaError(cause)
	}
}

export const createAudioRecorder = (): AudioRecorder => {
	const listeners = new Set<(snapshot: RecorderSnapshot) => void>()
	let stream: MediaStream | undefined
	let context: AudioContext | undefined
	let source: MediaStreamAudioSourceNode | undefined
	let tap: AudioNode | undefined
	let sink: GainNode | undefined
	let channelChunks: Float32Array[][] = []
	let frames = 0
	let streamEnded = false
	let state: RecorderState = 'idle'
	let permission: RecorderPermissionState = 'undetermined'
	let error: Error | undefined
	let options: Required<RecorderOptions> = { sampleRate: 44100, channels: 1 }
	let meterLevel: number | null = null
	let timer: ReturnType<typeof setInterval> | undefined
	let opening = false
	let disposed = false

	if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
		void navigator.permissions
			.query({ name: 'microphone' as PermissionName })
			.then((status) => {
				permission =
					status.state === 'granted'
						? 'granted'
						: status.state === 'denied'
							? 'denied'
							: 'undetermined'
			})
			.catch(() => {})
	}

	const sampleRate = () => context?.sampleRate ?? options.sampleRate

	const snapshot = (): RecorderSnapshot => ({
		state,
		permission,
		durationSeconds: frames / sampleRate(),
		meterLevel,
		error,
	})

	const emit = () => {
		const value = snapshot()
		for (const listener of listeners) {
			listener(value)
		}
	}

	const appendInput = (input: Float32Array[]) => {
		if (state !== 'recording' || !input.length) {
			return
		}

		const frameCount = input[0].length
		if (options.channels === 1) {
			const mono = new Float32Array(frameCount)
			for (const channel of input) {
				for (let i = 0; i < frameCount; i++) {
					mono[i] += channel[i] / input.length
				}
			}

			channelChunks[0] ??= []
			channelChunks[0].push(mono)
		} else {
			for (let channel = 0; channel < 2; channel++) {
				channelChunks[channel] ??= []
				// A mono input duplicated is more truthful than a dead channel.
				channelChunks[channel].push(input[channel] ?? input[0])
			}
		}

		frames += frameCount
		let chunkPeak = 0
		for (const channel of input) {
			for (let i = 0; i < channel.length; i++) {
				const value = Math.abs(channel[i])
				if (value > chunkPeak) {
					chunkPeak = value
				}
			}
		}

		meterLevel = Math.min(1, chunkPeak)
	}

	const wireTrack = (audioTrack: MediaStreamTrack | undefined) => {
		if (!audioTrack) {
			throw new Error('The microphone stream has no audio track')
		}

		streamEnded = false
		audioTrack.addEventListener('mute', () => {
			if (state === 'recording' || state === 'paused') {
				state = 'interrupted'
				emit()
			}
		})

		audioTrack.addEventListener('unmute', () => {
			if (state === 'interrupted') {
				state = 'paused'
				emit()
			}
		})

		// 'ended' means the input went away — unplugged device or revoked
		// access. resume() re-acquires the stream; the take survives.
		audioTrack.addEventListener('ended', () => {
			if (state === 'recording' || state === 'paused' || state === 'interrupted') {
				streamEnded = true
				state = 'interrupted'
				emit()
			}
		})
	}

	const acquire = async (): Promise<MediaStream> => {
		try {
			return await navigator.mediaDevices.getUserMedia({
				audio: { channelCount: options.channels },
			})
		} catch (cause) {
			permission = mapMediaError(cause)
			error = new Error(`Microphone permission is ${permission}`)
			emit()
			throw error
		}
	}

	const attachStream = async (nextStream: MediaStream) => {
		stream = nextStream
		context ??= createContext(options.sampleRate)
		source = context.createMediaStreamSource(stream)
		const channels = stream.getAudioTracks()[0]?.getSettings?.().channelCount ?? options.channels
		let tapNode: AudioNode
		if (context.audioWorklet) {
			const url = URL.createObjectURL(
				new Blob([WORKLET_SOURCE], { type: 'application/javascript' }),
			)

			try {
				await context.audioWorklet.addModule(url)
			} finally {
				URL.revokeObjectURL(url)
			}

			const node = new AudioWorkletNode(context, 'xplat-recorder-tap')
			node.port.onmessage = (event) => appendInput(event.data)
			tapNode = node
		} else if (typeof (context as any).createScriptProcessor === 'function') {
			const node = (context as any).createScriptProcessor(4096, channels, channels)
			node.onaudioprocess = (event: any) => {
				const input = event.inputBuffer
				const data: Float32Array[] = []
				for (let channel = 0; channel < input.numberOfChannels; channel++) {
					data.push(input.getChannelData(channel).slice())
				}

				appendInput(data)
			}

			tapNode = node
		} else {
			throw new Error('This browser exposes neither AudioWorklet nor ScriptProcessor capture')
		}

		tap = tapNode
		source.connect(tapNode)
		// Pull-model renderers only run the tap when it reaches the
		// destination — a zero gain keeps it inaudible.
		sink = context.createGain()
		sink.gain.value = 0
		tap.connect(sink)
		sink.connect(context.destination)
		wireTrack(stream.getAudioTracks()[0])
	}

	const createContext = (rate: number): AudioContext => {
		try {
			return new AudioContext({ sampleRate: rate })
		} catch {
			return new AudioContext()
		}
	}

	const fail = (cause: Error) => {
		error = cause
		closeTake()
		state = 'error'
		emit()
	}

	const closeTake = () => {
		try {
			source?.disconnect()
			tap?.disconnect()
			sink?.disconnect()
		} catch {
			// Already detached.
		}

		source = undefined
		tap = undefined
		sink = undefined
		if (stream) {
			for (const audioTrack of stream.getTracks()) {
				audioTrack.stop()
			}
		}

		stream = undefined
		meterLevel = null
	}

	const start = async (next?: RecorderOptions) => {
		if (disposed) {
			throw new Error('AudioRecorder is disposed')
		}

		if (state !== 'idle' || opening) {
			throw new Error(`AudioRecorder cannot start while ${opening ? 'starting' : state}`)
		}

		if (!supported()) {
			permission = 'unsupported'
			error = new Error('This browser cannot capture microphone audio')
			emit()
			throw error
		}

		options = {
			sampleRate: next?.sampleRate ?? options.sampleRate,
			channels: next?.channels ?? options.channels,
		}

		error = undefined
		channelChunks = []
		frames = 0
		opening = true
		try {
			await attachStream(await acquire())
			permission = 'granted'
			await context?.resume()
		} catch (cause) {
			closeTake()
			if (!error) {
				error = cause instanceof Error ? cause : new Error(String(cause))
			}

			state = 'error'
			emit()
			throw error
		} finally {
			opening = false
		}

		state = 'recording'
		emit()
	}

	const pause = async () => {
		if (state !== 'recording') {
			throw new Error(`AudioRecorder cannot pause while ${state}`)
		}

		await context?.suspend()
		state = 'paused'
		emit()
	}

	const resume = async () => {
		if (state !== 'paused' && state !== 'interrupted') {
			throw new Error(`AudioRecorder cannot resume while ${state}`)
		}

		try {
			if (streamEnded || !stream?.active) {
				source?.disconnect()
				tap?.disconnect()
				sink?.disconnect()
				source = undefined
				tap = undefined
				sink = undefined
				await attachStream(await acquire())
			}

			await context?.resume()
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
		if (!context || !stream) {
			throw new Error('AudioRecorder has no take to stop')
		}

		const channelData = channelChunks.map((chunks) => {
			const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
			const merged = new Float32Array(total)
			let at = 0
			for (const chunk of chunks) {
				merged.set(chunk, at)
				at += chunk.length
			}

			return merged
		})

		const result: RecordingResult = {
			mimeType: 'audio/wav',
			bytes: encodeWavFloat32(channelData, sampleRate()),
			durationSeconds: frames / sampleRate(),
			sampleRate: sampleRate(),
			channels: options.channels,
		}

		closeTake()
		channelChunks = []
		state = 'idle'
		emit()
		return result
	}

	const cancel = async () => {
		if (state === 'idle' && !context && !stream) {
			return
		}

		closeTake()
		channelChunks = []
		frames = 0
		state = 'idle'
		error = undefined
		emit()
	}

	return {
		capabilities: () => ({
			supported: supported(),
			pause: true,
			metering: true,
			userGestureRequired: false,
			reason: supported()
				? undefined
				: 'getUserMedia/AudioContext are absent — insecure context or unsupported browser.',
		}),
		snapshot,
		subscribe: (listener) => {
			listeners.add(listener)
			listener(snapshot())
			timer ??= setInterval(emit, 250)
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
			void context?.close()
			context = undefined
			channelChunks = []
			if (timer) {
				clearInterval(timer)
			}

			timer = undefined
			listeners.clear()
			state = 'idle'
		},
	}
}

// See @octane-xplat/media for the pattern — registers the kind this leaf owns
// for the platform permissions dispatcher. 'unavailable' maps onto 'denied'
// because the shared PermissionResult union has no device-absence value.
const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.microphone = async () => {
	const state = await requestMicrophonePermission()
	return state === 'granted' ? 'granted' : state === 'unsupported' ? 'unsupported' : 'denied'
}
