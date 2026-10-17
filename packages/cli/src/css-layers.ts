function skipComment(css, index) {
	const end = css.indexOf('*/', index + 2)
	return end < 0 ? css.length : end + 2
}

function skipString(css, index) {
	const quote = css[index]
	for (let i = index + 1; i < css.length; i++) {
		if (css[i] === '\\') {
			i++
		} else if (css[i] === quote) {
			return i + 1
		}
	}

	return css.length
}

function atRuleDelimiter(css, index) {
	let parentheses = 0
	for (let i = index; i < css.length; i++) {
		if (css.startsWith('/*', i)) {
			i = skipComment(css, i) - 1
		} else if (css[i] === '"' || css[i] === "'") {
			i = skipString(css, i) - 1
		} else if (css[i] === '(') {
			parentheses++
		} else if (css[i] === ')') {
			parentheses = Math.max(0, parentheses - 1)
		} else if (parentheses === 0 && (css[i] === ';' || css[i] === '{')) {
			return { index: i, token: css[i] }
		} else if (parentheses === 0 && css[i] === '}') {
			return null
		}
	}

	return null
}

function matchingBrace(css, open) {
	let depth = 1
	for (let i = open + 1; i < css.length; i++) {
		if (css.startsWith('/*', i)) {
			i = skipComment(css, i) - 1
		} else if (css[i] === '"' || css[i] === "'") {
			i = skipString(css, i) - 1
		} else if (css[i] === '{') {
			depth++
		} else if (css[i] === '}' && --depth === 0) {
			return i
		}
	}

	return -1
}

/** NativeScript has no cascade-layer model; retain the rules and drop only their wrappers. */
export function unwrapCssLayers(css) {
	let output = ''
	let copiedThrough = 0
	for (let i = 0; i < css.length; i++) {
		if (css.startsWith('/*', i)) {
			i = skipComment(css, i) - 1
			continue
		}

		if (css[i] === '"' || css[i] === "'") {
			i = skipString(css, i) - 1
			continue
		}

		if (!css.startsWith('@layer', i) || /[\w-]/.test(css[i + 6] ?? '')) {
			continue
		}

		const delimiter = atRuleDelimiter(css, i + 6)
		if (!delimiter) {
			continue
		}

		output += css.slice(copiedThrough, i)
		if (delimiter.token === ';') {
			i = delimiter.index
			copiedThrough = i + 1
			continue
		}

		const close = matchingBrace(css, delimiter.index)
		if (close < 0) {
			throw new Error('Unclosed @layer block in NativeScript stylesheet')
		}

		output += unwrapCssLayers(css.slice(delimiter.index + 1, close))
		i = close
		copiedThrough = close + 1
	}

	return output + css.slice(copiedThrough)
}
