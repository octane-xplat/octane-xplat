import { Application } from '@nativescript/core'
import { createAudioPlayer as createAndroidAudioPlayer } from './audio.android'
import { createAudioPlayer as createIOSAudioPlayer } from './audio.ios'
import type { AudioPlayer } from './types'

/** Create an independent player on web/iOS/macOS; Android owns one app playback service. */
export const createAudioPlayer = (): AudioPlayer => {
	if (Application.android) {
		return createAndroidAudioPlayer()
	}

	if (Application.ios) {
		return createIOSAudioPlayer()
	}

	throw new Error('@octane-xplat/audio requires iOS or Android')
}
