import type { RichTextEditorProps } from './types'

export const supported = false

/** Web routes through @octane-xplat/tiptap — this leaf only exists for the
 *  native (Aztec) surface. */
export function RichTextEditor(_props: RichTextEditorProps): null {
	return null
}

export type * from './types'
