import type { PanEvent } from '../../props'

/** GTK already dispatches the shared logical-pixel gesture payload. */
export function usePan(cb?: (event: PanEvent) => void): ((event: any) => void) | undefined {
	return cb
}
