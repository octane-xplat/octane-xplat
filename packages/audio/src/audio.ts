import { Application } from '@nativescript/core'
import { createAudioPlayer as createAndroidAudioPlayer } from './audio.android'
import { createAudioPlayer as createIOSAudioPlayer } from './audio.ios'
import type { AudioPlayer } from './types'

export const createAudioPlayer = (): AudioPlayer => {
	if (Application.android) {
		return createAndroidAudioPlayer()
	}
	if (Application.ios) {
		return createIOSAudioPlayer()
	}
	throw new Error('@octane-xplat/audio requires iOS or Android')
}
