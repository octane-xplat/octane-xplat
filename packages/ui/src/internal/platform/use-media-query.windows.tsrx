import { useEffect, useState } from 'octane'
import {
	matchesWindowsMediaQuery,
	observeWindowsMediaTraits,
	readWindowsMediaTraits,
} from './media-query-host'

/**
 * Windows candidate for the native media-query subset: DIP dimensions,
 * orientation, sampled pointer/hover capabilities and animation preferences. Primary input prefers
 * mouse, then pen, then touch. Updates on window layout, resize and resume;
 * live input-device/settings changes and actual WinRT delivery remain unqualified.
 * Unknown capabilities and unsupported features do not match, even under not.
 *
 * @example
 * // In a compiled .tsx/.tsrx module:
 * import { useMediaQuery } from '@octane-xplat/ui'
 * export function useCompactTouchLayout() {
 *   return useMediaQuery('(max-width: 1024px) and (pointer: coarse) and (hover: none)')
 * }
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(() =>
		matchesWindowsMediaQuery(query, readWindowsMediaTraits()),
	)

	useEffect(() => {
		const update = () => setMatches(matchesWindowsMediaQuery(query, readWindowsMediaTraits()))
		const release = observeWindowsMediaTraits(update)
		update()
		return release
	}, [query])

	return matches
}
