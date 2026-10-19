import type { KeyboardWindowState } from '@octane-xplat/platform/keyboard-state'

/** @internal Platform adapter; shared policy never reads SDK or DOM objects. */
export interface KeyboardRuntime {
	activate(): () => void
	subscribe(host: object, listener: (state: KeyboardWindowState) => void): () => void
	getSnapshot(host: object): KeyboardWindowState
	property(host: object): { read(): number; write(value: number): void } | null
	overlap(host: object, state: KeyboardWindowState, translationY: number): number
}
