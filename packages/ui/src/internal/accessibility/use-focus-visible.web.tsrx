import { useSyncExternalStore } from 'octane'
import type { UseFocusVisibleResult } from './use-focus-visible.tsrx'

/**
 * Global focus-modality tracking — React Aria's useFocusVisible. Reports
 * keyboard, pointer, or unknown modality plus whether a ring should show.
 * Module state is shared like store.ts — every reader subscribes via
 * useSyncExternalStore.
 */

type FocusVisibleState = Pick<UseFocusVisibleResult, 'isFocusVisible' | 'inputModality'>

let state: FocusVisibleState = { isFocusVisible: false, inputModality: 'unknown' }
let attached = false
const listeners = new Set<() => void>()

const set = (next: FocusVisibleState) => {
	if (next.isFocusVisible === state.isFocusVisible && next.inputModality === state.inputModality) {
		return
	}

	state = next
	for (const listener of [...listeners]) {
		listener()
	}
}

const onKeyDown = (event: KeyboardEvent) => {
	if (!event.metaKey && !event.altKey && !event.ctrlKey) {
		set({ isFocusVisible: true, inputModality: 'keyboard' })
	}
}

const onPointer = () => set({ isFocusVisible: false, inputModality: 'pointer' })
const onWindowBlur = () => set({ isFocusVisible: false, inputModality: 'unknown' })

const attach = () => {
	if (attached || typeof window === 'undefined') {
		return
	}

	attached = true
	window.addEventListener('keydown', onKeyDown, true)
	window.addEventListener('pointerdown', onPointer, true)
	window.addEventListener('mousedown', onPointer, true)
	window.addEventListener('blur', onWindowBlur, true)
}

const subscribe = (notify: () => void) => {
	attach()
	listeners.add(notify)
	return () => {
		listeners.delete(notify)
	}
}

export type { FocusInputModality, UseFocusVisibleResult } from './use-focus-visible.tsrx'

export function useFocusVisible(): UseFocusVisibleResult {
	attach()
	return { ...useSyncExternalStore(subscribe, () => state), isSupported: true }
}

/** Non-hook read for render paths that already subscribe elsewhere. */
export function isFocusVisible(): boolean {
	attach()
	return state.isFocusVisible
}
