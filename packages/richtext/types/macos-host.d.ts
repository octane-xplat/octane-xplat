import type { UniversalComponent } from 'octane/universal'
import type { RichTextEditorProps } from '../src/types'
/** Internal shared editor host. */
export declare const NativeEditor: UniversalComponent<
	RichTextEditorProps & {
		browser: string
		// Lexical/Tiptap forward their own handle refs — the host just passes
		// the value through, so it accepts any ref shape.
		ref?: any
		json?: any
		onJSONReady?: (ok: boolean) => void
		onJSONChange?: (doc: any) => void
	}
>
