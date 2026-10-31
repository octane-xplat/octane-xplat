/** Small CSS value tokenizers shared by the AppKit painters — GI-free. */

// Whitespace split that keeps parenthesized values (rgb()/hsl()/color-mix())
// whole — border, outline, background and box-shorthand tokenizing share it.
export function splitStyleTokens(text: string): string[] {
	const tokens: string[] = []
	let depth = 0
	let start = -1
	for (let i = 0; i <= text.length; i++) {
		const c = text[i]
		if (c === '(') {
			depth++
		} else if (c === ')') {
			depth = Math.max(0, depth - 1)
		}

		if (i === text.length || (depth === 0 && (c === ' ' || c === '\t' || c === '\n'))) {
			if (start >= 0) {
				tokens.push(text.slice(start, i))
				start = -1
			}
		} else if (start < 0) {
			start = i
		}
	}
	return tokens
}

// Comma split that keeps parenthesized color functions whole.
export function splitTopLevelCommas(text: string): string[] {
	const parts: string[] = []
	let depth = 0
	let start = 0
	for (let i = 0; i <= text.length; i++) {
		const c = text[i]
		if (c === '(') {
			depth++
		} else if (c === ')') {
			depth = Math.max(0, depth - 1)
		}

		if (i === text.length || (c === ',' && depth === 0)) {
			parts.push(text.slice(start, i).trim())
			start = i + 1
		}
	}
	return parts.filter(Boolean)
}
