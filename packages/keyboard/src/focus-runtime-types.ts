import type { FocusedInputState } from '@octane-xplat/platform/focused-input-state'

/** @internal Platform-owned window resolution and observation. */
export interface FocusRuntime {
	activate(): () => void
	getSnapshot(host: object): FocusedInputState
	subscribe(host: object, listener: (state: FocusedInputState) => void): () => void
	recheck(host: object): void
}
