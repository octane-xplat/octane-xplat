export type Track = {
	id: string
	source: string
	title?: string
	artist?: string
	album?: string
}

export type AudioCapabilities = {
	supported: boolean
	backgroundPlayback: boolean
	systemControls: boolean
	userGestureRequired: boolean
	interruptions: boolean
	reason?: string
}

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'

export type AudioSnapshot = {
	state: PlaybackState
	track?: Track
	/** Current position in seconds. */
	currentTime: number
	/** Track length in seconds, or 0 until known. */
	duration: number
	error?: Error
}

export interface AudioPlayer {
	capabilities(): AudioCapabilities
	snapshot(): AudioSnapshot
	subscribe(listener: (snapshot: AudioSnapshot) => void): () => void
	setQueue(tracks: readonly Track[], startAt?: number): Promise<void>
	play(): Promise<void>
	pause(): Promise<void>
	seek(seconds: number): Promise<void>
	dispose(): void
}

export declare function createAudioPlayer(): AudioPlayer
