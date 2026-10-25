import { Application, Screen } from '@nativescript/core'
import { useEffect, useState } from 'octane'

/** Evaluate one `(feature: value)` term against host traits. Width/height
 *  resolve against the main screen in dips (an approximation of the app
 *  window — split-screen windows are not distinguished). */
function evalTerm(term: string, traits: { width: number; height: number; coarse: boolean; hover: boolean }): boolean {
	const negated = /^not\s+/i.test(term)
	const body = term.replace(/^not\s+/i, '').trim().replace(/^\(|\)$/g, '').trim()
	const m = /^(max|min)-(width|height)\s*:\s*([0-9.]+)px$/i.exec(body)
	let result: boolean
	if (m) {
		const size = m[2].toLowerCase() === 'width' ? traits.width : traits.height
		result = m[1].toLowerCase() === 'max' ? size <= Number(m[3]) : size >= Number(m[3])
	} else {
		const feature = /^([a-z-]+)\s*:\s*([a-z-]+)$/i.exec(body)
		const name = (feature ? feature[1] : body).toLowerCase()
		const value = (feature?.[2] ?? '').toLowerCase()
		if (name === 'pointer') result = value === 'none' ? false : (value === 'coarse') === traits.coarse
		else if (name === 'any-pointer') result = value === 'none' ? false : (value === 'coarse') === traits.coarse
		else if (name === 'hover') result = (value === 'hover' || value === '') === traits.hover
		else if (name === 'any-hover') result = (value === 'hover' || value === '') === traits.hover
		else if (name === 'orientation') result = value === 'landscape' ? traits.width > traits.height : traits.height >= traits.width
		else if (name === 'width') result = true
		else if (name === 'height') result = true
		else result = false
	}
	return negated ? !result : result
}

function evaluate(query: string): boolean {
	const traits = {
		width: Screen.mainScreen.widthDIPs,
		height: Screen.mainScreen.heightDIPs,
		coarse: true, // iOS/Android are coarse-pointer, no-hover surfaces
		hover: false,
	}
	// ',' is top-level OR; 'and' chains inside a term list; 'or' behaves as OR.
	return query.split(',').some((branch) => {
		const terms = branch.split(/\s+and\s+|\s+or\s+/i).map((t) => t.trim()).filter(Boolean)
		const joiner = /\s+or\s+/i.test(branch) ? 'or' : 'and'
		const results = terms.map((t) => evalTerm(t, traits))
		return joiner === 'or' ? results.some(Boolean) : results.every(Boolean)
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
