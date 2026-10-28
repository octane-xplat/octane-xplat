import { useMemo, useSyncExternalStore } from 'octane'
import { appKitHost } from './host-bridge'
import { createAppKitMediaQuerySource } from './media-query-source.macos'

/** AppKit media queries use the primary host window in dips, fine pointer
 * and hover traits. Supports the restricted native grammar; it does not
 * implement arbitrary CSS or per-secondary-window ownership. */
export function useMediaQuery(query: string): boolean {
	const host = appKitHost()
	const source = useMemo(() => createAppKitMediaQuerySource(query, host), [query, host])
	return useSyncExternalStore(source.subscribe, source.getSnapshot)
}
