import type { Octane } from 'octane/jsx-runtime'

/** Android uses WordPress Aztec; iOS uses AztecEditor-iOS; AppKit uses
 * StarterKit in WKWebView. Web/Windows use the tiptap facade instead of
 * this leaf. */
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
	/** AppKit: returns the latest WebKit snapshot; commands are asynchronous. */
	getHTML(): string
	/** Replace the document. Android resets Aztec history; the iOS
	 *  `setHTML` variant is likewise non-undoable; AppKit uses engine
	 *  history. */
	setHTML(html: string): void
	/** Toggle a format at the current selection. `link` needs
	 *  `linkTo(url, anchor)` instead. iOS has no taskList or text-alignment
	 *  engine support — those calls throw RangeError before changing
	 *  the document. apply('link') also throws; use linkTo instead. */
	apply(format: RichTextFormat): void
	/** Insert or re-target a link over the current selection. */
	linkTo(url: string, anchor?: string): void
	removeLink(): void
	/** Formats active at the selection — powers toolbar highlight state.
	 *  iOS always reports false for taskList and the align* formats (no
	 *  engine support). */
	isActive(format: RichTextFormat): boolean
	/** Android: Aztec's history batches keyboard input only — format
	 *  toggles and programmatic edits do not register. iOS: the engine
	 *  undoManager covers format toggles and keyboard input; `setHTML` and
	 *  split/join edits sit outside it. */
	undo(): void
	redo(): void
	/** Split the block at the caret into two siblings — the Enter-key
	 *  semantic (a non-collapsed selection is deleted first). Android: a
	 *  real block break through Aztec's watcher pipeline — a caret inside
	 *  a list item produces a sibling `<li>`. iOS routes through Aztec's
	 *  `insertText` newline handling for the same semantics. Inside hidden
	 *  block markup Aztec does not understand (`<div data-*>` wrappers),
	 *  this is a line break, not a new node — it serializes as `<br>`.
	 *  Returns false when
	 *  there is no valid selection. AppKit: returns false — the engine
	 *  transport is asynchronous and cannot report application. */
	split(): boolean
	/** Merge the block at the caret into the previous block — the
	 *  Backspace-at-block-start semantic. Returns false unless the
	 *  selection is a collapsed caret directly after a block boundary. */
	join(): boolean
	/** Demote the block(s) in the selection. Aztec semantics: a list item
	 *  nests under its previous sibling; a plain paragraph, heading,
	 *  quote, or preformat line gains a literal `\t` indent. Hidden
	 *  `<div data-*>` nodes are opaque to Aztec and cannot be demoted.
	 *  iOS: `increaseIndent` acts on list/quote depth and falls back to a
	 *  `\t` insert on plain blocks. Returns false when Aztec reports no
	 *  indentable selection (iOS: when the view is not editable). */
	indent(): boolean
	/** Promote the block(s) in the selection one level — the inverse of
	 *  `indent()`. iOS has no plain-block outdent, so this applies only to
	 *  list items and blockquotes. Returns false when Aztec reports no
	 *  outdentable selection. */
	outdent(): boolean
	/** Whether `indent()` can apply to the current selection. */
	canIndent(): boolean
	/** Whether `outdent()` can apply to the current selection. */
	canOutdent(): boolean
	focus(): void
	blur(): void
	isFocused(): boolean
	/** The platform surface — `AztecText` on Android, the
	 *  `XplatAztecEditorView` facade on iOS. */
	/** AppKit: the XplatEditorHost transport, not the browser engine instance. */
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
