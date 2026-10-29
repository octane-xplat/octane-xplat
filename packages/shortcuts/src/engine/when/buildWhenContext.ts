import type { NormalizedKeyEvent } from '../types/public.js'
import type { Platform } from '../types/internal.js'

export function buildWhenContext(
	userContext: Record<string, unknown>,
	normalized: NormalizedKeyEvent | undefined,
	activeScopes: readonly string[],
	matchedScope: string,
	platform: Platform,
	recording: boolean,
): Record<string, unknown> {
	return {
		context: userContext,
		event: {
			key: normalized?.key,
			code: normalized?.code,
			repeat: normalized?.repeat ?? false,
			composing: normalized?.composing ?? false,
			alt: normalized?.modifiers.alt ?? false,
			ctrl: normalized?.modifiers.ctrl ?? false,
			meta: normalized?.modifiers.meta ?? false,
			shift: normalized?.modifiers.shift ?? false,
		},
		scope: {
			active: [...activeScopes],
			matched: matchedScope,
		},
		runtime: {
			platform,
			recording,
		},
		...userContext,
	}
}
