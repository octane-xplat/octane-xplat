import { useSyncExternalStore } from 'octane'
import type { WindowSize } from './types'
import { appKitWindowSource } from './appkit-state.macos'

/** Primary AppKit host-window content size. Treat the snapshot as immutable. */
export function useWindowSize(): WindowSize {
	const source = appKitWindowSource()
	return useSyncExternalStore(source.subscribe, source.getSnapshot)
}
