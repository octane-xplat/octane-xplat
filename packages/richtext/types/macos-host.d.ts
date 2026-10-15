import type { RichTextEditorProps } from './types.js'
/** Internal shared editor host. */
export declare function NativeEditor(
	props: RichTextEditorProps & {
		browser: string
		// Lexical/Tiptap forward their own handle refs — the host just passes
		// the value through, so it accepts any ref shape.
		ref?: any
		json?: any
		onJSONReady?: (ok: boolean) => void
		onJSONChange?: (doc: any) => void
	},
): unknown
