import type { AudioPlayer } from './types'

/** Keep Windows imports independent of mobile backends; playback is unavailable. */
/** Create an independent player on web/iOS/macOS; Android owns one app playback service. */
export const createAudioPlayer = (): AudioPlayer => {
	throw new Error('@octane-xplat/audio is not available on Windows')
}
