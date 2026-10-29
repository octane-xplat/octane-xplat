import { useEffect, useState } from 'octane'

/** `useMediaQuery` (Astryx), web leaf — evaluates a CSS media query against
 *  `window.matchMedia` and subscribes to changes. Returns `false` when
 *  `matchMedia` is unavailable (SSR/harness). */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(() =>
		typeof window !== 'undefined' && typeof window.matchMedia === 'function'
			? window.matchMedia(query).matches
			: false,
	)

	useEffect(() => {
		if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
			setMatches(false)
			return
		}

		const mql = window.matchMedia(query)
		const update = () => setMatches(mql.matches)
		update()
		mql.addEventListener?.('change', update)
		return () => mql.removeEventListener?.('change', update)
	}, [query])

	return matches
}
