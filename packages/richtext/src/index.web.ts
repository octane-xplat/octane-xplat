import type { RichTextEditorProps } from './types'

/** Whether this leaf has a working editor backend. */
export const supported: boolean = false

/** Web routes through @octane-xplat/tiptap — this leaf only exists for the
 *  native (Aztec) surface. */
export function RichTextEditor(_props: RichTextEditorProps): null {
	return null
}

export type * from './types'
