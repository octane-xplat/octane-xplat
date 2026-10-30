import { Application } from '@nativescript/core'
import {
	createAudioRecorder as createAndroidRecorder,
	requestMicrophonePermission as requestAndroidPermission,
} from './recorder.android'

import {
	createAudioRecorder as createIOSRecorder,
	requestMicrophonePermission as requestIOSPermission,
} from './recorder.ios'

import type { AudioRecorder } from './types'

export * from './types'

// Runtime dispatch keeps the packed `native` lane (and suffix-less bundlers)
// working on both OSes — a bare `./recorder` specifier would resolve to
// recorder.ios.ts first under the repo's extension order.
/** Create an owned microphone recorder — dispatches to the running
 *  platform's leaf (Android/iOS). */
export const createAudioRecorder: () => AudioRecorder = (): AudioRecorder => {
	if (Application.android) {
		return createAndroidRecorder()
	}

	if (Application.ios) {
		return createIOSRecorder()
	}

	throw new Error('@octane-xplat/recorder requires iOS or Android')
}

// See @octane-xplat/media for the pattern — registers the kind this leaf owns
// for the platform permissions dispatcher. 'unavailable' maps onto 'denied'
// because the shared PermissionResponse union has no device-absence value.
const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.microphone = async () => {
	const state = Application.android
		? await requestAndroidPermission()
		: Application.ios
			? await requestIOSPermission()
			: 'unsupported'

	return state === 'granted' ? 'granted' : state === 'unsupported' ? 'unsupported' : 'denied'
}
