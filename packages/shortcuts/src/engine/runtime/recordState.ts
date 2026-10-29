import type { ShortcutEvent } from '../types/public.js'
import type {
	KeyEventType,
	RecordOptions,
	RecordingSession,
	ShortcutRecording,
} from '../types/public.js'
import type { NormalizedKeyEvent, ErrorInfo } from '../types/public.js'
import type { RecordingState } from '../types/internal.js'
import { parseBindingToken } from '../bindings/canonicalizeStep.js'
import type { ShortcutHost } from '../../host-types.js'

export class RecordStateController {
	private state: RecordingState | null = null

	constructor(privateHost: ShortcutHost) {
		this.host = privateHost
	}
	private host: ShortcutHost

	start(
		runtimeTarget: object,
		sequenceTimeout: number,
		options: RecordOptions | undefined,
	): RecordingSession {
		if (this.state) {
			throw new TypeError('A recording session is already active')
		}

		const eventType = options?.eventType ?? 'keydown'
		const timeout = options?.timeout ?? sequenceTimeout
		if (!Number.isFinite(timeout) || timeout <= 0) {
			throw new TypeError('Recording timeout must be a positive number of milliseconds')
		}
		const suppressHandlers = options?.suppressHandlers ?? true
		const consumeEvents = options?.consumeEvents ?? false
		const target = options?.target ?? runtimeTarget
		const onUpdate = options?.onUpdate

		let resolveFinished: ((recording: ShortcutRecording) => void) | null = null
		let rejectFinished: ((error: Error) => void) | null = null
		const finished = new Promise<ShortcutRecording>((resolve, reject) => {
			resolveFinished = resolve
			rejectFinished = reject
		})

		const finish = (recording: ShortcutRecording): void => {
			if (this.state !== state || state.settled) {
				return
			}
			this.clearTimer(this.state)
			this.state.settled = true
			this.state = null
			resolveFinished?.(recording)
		}

		const fail = (error: Error): void => {
			if (this.state !== state || state.settled) {
				return
			}
			this.clearTimer(this.state)
			this.state.settled = true
			this.state = null
			rejectFinished?.(error)
		}

		const state: RecordingState = {
			eventType,
			timeout,
			suppressHandlers,
			consumeEvents,
			target,
			steps: [],
			onUpdate,
			timer: null,
			settled: false,
			finish,
			fail,
		}
		this.state = state
		this.restartTimer(state)

		return {
			stop: () => {
				const recording = finalizeRecording(state.steps, eventType)
				state.finish(recording)
				return recording
			},
			cancel: () => {
				state.fail(createAbortError())
			},
			finished,
		}
	}

	handle(
		normalized: NormalizedKeyEvent,
		nativeEvent: ShortcutEvent,
		mutate: boolean,
		onError: ((error: unknown, info: ErrorInfo) => void) | undefined,
	): { intercepted: boolean } {
		const active = this.state
		if (!active) {
			return { intercepted: false }
		}
		if (this.host.boundaryDepth(active.target, nativeEvent) == null) {
			return { intercepted: false }
		}

		const maybeStep = normalized.type === active.eventType ? stepFromEvent(normalized) : null
		const captured = maybeStep != null

		if (captured && mutate) {
			active.steps.push(maybeStep)
			const recording = finalizeRecording(active.steps, active.eventType)
			this.restartTimer(active)
			try {
				active.onUpdate?.(recording)
			} catch (error) {
				if (onError) {
					onError(error, { phase: 'recording', event: normalized })
				} else {
					this.host.delay(() => {
						throw error
					}, 0)
				}
			}
		}

		if (captured && active.consumeEvents && mutate) {
			nativeEvent.preventDefault()
			nativeEvent.stopPropagation()
		}

		return { intercepted: active.suppressHandlers }
	}

	isRecording(): boolean {
		return this.state != null
	}

	dispose(): void {
		if (!this.state) {
			return
		}
		this.state.fail(createAbortError())
		this.state = null
	}

	private restartTimer(active: RecordingState): void {
		this.clearTimer(active)
		active.timer = this.host.delay(() => {
			const recording = finalizeRecording(active.steps, active.eventType)
			active.finish(recording)
		}, active.timeout)
	}

	private clearTimer(active: RecordingState): void {
		if (active.timer) {
			active.timer()
			active.timer = null
		}
	}
}

function stepFromEvent(event: NormalizedKeyEvent): string | null {
	const key = event.key
	if (parseBindingToken(key).type === 'modifier') {
		return null
	}
	const modifiers: string[] = []
	if (event.modifiers.ctrl) {
		modifiers.push('Ctrl')
	}
	if (event.modifiers.meta) {
		modifiers.push('Meta')
	}
	if (event.modifiers.alt) {
		modifiers.push('Alt')
	}
	if (event.modifiers.shift) {
		modifiers.push('Shift')
	}
	return [...modifiers, key].join('+')
}

function finalizeRecording(steps: readonly string[], eventType: KeyEventType): ShortcutRecording {
	const frozenSteps = Object.freeze([...steps]) as readonly string[]
	return Object.freeze({
		steps: frozenSteps,
		expression: frozenSteps.join(' '),
		eventType,
	})
}

function createAbortError(): Error {
	const error = new Error('Recording cancelled')
	error.name = 'AbortError'
	return error
}
