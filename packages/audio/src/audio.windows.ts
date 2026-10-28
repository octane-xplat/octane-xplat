import type { AudioPlayer } from './types'

/** Keep Windows imports independent of mobile backends; playback is unavailable. */
export const createAudioPlayer = (): AudioPlayer => {
	throw new Error('@octane-xplat/audio is not available on Windows')
}
