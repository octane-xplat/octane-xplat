import { Application, Screen } from '@nativescript/core'
import { useEffect, useState } from 'octane'

import { evaluateNativeMediaQuery } from './media-query-native'

function evaluate(query: string): boolean {
	return evaluateNativeMediaQuery(query, {
		width: Screen.mainScreen.widthDIPs,
		height: Screen.mainScreen.heightDIPs,
		coarse: true,
		hover: false,
	})
}

/** `useMediaQuery` (Astryx), iOS/Android leaf — evaluates a restricted
 *  media-query grammar (`(max|min)-(width|height)`, `pointer`, `any-pointer`,
 *  `hover`, `any-hover`, `orientation`, `and`/`or`/`,`/`not`) against the
 *  main screen and fixed touch traits, re-evaluating on orientation change.
 *  Unsupported features evaluate to `false` — record gaps, don't guess. */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(() => evaluate(query))
	useEffect(() => {
		const update = () => setMatches(evaluate(query))
		update()
		Application.on('orientationChanged', update)
		return () => Application.off('orientationChanged', update)
	}, [query])

	return matches
}
