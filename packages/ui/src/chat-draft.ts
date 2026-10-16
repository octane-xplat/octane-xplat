import type {
	ChatComposerDraft,
	ChatComposerDraftData,
	ChatComposerToken,
	ChatComposerTokenBadge,
	ChatComposerTokenData,
	Renderable,
} from './props'

/** Convert a runtime token into plain JSON. `render` functions are dropped. */
export function serializeChatComposerToken(token: ChatComposerToken): ChatComposerTokenData {
	if ('render' in token && typeof token.render === 'function') {
		return { kind: 'custom', value: token.value }
	}

	const badge = token as ChatComposerTokenBadge
	return {
		kind: 'badge',
		value: badge.value,
		label: typeof badge.label === 'string' ? badge.label : undefined,
		variant: badge.variant,
		icon: badge.icon,
	}
}

/** Restore a token from its JSON form. Custom tokens recover their renderer
 *  from an optional `renderers` lookup; otherwise they render their value. */
export function deserializeChatComposerToken(
	data: ChatComposerTokenData,
	renderers?: Record<string, () => Renderable>,
): ChatComposerToken {
	if (data.kind === 'custom') {
		return {
			value: data.value,
			render: renderers?.[data.value] ?? (() => data.value),
		}
	}

	return {
		value: data.value,
		label: data.label,
		variant: data.variant,
		icon: data.icon,
	}
}

/** Reduce a draft to JSON-ready data. */
export function serializeChatComposerDraft(draft: ChatComposerDraft): ChatComposerDraftData {
	return {
		text: draft.text,
		tokens: draft.tokens.map(serializeChatComposerToken),
	}
}

/** Restore a draft from JSON data. */
export function deserializeChatComposerDraft(
	data: ChatComposerDraftData,
	renderers?: Record<string, () => Renderable>,
): ChatComposerDraft {
	return {
		text: data.text,
		tokens: data.tokens.map((t) => deserializeChatComposerToken(t, renderers)),
	}
}

/** Build a draft from plain text and an optional token table. */
export function createChatComposerDraft(
	text = '',
	tokens: ChatComposerToken[] = [],
): ChatComposerDraft {
	return { text, tokens }
}
