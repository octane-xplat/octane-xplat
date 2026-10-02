import type { Octane } from 'octane/jsx-runtime'

/** Supported on Android today (WordPress Aztec); iOS is stubbed until the
 *  Swift-facade bring-up. Web/macOS/Windows route through the tiptap facade
 *  instead of this leaf. */
export type RichTextFormat =
	| 'bold'
	| 'italic'
	| 'underline'
	| 'strikethrough'
	| 'code'
	| 'blockquote'
	| 'bulletList'
	| 'orderedList'
	| 'taskList'
	| 'codeBlock'
	| 'horizontalRule'
	| 'highlight'
	| 'subscript'
	| 'superscript'
	| 'paragraph'
	| 'heading1'
	| 'heading2'
	| 'heading3'
	| 'heading4'
	| 'heading5'
	| 'heading6'
	| 'alignLeft'
	| 'alignCenter'
	| 'alignRight'
	| 'link'

export interface RichTextEditorHandle {
	/** Serialized document HTML (Aztec's "plain" HTML — no contenteditable
	 *  markup). */
	getHTML(): string
	/** Replace the document; resets Aztec's undo history. */
	setHTML(html: string): void
	/** Toggle a format at the current selection. `link` needs
	 *  `linkTo(url, anchor)` instead. */
	apply(format: RichTextFormat): void
	/** Insert or re-target a link over the current selection. */
	linkTo(url: string, anchor?: string): void
	removeLink(): void
	/** Formats active at the selection — powers toolbar highlight state. */
	isActive(format: RichTextFormat): boolean
	/** Android: Aztec's history batches keyboard input only — format
	 *  toggles and programmatic edits do not register. */
	undo(): void
	redo(): void
	focus(): void
	blur(): void
	isFocused(): boolean
	/** The platform surface — `AztecText` on Android. */
	native: any
}

export interface RichTextSelectionChange {
	start: number
	end: number
	/** Formats active at the caret/range, in facade spellings. */
	active: RichTextFormat[]
}

export interface RichTextEditorProps {
	id?: string
	className?: string
	style?: any
	/** Initial document HTML. Re-applied only when the string changes
	 *  externally — text the editor emitted back through `onChange` is never
	 *  re-pushed, so typing doesn't reparse the document. */
	value?: string
	placeholder?: string
	editable?: boolean
	autofocus?: boolean
	onReady?: () => void
	onChange?: (html: string) => void
	onSelectionChange?: (event: RichTextSelectionChange) => void
	onFocus?: () => void
	onBlur?: () => void
	/** Imperative handle — fires once when the native editor exists. */
	ref?: Octane.Ref<RichTextEditorHandle>
	/** Per-platform escape bag — properties are assigned onto the native
	 *  `AztecText` after the leaf's own props. */
	android?: Record<string, any>
	ios?: Record<string, any>
	// NativeScript layout-child attributes the driver reads on this element.
	row?: number | string
	col?: number | string
	rowSpan?: number
	colSpan?: number
	dock?: 'left' | 'top' | 'right' | 'bottom'
	left?: number
	top?: number
	flexGrow?: number
	flexShrink?: number
	alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
	order?: number
}
