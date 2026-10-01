/** @jsxImportSource @nativescript-community/octane */
import type { RichTextEditorProps } from './types'

export const supported = false

/** iOS bring-up is deferred — the Swift facade over Aztec-iOS lands in a
 *  follow-up. Renders the placeholder so a shared screen still mounts. */
export function RichTextEditor(props: RichTextEditorProps) @{
	<label
		id={props.id}
		className={props.className}
		style={props.style}
		text="Rich text editing is not supported on iOS yet."
	/>;
}
