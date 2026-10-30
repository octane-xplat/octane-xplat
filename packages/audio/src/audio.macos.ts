import { copyQueue } from './queue'
import { bounded } from './settings'
import type { AudioPlayer, AudioSnapshot, Track } from './types'

type NativeSnapshot = Pick<AudioSnapshot, 'state' | 'currentTime' | 'duration'> & { error?: string }
type NativePlayer = {
	setPlaybackRate(rate: number): void
	setVolume(volume: number): void
	setMuted(muted: boolean): void
	setSource(source: string): void
	play(): void
	pause(): void
	seekSeconds(seconds: number): void
	snapshot(): string
	clear(): void
	dispose(): void
}

declare const XplatAudioPlayer: { new: () => NativePlayer }

/** The CLI loads the package's AVFoundation leaf before evaluating the app. */
/** Create an independent player on web/iOS/macOS; Android owns one app playback service. */
export const createAudioPlayer = (): AudioPlayer => {
	const native = typeof XplatAudioPlayer === 'undefined' ? undefined : XplatAudioPlayer.new()
	const listeners = new Set<(snapshot: AudioSnapshot) => void>()
	let queue: Track[] = []
	let index = -1
	let disposed = false
	let playbackRate = 1
	let volume = 1
	let muted = false
	let queueComplete = true
	let waitingToResume = false
	let generation = 0
	let playRequest = 0
	let timer: ReturnType<typeof setInterval> | undefined
	let pending: { promise: Promise<void>; resolve(): void; reject(error: Error): void } | undefined
	let value: Omit<AudioSnapshot, 'playbackRate' | 'volume' | 'muted' | 'queueComplete'> = {
		state: 'idle',
		currentTime: 0,
		duration: 0,
	}

	const assertActive = () => {
		if (disposed) {
			throw new Error('AudioPlayer is disposed')
		}
	}

	const snapshot = () => ({
		...value,
		playbackRate,
		volume,
		muted,
		queueComplete,
		track: queue[index] ? { ...queue[index] } : undefined,
	})
	const emit = () => {
		const currentGeneration = generation
		const current = snapshot()
		for (const listener of listeners) {
			if (disposed || currentGeneration !== generation) {
				break
			}

			listener(current)
		}
	}

	const stopTimer = () => {
		if (timer !== undefined) {
			clearInterval(timer)
		}

		timer = undefined
	}

	const fail = (cause: unknown) => {
		const error = cause instanceof Error ? cause : new Error(String(cause))
		// Retain the original failure even when cleanup itself fails.
		try {
			native?.clear()
		} catch {
			/* The owned bridge has already failed. */
		}

		value = { ...value, state: 'error', error }
		pending?.reject(error)
		pending = undefined
		stopTimer()
		emit()
		return error
	}

	const read = () => {
		if (!native || disposed || value.state === 'error') {
			return
		}

		const next = JSON.parse(native.snapshot()) as NativeSnapshot
		if (next.state === 'error') {
			throw new Error(next.error ?? 'Audio playback failed')
		}

		value = {
			state: value.state === 'waiting' && next.state === 'ended' ? 'waiting' : next.state,
			currentTime: Number.isFinite(next.currentTime) ? Math.max(0, next.currentTime) : 0,
			duration: Number.isFinite(next.duration) ? Math.max(0, next.duration) : 0,
		}

		if (pending && next.state !== 'loading') {
			pending.resolve()
			pending = undefined
		}
	}

	const tick = () => {
		if (disposed) {
			return
		}

		try {
			read()
		} catch (cause) {
			fail(cause)
			return
		}

		if (value.state === 'ended') {
			if (index + 1 < queue.length) {
				index++
				// Native notifications never own a rejected JS promise.
				void load(true).catch(() => {})
				return
			}

			if (!queueComplete) {
				value = { ...value, state: 'waiting' }
				waitingToResume = true
			}

			stopTimer()
		} else if (!pending && value.state !== 'playing' && value.state !== 'loading') {
			// Paused/idle is stable — the poll only exists to observe loading
			// resolution, playing progress, and the ended auto-advance.
			stopTimer()
		}

		emit()
	}

	const load = async (autoplay = false) => {
		const ownGeneration = ++generation
		const ownPlayRequest = playRequest
		pending?.reject(new Error('Audio load was superseded'))
		pending = undefined
		stopTimer()
		value = { state: queue[index] ? 'loading' : 'idle', currentTime: 0, duration: 0 }
		try {
			native?.clear()
		} catch (cause) {
			throw fail(cause)
		}

		emit()
		if (!queue[index] || disposed || ownGeneration !== generation) {
			return
		}

		if (!native) {
			throw fail(
				new Error('macOS audio bridge is unavailable; rebuild the app with @octane-xplat/audio'),
			)
		}

		let resolveReady!: () => void
		let rejectReady!: (error: Error) => void
		const ready = new Promise<void>((resolve, reject) => {
			resolveReady = resolve
			rejectReady = reject
		})

		pending = { promise: ready, resolve: resolveReady, reject: rejectReady }
		// Attach before bridge calls, which may fail synchronously.
		ready.catch(() => {})
		try {
			native.setPlaybackRate(playbackRate)
			native.setVolume(volume)
			native.setMuted(muted)
			native.setSource(queue[index]!.source)
			timer = setInterval(tick, 100)
			tick()
		} catch (cause) {
			fail(cause)
		}

		await ready
		if (
			autoplay &&
			value.state !== 'ended' &&
			value.state !== 'waiting' &&
			!disposed &&
			ownGeneration === generation &&
			ownPlayRequest === playRequest
		) {
			await play()
		}
	}

	const command = (action: (player: NativePlayer) => void) => {
		assertActive()
		if (value.error) {
			throw value.error
		}

		if (!native || index < 0) {
			return
		}

		try {
			action(native)
			read()
		} catch (cause) {
			throw fail(cause)
		}

		timer ??= setInterval(tick, 100)
		emit()
	}

	const play = async () => {
		assertActive()
		const ownPlayRequest = ++playRequest
		const ownGeneration = generation
		await pending?.promise
		assertActive()
		if (ownGeneration !== generation) {
			throw new Error('Audio load was superseded')
		}

		if (ownPlayRequest === playRequest) {
			command((player) => player.play())
		}
	}

	return {
		capabilities: () => ({
			supported: !!native,
			backgroundPlayback: !!native,
			systemControls: false,
			userGestureRequired: false,
			interruptions: false,
			reason: native
				? undefined
				: 'macOS audio bridge is unavailable; rebuild the app with @octane-xplat/audio',
		}),
		snapshot: () => {
			try {
				read()
			} catch (cause) {
				fail(cause)
			}

			return snapshot()
		},
		subscribe: (listener) => {
			assertActive()
			listeners.add(listener)
			listener(snapshot())
			return () => {
				listeners.delete(listener)
			}
		},
		setQueue: async (tracks, startAt = 0, options = {}) => {
			assertActive()
			const next = copyQueue(tracks)
			playRequest++
			queue = next
			queueComplete = options.complete ?? true
			waitingToResume = false
			index = queue.length
				? Math.max(
						0,
						Math.min(Number.isFinite(startAt) ? Math.floor(startAt) : 0, queue.length - 1),
					)
				: -1

			await load()
		},
		play,
		pause: async () => {
			playRequest++
			waitingToResume = false
			command((player) => player.pause())
		},
		seek: async (seconds) => {
			assertActive()
			if (Number.isFinite(seconds)) {
				command((player) => player.seekSeconds(Math.max(0, seconds)))
			}
		},

		updateQueue: async (tracks, options = {}) => {
			assertActive()
			const next = copyQueue(tracks)
			const current = queue[index]
			const at = current
				? next.findIndex((t) => t.id === current.id && t.source === current.source)
				: -1
			queue = next
			queueComplete = options.complete ?? queueComplete
			if (at < 0) {
				playRequest++
				waitingToResume = false
				index = next.length ? 0 : -1
				await load()
			} else {
				index = at
				if (value.state === 'waiting' && waitingToResume && index + 1 < queue.length) {
					waitingToResume = false
					index++
					await load(true)
				} else if (value.state === 'waiting' && queueComplete) {
					value = { ...value, state: 'ended' }
					waitingToResume = false
				}

				emit()
			}
		},
		setPlaybackRate: async (rate) => {
			assertActive()
			const next = bounded(rate, 0.5, 3)
			native?.setPlaybackRate(next)
			playbackRate = next
			emit()
		},
		setVolume: async (gain) => {
			assertActive()
			const next = bounded(gain, 0, 1)
			native?.setVolume(next)
			volume = next
			emit()
		},
		setMuted: async (value) => {
			assertActive()
			native?.setMuted(value)
			muted = value
			emit()
		},
		dispose: () => {
			if (disposed) {
				return
			}

			disposed = true
			generation++
			pending?.reject(new Error('AudioPlayer is disposed'))
			pending = undefined
			stopTimer()
			listeners.clear()
			queue = []
			index = -1
			value = { state: 'idle', currentTime: 0, duration: 0 }
			native?.dispose()
		},
	}
}
