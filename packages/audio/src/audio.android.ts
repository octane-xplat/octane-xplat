import { copyQueue } from './queue'
import { bounded } from './settings'
import { Utils } from '@nativescript/core'
import type { AudioCapabilities, AudioPlayer, AudioSnapshot, Track } from './types'
import { android } from '@octane-xplat/platform/android'

// The plugin's Java bridge is exposed by NativeScript's runtime metadata.
declare const com: {
	xplat: {
		audio: {
			AudioBridge: {
				ACTION_QUEUE: string
				ACTION_UPDATE: string
				ACTION_PLAY: string
				ACTION_PAUSE: string
				ACTION_SEEK: string
				ACTION_RELEASE: string
				ACTION_RATE: string
				ACTION_VOLUME: string
				ACTION_MUTED: string
				dispatch(
					context: android.content.Context,
					action: string,
					payload: string,
					index: number,
					seconds: number,
				): void
				snapshot(): string
			}
		}
	}
}

/** Create an independent player on web/iOS/macOS; Android owns one app playback service. */
export const createAudioPlayer = (): AudioPlayer => {
	const actions = com.xplat.audio.AudioBridge
	// `Utils.android` is a {} stub in the pinned Windows core build.
	const context = (Utils.android as any).getApplicationContext()
	const listeners = new Set<(snapshot: AudioSnapshot) => void>()
	let queue: Track[] = []
	let index = -1
	let disposed = false
	let playbackRate = 1
	let volume = 1
	let muted = false
	let queueComplete = true
	let poll: ReturnType<typeof setInterval> | undefined

	const snapshot = (): AudioSnapshot => {
		const value = JSON.parse(actions.snapshot()) as {
			state: AudioSnapshot['state']
			index?: number
			id?: string
			currentTime?: number
			duration?: number
			error?: string
		}

		if (Number.isInteger(value.index) && value.index! >= 0) {
			index = value.index!
		}

		return {
			state: value.state,
			playbackRate,
			volume,
			muted,
			queueComplete,
			track: value.id ? queue.find((track) => track.id === value.id) : queue[index],
			currentTime: value.currentTime ?? 0,
			duration: value.duration ?? 0,
			error: value.error ? new Error(value.error) : undefined,
		}
	}

	const emit = () => {
		const value = snapshot()
		for (const listener of listeners) {
			listener(value)
		}
	}

	const dispatch = (action: string, payload = '', at = 0, seconds = 0) => {
		if (disposed) {
			throw new Error('AudioPlayer is disposed')
		}

		actions.dispatch(context, action, payload, at, seconds)
	}

	const ensurePolling = () => {
		if (listeners.size && !poll) {
			poll = setInterval(emit, 250)
		}

		if (!listeners.size && poll) {
			clearInterval(poll)
			poll = undefined
		}
	}

	return {
		capabilities: (): AudioCapabilities => ({
			supported: true,
			backgroundPlayback: true,
			systemControls: true,
			userGestureRequired: false,
			interruptions: true,
		}),
		snapshot,
		subscribe: (listener) => {
			listeners.add(listener)
			listener(snapshot())
			ensurePolling()
			return () => {
				listeners.delete(listener)
				ensurePolling()
			}
		},
		setQueue: async (tracks, startAt = 0, options = {}) => {
			if (disposed) {
				throw new Error('AudioPlayer is disposed')
			}

			queue = copyQueue(tracks)
			queueComplete = options.complete ?? true
			index = queue.length
				? Math.max(
						0,
						Math.min(Number.isFinite(startAt) ? Math.floor(startAt) : 0, queue.length - 1),
					)
				: -1

			dispatch(
				actions.ACTION_QUEUE,
				JSON.stringify({ tracks: queue, complete: queueComplete }),
				index,
			)
			emit()
		},
		play: async () => dispatch(actions.ACTION_PLAY),
		pause: async () => dispatch(actions.ACTION_PAUSE),
		seek: async (seconds) => {
			if (Number.isFinite(seconds)) {
				dispatch(actions.ACTION_SEEK, '', 0, Math.max(0, seconds))
			}

			emit()
		},

		updateQueue: async (tracks, options = {}) => {
			const next = copyQueue(tracks)
			const complete = options.complete ?? queueComplete
			dispatch(actions.ACTION_UPDATE, JSON.stringify({ tracks: next, complete }))
			queue = next
			queueComplete = complete
			emit()
		},
		setPlaybackRate: async (rate) => {
			const next = bounded(rate, 0.5, 3)
			dispatch(actions.ACTION_RATE, '', 0, next)
			playbackRate = next
			emit()
		},
		setVolume: async (gain) => {
			const next = bounded(gain, 0, 1)
			dispatch(actions.ACTION_VOLUME, '', 0, next)
			volume = next
			emit()
		},
		setMuted: async (value) => {
			dispatch(actions.ACTION_MUTED, '', 0, value ? 1 : 0)
			muted = value
			emit()
		},
		dispose: () => {
			if (disposed) {
				return
			}

			disposed = true
			actions.dispatch(context, actions.ACTION_RELEASE, '', 0, 0)
			if (poll) {
				clearInterval(poll)
			}

			poll = undefined
			listeners.clear()
			queue = []
			index = -1
		},
	}
}
