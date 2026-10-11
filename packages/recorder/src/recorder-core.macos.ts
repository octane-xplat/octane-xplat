import type {
	AudioRecorder,
	RecorderOptions,
	RecorderPermissionState,
	RecorderSnapshot,
	RecorderState,
	RecordingResult,
} from './types'

import { decodeBase64, inspectPcmWav } from './wav'

/** Private bridge contract. Each native event belongs to exactly one take. */
export interface RecorderHost {
	permissionStatus(): string
	requestPermission(reply: (status: string) => void): void
	installObserver(listener: (message: string) => void): void
	startTake(options: string): string
	pause(): void
	resume(): string
	stop(): void
	cancel(): void
	status(): string
	dispose(): void
}

type HostEvent = {
	type: 'finished' | 'error' | 'interrupted' | 'interruptionEnded'
	id: number
	base64?: string
	path?: string
	message?: string
}

const permissionFrom = (value: string): RecorderPermissionState => {
	switch (value) {
		case 'granted':
		case 'denied':
		case 'undetermined':
		case 'unavailable':
			return value
		case 'restricted':
			return 'denied' // OS policy refusal uses the existing public value.
		default:
			return 'unsupported'
	}
}

export function createMacOSRecorder(host?: RecorderHost): AudioRecorder {
	const listeners = new Set<(snapshot: RecorderSnapshot) => void>()
	let state: RecorderState = 'idle'
	let rawPermission = host?.permissionStatus() ?? 'unsupported'
	let permission = permissionFrom(rawPermission)
	let error: Error | undefined
	let durationSeconds = 0
	let meterLevel: number | null = null
	let disposed = false
	let generation = 0
	let opening = false
	let finalizing = false
	let timer: ReturnType<typeof setInterval> | undefined
	let permissionTask: Promise<RecorderPermissionState> | undefined
	let abortPermission: (() => void) | undefined
	let abortStart: (() => void) | undefined
	let completion:
		| {
				promise: Promise<RecordingResult>
				resolve: (result: RecordingResult) => void
				reject: (error: Error) => void
		  }
		| undefined

	const snapshot = (): RecorderSnapshot => ({
		state,
		permission,
		error,
		durationSeconds,
		meterLevel,
	})

	const emit = () => {
		for (const listener of listeners) {
			listener(snapshot())
		}
	}

	const assertLive = () => {
		if (disposed) {
			throw new Error('AudioRecorder is disposed')
		}
	}

	const clearTimer = () => {
		if (timer) {
			clearInterval(timer)
		}

		timer = undefined
	}

	const fail = (cause: unknown) => {
		error = cause instanceof Error ? cause : new Error(String(cause))
		finalizing = false
		clearTimer()
		meterLevel = null
		host?.cancel()
		state = 'error'
		completion?.reject(error)
		completion = undefined
		emit()
	}

	const refresh = () => {
		if (!host || state === 'idle' || state === 'error' || finalizing) {
			return
		}

		try {
			const native = JSON.parse(host.status())
			durationSeconds = native.durationSeconds
			meterLevel = state === 'recording' ? native.meterLevel : null
			emit()
		} catch (cause) {
			fail(cause)
		}
	}

	host?.installObserver((message) => {
		if (disposed) {
			return
		}

		try {
			const event: HostEvent = JSON.parse(message)
			if (event.id !== generation) {
				return
			}

			if (event.type === 'error') {
				fail(new Error(event.message ?? 'Microphone capture failed'))
			} else if (event.type === 'finished') {
				if (!finalizing || !completion) {
					fail(new Error('Microphone capture ended unexpectedly'))
					return
				}

				if (!event.base64 || !event.path) {
					throw new Error('Recording file is missing')
				}

				const bytes = decodeBase64(event.base64)
				const metadata = inspectPcmWav(bytes)
				const result: RecordingResult = {
					mimeType: 'audio/wav',
					bytes,
					path: event.path,
					...metadata,
				}

				const pending = completion
				completion = undefined
				finalizing = false
				++generation // Ignore late callbacks from the completed take.
				state = 'idle'
				durationSeconds = 0
				meterLevel = null
				clearTimer()
				emit()
				pending.resolve(result)
			} else if (
				!finalizing &&
				event.type === 'interrupted' &&
				(state === 'recording' || state === 'paused')
			) {
				state = 'interrupted'
				meterLevel = null
				emit()
			} else if (!finalizing && event.type === 'interruptionEnded' && state === 'interrupted') {
				state = 'paused'
				emit()
			}
		} catch (cause) {
			fail(cause)
		}
	})

	const requestPermission = (): Promise<RecorderPermissionState> => {
		assertLive()
		if (permissionTask) {
			return permissionTask
		}

		const task = new Promise<RecorderPermissionState>((resolve, reject) => {
			abortPermission = () => reject(new Error('AudioRecorder is disposed'))
			const reply = (status: string) => {
				if (disposed) {
					return
				}

				rawPermission = status
				permission = permissionFrom(status)
				emit()
				resolve(permission)
			}

			if (host) {
				host.requestPermission(reply)
			} else {
				reply('unsupported')
			}
		})

		permissionTask = task
		void task
			.finally(() => {
				if (permissionTask === task) {
					permissionTask = undefined
				}

				abortPermission = undefined
			})
			.catch(() => {})

		return task
	}

	const start = async (options?: RecorderOptions) => {
		assertLive()
		if (opening || state !== 'idle') {
			throw new Error(`AudioRecorder cannot start while ${opening ? 'starting' : state}`)
		}

		const sampleRate = options?.sampleRate ?? 44100
		const channels = options?.channels ?? 1
		if (
			!Number.isInteger(sampleRate) ||
			sampleRate < 1 ||
			sampleRate > 192000 ||
			(channels !== 1 && channels !== 2)
		) {
			throw new Error('Invalid PCM sample rate or channel count')
		}

		opening = true
		const id = ++generation
		error = undefined
		try {
			const cancelled = new Promise<never>((_, reject) => {
				abortStart = () => reject(new Error('AudioRecorder start was cancelled'))
			})

			const authorization = await Promise.race([requestPermission(), cancelled])
			if (disposed || id !== generation) {
				throw new Error('AudioRecorder start was cancelled')
			}

			if (authorization !== 'granted') {
				throw new Error(`Microphone permission is ${rawPermission}`)
			}

			const cause = host!.startTake(JSON.stringify({ id, sampleRate, channels }))
			if (cause) {
				throw new Error(cause)
			}

			state = 'recording'
			durationSeconds = 0
			timer = setInterval(refresh, 250)
			emit()
		} catch (cause) {
			if (!disposed && id === generation) {
				fail(cause)
			}

			throw cause
		} finally {
			if (id === generation) {
				opening = false
				abortStart = undefined
			}
		}
	}

	const cancel = async () => {
		++generation
		abortStart?.()
		abortStart = undefined
		opening = false
		finalizing = false
		completion?.reject(new Error('AudioRecorder take was cancelled'))
		completion = undefined
		host?.cancel()
		clearTimer()
		state = 'idle'
		error = undefined
		durationSeconds = 0
		meterLevel = null
		emit()
	}

	return {
		capabilities: () => ({
			supported: !!host,
			pause: !!host,
			metering: !!host,
			userGestureRequired: false,
			...(!host ? { reason: 'macOS recorder native bridge is unavailable' } : {}),
		}),
		snapshot,
		subscribe(listener) {
			assertLive()
			listeners.add(listener)
			listener(snapshot())
			return () => {
				listeners.delete(listener)
			}
		},
		requestPermission,
		start,
		async pause() {
			assertLive()
			if (state !== 'recording' || finalizing) {
				throw new Error(`AudioRecorder cannot pause while ${state}`)
			}

			try {
				host!.pause()
				refresh()
				state = 'paused'
				meterLevel = null
				emit()
			} catch (cause) {
				fail(cause)
				throw cause
			}
		},
		async resume() {
			assertLive()
			if (state !== 'paused' || finalizing) {
				throw new Error(`AudioRecorder cannot resume while ${state}`)
			}

			try {
				const cause = host!.resume()
				if (cause) {
					throw new Error(cause)
				}

				state = 'recording'
				emit()
			} catch (cause) {
				fail(cause)
				throw cause
			}
		},
		async restart(options) {
			assertLive()
			await cancel()
			await start(options)
		},
		stop() {
			assertLive()
			if (completion) {
				return completion.promise
			}

			if (
				opening ||
				!host ||
				(state !== 'recording' && state !== 'paused' && state !== 'interrupted')
			) {
				return Promise.reject(new Error('AudioRecorder has no take to stop'))
			}

			let resolve!: (result: RecordingResult) => void
			let reject!: (cause: Error) => void
			const promise = new Promise<RecordingResult>((yes, no) => {
				resolve = yes
				reject = no
			})

			completion = { promise, resolve, reject }
			finalizing = true
			state = 'paused'
			meterLevel = null
			emit()
			try {
				host.stop()
			} catch (cause) {
				fail(cause)
			}

			return promise
		},
		cancel,
		dispose() {
			if (disposed) {
				return
			}

			disposed = true
			abortPermission?.()
			void cancel()
			host?.dispose()
			listeners.clear()
		},
	}
}
