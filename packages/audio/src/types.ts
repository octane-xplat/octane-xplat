/** One playable local path or HTTP(S) source with a stable app-owned identity. */
export type Track = {
	/** App-owned stable identity — queue operations key on it. */
	id: string
	/** Local file path or HTTP(S) URL. */
	source: string
	/** Display title for system controls/lock screen. */
	title?: string
	/** Display artist for system controls. */
	artist?: string
	/** Display album for system controls. */
	album?: string
}

/** Availability of playback and OS integration on this host. */
export type AudioCapabilities = {
	/** Any playback path exists on this host. */
	supported: boolean
	/** Playback can continue when the app is backgrounded/screen-locked. */
	backgroundPlayback: boolean
	/** Lock screen / control-center / media-key integration is available. */
	systemControls: boolean
	/** The first play() must be called from a user gesture (web autoplay policy). */
	userGestureRequired: boolean
	/** The host delivers audio-interruption events (calls, Siri, other apps). */
	interruptions: boolean
	/** Why supported is false, when known. */
	reason?: string
}

/** Observable loading, playback, and terminal state. */
export type PlaybackState =
	| 'idle'
	| 'loading'
	| 'playing'
	| 'paused'
	| 'waiting'
	| 'ended'
	| 'error'

/** Whether a queue may receive more items. */
export interface QueueOptions {
	/** Defaults to true for setQueue; updateQueue retains the current value. */
	complete?: boolean
}

/** Current playback position (seconds) and persistent player settings. */
export type AudioSnapshot = {
	/** Current observable playback state. */
	state: PlaybackState
	/** The queue item being played, undefined in 'idle'. */
	track?: Track
	/** Current position in seconds. */
	currentTime: number
	/** Track length in seconds, or 0 until known. */
	duration: number
	/** The failure behind state === 'error'. */
	error?: Error
	/** Requested speed, 0.5–3; defaults to 1. Pitch is preserved. */
	playbackRate: number
	/** Remembered gain, 0–1; defaults to 1. Independent of mute. */
	volume: number
	/** Whether output is muted; defaults to false. */
	muted: boolean
	/** False while more items may arrive; exhaustion then reports waiting. */
	queueComplete: boolean
}

/** An owned audio queue. Dispose it when its app/service lifetime ends. */
export interface AudioPlayer {
	/** Inspect host availability before offering OS integrations. */
	capabilities(): AudioCapabilities
	/** Read current seconds and requested settings. */
	snapshot(): AudioSnapshot
	/** Observe immediately and on changes; returns an unsubscribe function. */
	subscribe(listener: (snapshot: AudioSnapshot) => void): () => void
	/** Replace the queue and prepare the clamped zero-based start index, paused. */
	setQueue(tracks: readonly Track[], startAt?: number, options?: QueueOptions): Promise<void>
	/**
	 * Replace queue metadata/future items, retaining the current ID+source without
	 * reloading it. Removing/replacing it selects the first new item paused.
	 * Appending while waiting resumes only if playback was not explicitly paused.
	 * Duplicate/empty IDs or sources reject before changing the queue.
	 */
	updateQueue(tracks: readonly Track[], options?: QueueOptions): Promise<void>
	/** Begin/resume playback; browser autoplay restrictions may reject. */
	play(): Promise<void>
	/** Pause, cancelling interruption auto-resume. */
	pause(): Promise<void>
	/** Seek within the current item in seconds; nonfinite values are ignored. */
	seek(seconds: number): Promise<void>
	/** Set pitch-preserving speed, clamped to 0.5–3. Nonfinite values reject. */
	setPlaybackRate(rate: number): Promise<void>
	/** Set remembered gain, clamped to 0–1. Nonfinite values reject. */
	setVolume(volume: number): Promise<void>
	/** Mute without changing remembered volume. */
	setMuted(muted: boolean): Promise<void>
	/** Release resources. Repeated disposal is safe. */
	dispose(): void
}

/** Create an independent player on web/iOS/macOS; Android owns one app playback service. */
export declare function createAudioPlayer(): AudioPlayer
