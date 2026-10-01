import type { RichTextEditorProps } from './types'

export const supported = false

/** The macOS editor is deferred; the tiptap facade covers desktop needs. */
export function RichTextEditor(_props: RichTextEditorProps): null {
	return null
}

export type * from './types'
