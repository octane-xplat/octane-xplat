import { useSyncExternalStore } from 'octane'
import type { AppState } from './types'
import { appKitActivitySource } from './appkit-state.macos'

export function useAppState(): AppState {
	const source = appKitActivitySource()
	return useSyncExternalStore(source.subscribe, source.getSnapshot)
}

/** Android hardware-back interception has no AppKit subscription. */
export function useBackHandler(_fn: () => boolean): void {}
