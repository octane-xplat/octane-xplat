/** Format vocabulary shared by the web (tiptap StarterKit) and native
 *  (Aztec) backends. On web, starter-kit covers everything except
 *  taskList/highlight/subscript/superscript/align* — those no-op there and
 *  map to Aztec formats on Android. */
export type TiptapFormat =
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

/** Tiptap document JSON (`{ type: 'doc', content: [...] }`). Opaque here —
 *  callers round-trip through tiptap's own schema on both platforms. */
export type TiptapJSON = { type: string; content?: unknown[] } & Record<string, unknown>

export interface TiptapEditorHandle {
	getHTML(): string
	/** Web: `commands.setContent` (undo-aware). Native: Aztec `fromHtml` —
	 *  resets undo history. */
	setHTML(html: string): void
	/** Doc JSON, or null while the native schema modules are still loading /
	 *  on a runtime that can't host them (`json` flag). Web is always ready. */
	getJSON(): TiptapJSON | null
	setJSON(doc: TiptapJSON): void
	apply(format: TiptapFormat): void
	linkTo(url: string, anchor?: string): void
	removeLink(): void
	isActive(format: TiptapFormat): boolean
	undo(): void
	redo(): void
	focus(): void
	blur(): void
	isFocused(): boolean
	/** The platform surface — a tiptap `Editor` on web, `AztecText` on
	 *  Android. */
	native: any
}

export interface TiptapEditorProps {
	id?: string
	className?: string
	style?: any
	/** Document HTML. Seed at mount; external changes re-push (web: via
	 *  setContent, preserving the diff loop the editor emitted is skipped). */
	value?: string
	/** Document JSON. Takes precedence over `value` when both arrive. On
	 *  native it waits for the schema modules (see `onJSONReady`). */
	json?: TiptapJSON
	placeholder?: string
	editable?: boolean
	autofocus?: boolean
	onReady?: () => void
	/** Fires once when the native JSON bridge settles — `true` if the
	 *  DOM-free tiptap modules loaded, `false` on runtimes that can't host
	 *  them (JSON calls then no-op / return null). Never fires on web. */
	onJSONReady?: (ready: boolean) => void
	onChange?: (html: string) => void
	onJSONChange?: (doc: TiptapJSON) => void
	onSelectionChange?: (event: { start: number; end: number; active: TiptapFormat[] }) => void
	onFocus?: () => void
	onBlur?: () => void
	bind?: (handle: TiptapEditorHandle) => void
	android?: Record<string, any>
	ios?: Record<string, any>
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
