import { copyQueue } from './queue'
import { bounded } from './settings'
import type { AudioCapabilities, AudioPlayer, AudioSnapshot, Track } from './types'

export const createAudioPlayer = (): AudioPlayer => {
	const audio = new Audio()
	const listeners = new Set<(value: AudioSnapshot) => void>()
	let queue: Track[] = []
	let index = -1
	let state: AudioSnapshot['state'] = 'idle'
	let error: Error | undefined
	let disposed = false
	let generation = 0
	let playbackRate = 1
	let volume = 1
	let muted = false
	let queueComplete = true
	let waitingToResume = false
	const current = () => queue[index]
	const snapshot = (): AudioSnapshot => ({
		state,
		playbackRate,
		volume,
		muted,
		queueComplete,
		track: current(),
		currentTime: audio.currentTime || 0,
		duration: Number.isFinite(audio.duration) ? audio.duration : 0,
		error,
	})

	const emit = () => {
		const value = snapshot()
		const ownGeneration = generation
		for (const listener of listeners) {
			if (disposed || ownGeneration !== generation) {
				break
			}

			listener(value)
		}
	}

	const updateMetadata = () => {
		const track = current()
		if (!track) {
			if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
				navigator.mediaSession.metadata = null
			}

			return
		}
		if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
			navigator.mediaSession.metadata = new MediaMetadata({
				title: track.title ?? track.id,
				artist: track.artist ?? '',
				album: track.album ?? '',
			})

			navigator.mediaSession.setActionHandler('play', () => {
				void play().catch(() => {})
			})

			navigator.mediaSession.setActionHandler('pause', () => {
				void pause()
			})

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
	}

	const setTrack = () => {
		generation++
		error = undefined
		const track = current()
		if (!track) {
			audio.removeAttribute('src')
			state = 'idle'
			updateMetadata()
			emit()
			return
		}

		audio.src = track.source
		audio.playbackRate = playbackRate
		audio.preservesPitch = true
		audio.volume = volume
		audio.muted = muted
		state = 'loading'
		updateMetadata()
		emit()
	}

	const advance = async (delta: number) => {
		if (!queue.length) {
			return
		}

		if (delta > 0 && index + 1 >= queue.length) {
			state = queueComplete ? 'ended' : 'waiting'
			waitingToResume = !queueComplete
			audio.pause()
			emit()
			return
		}

		index = Math.max(0, Math.min(index + delta, queue.length - 1))
		setTrack()
		const ownGeneration = generation
		try {
			await audio.play()
		} catch (cause) {
			if (disposed || ownGeneration !== generation) {
				return
			}

			error = cause instanceof Error ? cause : new Error(String(cause))
			state = 'error'
			emit()
		}
	}

	for (const event of [
		'timeupdate',
		'durationchange',
		'play',
		'playing',
		'pause',
		'ended',
		'waiting',
		'error',
	]) {
		audio.addEventListener(event, () => {
			if (event === 'play') {
				state = 'loading'
			} else if (event === 'playing') {
				state = 'playing'
			} else if (event === 'pause' && state !== 'ended' && state !== 'waiting') {
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

	const play = async () => {
		if (!disposed && current()) {
			await audio.play()
		}
	}
	const pause = async () => {
		waitingToResume = false
		audio.pause()
		if (state === 'waiting') {
			state = 'paused'
			emit()
		}
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
		setQueue: async (tracks, startAt = 0, options = {}) => {
			if (disposed) {
				throw new Error('AudioPlayer is disposed')
			}

			queue = copyQueue(tracks)
			queueComplete = options.complete ?? true
			waitingToResume = false
			index = queue.length
				? Math.min(
						Math.max(Number.isFinite(startAt) ? Math.floor(startAt) : 0, 0),
						queue.length - 1,
					)
				: -1

			error = undefined
			setTrack()
		},
		play,
		pause,
		seek: async (seconds) => {
			if (Number.isFinite(seconds)) {
				audio.currentTime = Math.max(0, seconds)
			}
		},

		updateQueue: async (tracks, options = {}) => {
			if (disposed) {
				throw new Error('AudioPlayer is disposed')
			}
			const next = copyQueue(tracks)
			const old = current()
			const at = old ? next.findIndex((t) => t.id === old.id && t.source === old.source) : -1
			queue = next
			queueComplete = options.complete ?? queueComplete
			if (at < 0) {
				waitingToResume = false
				index = next.length ? 0 : -1
				audio.pause()
				setTrack()
				if (next.length) {
					state = 'paused'
					emit()
				}
			} else {
				index = at
				if (state === 'waiting' && waitingToResume && index + 1 < queue.length) {
					waitingToResume = false
					await advance(1)
				} else if (state === 'waiting' && queueComplete) {
					state = 'ended'
					waitingToResume = false
				}

				updateMetadata()
				emit()
			}
		},
		setPlaybackRate: async (rate) => {
			if (disposed) {
				throw new Error('AudioPlayer is disposed')
			}
			playbackRate = bounded(rate, 0.5, 3)
			audio.preservesPitch = true
			audio.playbackRate = playbackRate
			emit()
		},
		setVolume: async (gain) => {
			if (disposed) {
				throw new Error('AudioPlayer is disposed')
			}
			volume = bounded(gain, 0, 1)
			audio.volume = volume
			emit()
		},
		setMuted: async (value) => {
			if (disposed) {
				throw new Error('AudioPlayer is disposed')
			}
			muted = value
			audio.muted = muted
			emit()
		},
		dispose: () => {
			disposed = true
			generation++
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
