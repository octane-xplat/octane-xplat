/** Fences every asynchronous permission, preview and shutter result — the
 *  PhotoCaptureLifecycle state machine, now plain JS. */
export type Phase = 'idle' | 'preparing' | 'preview' | 'capturing' | 'finished'
const Phase: Record<Phase, Phase> = {
	idle: 'idle',
	preparing: 'preparing',
	preview: 'preview',
	capturing: 'capturing',
	finished: 'finished',
}

export function createPhotoCaptureLifecycle() {
	let phase: Phase = Phase.idle
	let generation = 0
	return {
		get phase(): Phase {
			return phase
		},
		prepare(): number | null {
			if (phase !== Phase.idle) {
				return null
			}
			phase = Phase.preparing
			return generation
		},
		ready(token: number): boolean {
			if (!this.accepts(token) || phase !== Phase.preparing) {
				return false
			}
			phase = Phase.preview
			return true
		},
		capture(): number | null {
			if (phase !== Phase.preview) {
				return null
			}
			phase = Phase.capturing
			return generation
		},
		accepts(token: number): boolean {
			return phase !== Phase.finished && token === generation
		},
		finish(): boolean {
			if (phase === Phase.finished) {
				return false
			}
			phase = Phase.finished
			generation += 1
			return true
		},
	}
}

export type PhotoCaptureLifecycle = ReturnType<typeof createPhotoCaptureLifecycle>
