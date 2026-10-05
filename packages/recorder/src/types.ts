/** Lifecycle of a single take owned by an AudioRecorder. */
export type RecorderState =
	/** No take is open. */
	| 'idle'
	/** The OS is delivering microphone samples. */
	| 'recording'
	/** Capture is paused by the app; resume() continues the same take. */
	| 'paused'
	/**
	 * Capture was suspended by the OS — a phone call, microphone silencing,
	 * a disconnected input route, or a muted browser track. Samples are not
	 * flowing. When the interruption clears the recorder moves to 'paused'
	 * and the app decides whether to resume(), stop(), or cancel().
	 */
	| 'interrupted'
	/** Capture failed; snapshot().error carries the cause. */
	| 'error'

export type RecorderPermissionState =
	/** The user has not been asked yet. */
	| 'undetermined'
	| 'granted'
	/** The user or OS policy refused microphone access. */
	| 'denied'
	/** No usable input device exists right now. */
	| 'unavailable'
	/** This target has no recorder backend. */
	| 'unsupported'

export type RecorderCapabilities = {
	supported: boolean
	/** pause()/resume() mid-take. */
	pause: boolean
	/** snapshot().meterLevel reports an input level while recording. */
	metering: boolean
	/** Browsers may require a user gesture before getUserMedia resolves. */
	userGestureRequired: boolean
	reason?: string
}

export type RecorderOptions = {
	/** Requested capture rate in Hz; default 44100. The result reports the
	 *  rate actually written. */
	sampleRate?: number
	/** Channel count; default 1 (mono). */
	channels?: 1 | 2
}

/** One finished take. `bytes` is a complete RIFF/WAVE file: 16-bit
 *  little-endian PCM at `sampleRate`/`channels`. */
export type RecordingResult = {
	mimeType: 'audio/wav'
	bytes: Uint8Array
	durationSeconds: number
	sampleRate: number
	channels: number
	/** Native only: where the take was written on disk. The app owns
	 *  cleanup; cancel() removes an unfinished take. */
	path?: string
}

export type RecorderSnapshot = {
	state: RecorderState
	/** Last-known microphone authorization; requestPermission() refreshes it. */
	permission: RecorderPermissionState
	/** Seconds captured so far in the open take. */
	durationSeconds: number
	/** Input level 0..1 while recording, or null when metering is off. */
	meterLevel: number | null
	error?: Error
}

export interface AudioRecorder {
	capabilities(): RecorderCapabilities
	snapshot(): RecorderSnapshot
	subscribe(listener: (snapshot: RecorderSnapshot) => void): () => void
	/** Prompts when undetermined and returns the resulting authorization. */
	requestPermission(): Promise<RecorderPermissionState>
	/** Opens a take. Rejects when permission is not granted or no input
	 *  device is usable — check snapshot().permission/error for the cause. */
	start(options?: RecorderOptions): Promise<void>
	/** Suspends capture without ending the take. */
	pause(): Promise<void>
	/** Continues a paused or cleared-interruption take. */
	resume(): Promise<void>
	/** Discards the open take (if any) and starts a new one. */
	restart(options?: RecorderOptions): Promise<void>
	/** Ends the take and returns its WAV bytes. */
	stop(): Promise<RecordingResult>
	/** Ends the take and discards everything captured. */
	cancel(): Promise<void>
	dispose(): void
}

export declare function createAudioRecorder(): AudioRecorder
