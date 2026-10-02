import type { AudioCapabilities, AudioPlayer, AudioSnapshot, Track } from './types'

export const createAudioPlayer = (): AudioPlayer => {
	const audio = new Audio()
	const listeners = new Set<(value: AudioSnapshot) => void>()
	let queue: Track[] = []
	let index = -1
	let state: AudioSnapshot['state'] = 'idle'
	let error: Error | undefined
	let disposed = false
	const current = () => queue[index]
	const snapshot = (): AudioSnapshot => ({
		state,
		track: current(),
		currentTime: audio.currentTime || 0,
		duration: Number.isFinite(audio.duration) ? audio.duration : 0,
		error,
	})

	const emit = () => {
		const value = snapshot()
		for (const listener of listeners) {
			listener(value)
		}
	}

	const setTrack = () => {
		const track = current()
		if (!track) {
			audio.removeAttribute('src')
			state = 'idle'
			emit()
			return
		}

		audio.src = track.source
		state = 'loading'
		if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
			navigator.mediaSession.metadata = new MediaMetadata({
				title: track.title ?? track.id,
				artist: track.artist ?? '',
				album: track.album ?? '',
			})

			navigator.mediaSession.setActionHandler('play', () => {
				void audio.play()
			})

			navigator.mediaSession.setActionHandler('pause', () => audio.pause())
			navigator.mediaSession.setActionHandler('seekto', (event) => {
				if (event.seekTime != null) {
					audio.currentTime = event.seekTime
				}
			})

			navigator.mediaSession.setActionHandler('nexttrack', () => {
				void advance(1)
			})

			navigator.mediaSession.setActionHandler('previoustrack', () => {
				void advance(-1)
			})
		}

		emit()
	}

	const advance = async (delta: number) => {
		if (!queue.length) {
			return
		}

		if (delta > 0 && index + 1 >= queue.length) {
			audio.pause()
			state = 'ended'
			emit()
			return
		}

		index = Math.max(0, Math.min(index + delta, queue.length - 1))
		setTrack()
		try {
			await audio.play()
		} catch (cause) {
			error = cause instanceof Error ? cause : new Error(String(cause))
			state = 'error'
			emit()
		}
	}

	for (const event of [
		'timeupdate',
		'durationchange',
		'play',
		'pause',
		'ended',
		'waiting',
		'error',
	]) {
		audio.addEventListener(event, () => {
			if (event === 'play') {
				state = 'playing'
			} else if (event === 'pause' && state !== 'ended') {
				state = 'paused'
			} else if (event === 'ended') {
				state = 'ended'
				void advance(1)
				return
			} else if (event === 'error') {
				state = 'error'
				error = new Error('Audio playback failed')
			} else if (event === 'waiting') {
				state = 'loading'
			}

			emit()
		})
	}

	return {
		capabilities: (): AudioCapabilities => ({
			supported: true,
			backgroundPlayback: false,
			systemControls: typeof navigator !== 'undefined' && 'mediaSession' in navigator,
			userGestureRequired: true,
			interruptions: false,
			reason:
				'Background playback and OS interruption handling are unavailable on web; autoplay may require a user gesture.',
		}),
		snapshot,
		subscribe: (listener) => {
			listeners.add(listener)
			listener(snapshot())
			return () => listeners.delete(listener)
		},
		setQueue: async (tracks, startAt = 0) => {
			if (disposed) {
				throw new Error('AudioPlayer is disposed')
			}

			queue = [...tracks]
			index = queue.length
				? Math.min(
						Math.max(Number.isFinite(startAt) ? Math.floor(startAt) : 0, 0),
						queue.length - 1,
					)
				: -1

			error = undefined
			setTrack()
		},
		play: async () => {
			if (!disposed && current()) {
				await audio.play()
			}
		},
		pause: async () => {
			audio.pause()
		},
		seek: async (seconds) => {
			if (Number.isFinite(seconds)) {
				audio.currentTime = Math.max(0, seconds)
			}
		},
		dispose: () => {
			disposed = true
			audio.pause()
			audio.removeAttribute('src')
			audio.load()
			listeners.clear()
			queue = []
			if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
				navigator.mediaSession.metadata = null
				for (const action of ['play', 'pause', 'seekto', 'nexttrack', 'previoustrack'] as const) {
					navigator.mediaSession.setActionHandler(action, null)
				}
			}
		},
	}
}
