/** Traits used by the restricted native media-query evaluator. Sizes are dips. */
export interface NativeMediaTraits {
	width: number
	height: number
	coarse: boolean
	hover: boolean
}

/** Evaluate one `(feature: value)` term against explicit host traits. */
function evalTerm(
	term: string,
	traits: NativeMediaTraits,
): boolean {
	const negated = /^not\s+/i.test(term)
	const body = term
		.replace(/^not\s+/i, '')
		.trim()
		.replace(/^\(|\)$/g, '')
		.trim()

	const m = /^(max|min)-(width|height)\s*:\s*([0-9.]+)px$/i.exec(body)
	let result: boolean
	if (m) {
		const size = m[2].toLowerCase() === 'width' ? traits.width : traits.height
		result = m[1].toLowerCase() === 'max' ? size <= Number(m[3]) : size >= Number(m[3])
	} else {
		const feature = /^([a-z-]+)\s*:\s*([a-z-]+)$/i.exec(body)
		const name = (feature ? feature[1] : body).toLowerCase()
		const value = (feature?.[2] ?? '').toLowerCase()
		if (name === 'pointer' || name === 'any-pointer') {
			result = value === '' ? true : value === 'coarse' ? traits.coarse : value === 'fine' ? !traits.coarse : false
		} else if (name === 'hover' || name === 'any-hover') {
			result = value === '' || value === 'hover' ? traits.hover : value === 'none' ? !traits.hover : false
		} else if (name === 'orientation') {
			result = value === 'landscape' ? traits.width > traits.height : value === 'portrait' && traits.height >= traits.width
		} else if (name === 'width') {
			result = true
		} else if (name === 'height') {
			result = true
		} else {
			result = false
		}
	}

	return negated ? !result : result
}

export function evaluateNativeMediaQuery(query: string, traits: NativeMediaTraits): boolean {
	// Comma and `or` separate alternatives; each alternative requires every
	// `and` term. Nested groups and other CSS grammar are outside this subset.
	return query.split(/,|\s+or\s+/i).some((branch) => {
		const terms = branch.split(/\s+and\s+/i).map((term) => term.trim())
		return terms.every((term) => term.length > 0 && evalTerm(term, traits))
	})
}
