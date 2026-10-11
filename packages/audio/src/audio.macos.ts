import type { AudioPlayer, AudioSnapshot, Track } from './types'

type NativeSnapshot = Pick<AudioSnapshot, 'state' | 'currentTime' | 'duration'> & { error?: string }
type NativePlayer = {
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
export const createAudioPlayer = (): AudioPlayer => {
	const native = typeof XplatAudioPlayer === 'undefined' ? undefined : XplatAudioPlayer.new()
	const listeners = new Set<(snapshot: AudioSnapshot) => void>()
	let queue: Track[] = []
	let index = -1
	let disposed = false
	let generation = 0
	let playRequest = 0
	let timer: ReturnType<typeof setInterval> | undefined
	let pending: { promise: Promise<void>; resolve(): void; reject(error: Error): void } | undefined
	let value: AudioSnapshot = { state: 'idle', currentTime: 0, duration: 0 }

	const assertActive = () => {
		if (disposed) {
			throw new Error('AudioPlayer is disposed')
		}
	}

	const snapshot = () => ({ ...value, track: queue[index] ? { ...queue[index] } : undefined })
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
			state: next.state,
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
			native.setSource(queue[index]!.source)
			timer = setInterval(tick, 100)
			tick()
		} catch (cause) {
			fail(cause)
		}

		await ready
		if (autoplay && !disposed && ownGeneration === generation && ownPlayRequest === playRequest) {
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
		setQueue: async (tracks, startAt = 0) => {
			assertActive()
			playRequest++
			queue = tracks.map((track) => ({ ...track }))
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
			command((player) => player.pause())
		},
		seek: async (seconds) => {
			assertActive()
			if (Number.isFinite(seconds)) {
				command((player) => player.seekSeconds(Math.max(0, seconds)))
			}
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
