export interface ChatKeyboardOptions {
	keyboardFollow?: 'never' | 'always' | 'when-at-end'
	bottomPanelHeight?: number
	safeBottom?: number
	ancestorWindow?: object
	ancestorBottom?: number
	external?: boolean
}

export type ChatKeyboardBinding = (() => void) & { update(): void }

export function checkChatPanelHeight(value = 0): number {
	if (!Number.isFinite(value) || value < 0) {
		throw new RangeError('Chat bottomPanelHeight must be finite and nonnegative')
	}
	return value
}
