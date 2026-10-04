/** @jsxImportSource @nativescript-community/octane */
import type { RichTextEditorProps } from './types'

export const supported = false

/** Windows bring-up is deferred — renders the placeholder so a shared
 *  screen still mounts. */
export function RichTextEditor(props: RichTextEditorProps) @{
	<label
		id={props.id}
		className={props.className}
		style={props.style}
		text="Rich text editing is not supported on Windows yet."
	/>;
}
