import type { LexicalEditorProps } from './types'

export const supported = false

/** AppKit host has no rich-text surface yet. */
export function LexicalEditor(_props: LexicalEditorProps): null {
	return null
}

export type * from './types'

/** No editor, no bridge. */
export function ensureJSONBridge(): Promise<boolean> {
	return Promise.resolve(false)
}

export function jsonBridgeReady(): boolean {
	return false
}
