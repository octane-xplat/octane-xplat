import type { Insets } from './types'

/** AppKit content coordinates retain the existing desktop zero-inset contract. */
export function useSafeAreaInsets(): Insets {
	return { top: 0, right: 0, bottom: 0, left: 0 }
}
