import { evaluateNativeMediaQuery } from './media-query-native'

/** @internal The subset of the AppKit host used by responsive hooks. */
export interface AppKitMediaQueryHost {
	readonly windowSize?: { width: number; height: number }
	onWindowResize?: (notify: () => void) => () => void
}

/** @internal Snapshot only the match boolean: the host may allocate a fresh
 * window-size object on each read, which is not a stable external snapshot. */
export function createAppKitMediaQuerySource(query: string, host?: AppKitMediaQueryHost) {
	return {
		subscribe: (notify: () => void) => host?.onWindowResize?.(notify) ?? (() => {}),
		getSnapshot: (): boolean => {
			const size = host?.windowSize
			if (!size) return false
			return evaluateNativeMediaQuery(query, {
				width: size.width,
				height: size.height,
				coarse: false,
				hover: true,
			})
		},
	}
}
