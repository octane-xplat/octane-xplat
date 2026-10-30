/** One clip source — a bundled path/`require` string, or `{ uri }` for a
 *  remote/absolute URL. */
export type SoundSource = string | { uri: string }

/** What this host can actually do; check before offering sound UI. */
export type SoundCapabilities = {
	/** Any playback path exists. */
	supported: boolean
	/** The first play() must be inside a user gesture (web autoplay policy). */
	userGestureRequired: boolean
	/** Max simultaneous voices this host mixes; extra play() calls are dropped. */
	maxVoices: number
	/** Why supported is false, when known. */
	reason?: string
}

/** Options for createSoundBank(). */
export type SoundBankOptions = {
	/** Per-bank cap on simultaneous voices; the host's maxVoices still applies. */
	maxVoices?: number
}
/** Per-call playback options. */
export type PlaySoundOptions = {
	/** Linear gain 0–1 for this play. */
	volume?: number
}
/** An owned set of named clips. Dispose when its lifetime ends. */
export interface SoundBank {
	/** Inspect host availability before offering sound UI. */
	capabilities(): SoundCapabilities
	/** Prepares a named clip for playback; browsers may defer buffering until `play()`. */
	load(name: string, source: SoundSource): Promise<void>
	/** Play a loaded clip. Resolves false when the name is unknown, the voice
	 *  cap is reached, or the host refuses (autoplay policy). */
	play(name: string, options?: PlaySoundOptions): Promise<boolean>
	/** Stop one clip, or every clip when `name` is omitted. */
	stop(name?: string): void
	/** Release all loaded clips; the bank cannot be reused. */
	dispose(): void
}

export declare function createSoundBank(options?: SoundBankOptions): SoundBank
