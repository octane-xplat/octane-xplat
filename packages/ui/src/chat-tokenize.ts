import type { ChatComposerToken } from './props'

export type ChatTextPart =
	| { kind: 'text'; text: string }
	| { kind: 'token'; token: ChatComposerToken; index: number }

function escapeRegExp(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Split serialized message text into text runs and token parts, matching
 *  upstream's literal-value scan: each non-empty token `value` is matched
 *  literally; empty values are ignored; first longest match wins per
 *  position (alternation order follows the tokens array). */
export function tokenizeChatText(text: string, tokens: ChatComposerToken[]): ChatTextPart[] {
	const matchable = tokens.filter((t) => t.value.length > 0)
	if (!text || matchable.length === 0) {return [{ kind: 'text', text }]}

	const pattern = matchable.map((t) => escapeRegExp(t.value)).join('|')
	const regex = new RegExp(`(${pattern})`, 'g')
	const byValue = new Map(matchable.map((t) => [t.value, t]))

	const parts: ChatTextPart[] = []
	let lastIndex = 0
	let match: RegExpExecArray | null
	while ((match = regex.exec(text)) !== null) {
		if (match.index > lastIndex) {
			parts.push({ kind: 'text', text: text.slice(lastIndex, match.index) })
		}

		const token = byValue.get(match[0])
		if (token) {parts.push({ kind: 'token', token, index: match.index })}
		lastIndex = match.index + match[0].length
	}

	if (lastIndex < text.length) {
		parts.push({ kind: 'text', text: text.slice(lastIndex) })
	}

	return parts
}
