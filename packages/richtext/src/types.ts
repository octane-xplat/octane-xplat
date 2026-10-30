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

/** Imperative handle exposed through the editor `ref`. */
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
	/** Strip the link covering the current selection. */
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
	/** Redo the last undone edit. */
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
	/** Programmatically focus the editor. */
	focus(): void
	/** Programmatically blur the editor. */
	blur(): void
	/** Whether the editor currently has focus. */
	isFocused(): boolean
	/** The platform surface — `AztecText` on Android, the
	 *  `XplatAztecEditorView` facade on iOS. */
	/** AppKit: the XplatEditorHost transport, not the browser engine instance. */
	native: any
}

/** Selection range change payload — character offsets. */
export interface RichTextSelectionChange {
	/** Selection anchor offset in characters. */
	start: number
	/** Selection extent offset in characters. */
	end: number
	/** Formats active at the caret/range, in facade spellings. */
	active: RichTextFormat[]
}

/** Props for the editor element. */
export interface RichTextEditorProps {
	/** Element id passed through to the host element. */
	id?: string
	/** Class list applied to the editor element. */
	className?: string
	/** Inline style (string CSS or object). */
	style?: any
	/** Initial document HTML. Re-applied only when the string changes
	 *  externally — text the editor emitted back through `onChange` is never
	 *  re-pushed, so typing doesn't reparse the document. */
	value?: string
	/** Empty-state hint text. */
	placeholder?: string
	/** Read-write vs read-only. @default true */
	editable?: boolean
	/** Focus the editor on mount. @default false */
	autofocus?: boolean
	/** Fires once the editor engine is ready for commands. */
	onReady?: () => void
	/** Fires on each content edit — not on selection moves. */
	onChange?: (html: string) => void
	/** Fires when the selection/focus range moves. */
	onSelectionChange?: (event: RichTextSelectionChange) => void
	/** Editor gained focus. */
	onFocus?: () => void
	/** Editor lost focus. */
	onBlur?: () => void
	/** Imperative handle — fires once when the native editor exists. */
	ref?: Octane.Ref<RichTextEditorHandle>
	/** Per-platform escape bag — properties are assigned onto the native
	 *  `AztecText` after the leaf's own props. */
	android?: Record<string, any>
	/** Platform escape hatch (native editor props). */
	ios?: Record<string, any>
	// NativeScript layout-child attributes the driver reads on this element.
	/** Zero-based row index in the parent grid. */

	row?: number | string
	/** Zero-based column index in the parent grid. */
	col?: number | string
	/** Row tracks to span (>= 1). */
	rowSpan?: number
	/** Column tracks to span (>= 1). */
	colSpan?: number
	/** Edge of the parent dock layout this child pins to. */
	dock?: 'left' | 'top' | 'right' | 'bottom'
	/** Absolute x offset in dips inside an absolute-layout parent. */
	left?: number
	/** Absolute y offset in dips inside an absolute-layout parent. */
	top?: number
	/** Flex grow factor along the parent main axis. */
	flexGrow?: number
	/** Flex shrink factor along the parent main axis. */
	flexShrink?: number
	/** Cross-axis alignment override for this child. */
	alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
	/** Sibling ordering — lower orders lay out first. */
	order?: number
}
