import type { Octane } from 'octane/jsx-runtime'

/** Format vocabulary shared by the web (lexical core + registered nodes)
 *  and native (Aztec) backends. On web, `taskList`/`highlight`/`subscript`/
 *  `superscript` are only active when their nodes are registered — the
 *  default node set doesn't include them, so they no-op there and map to
 *  Aztec formats on Android. */
export type LexicalFormat =
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

/** Lexical serialized editor state (`{ root: { children: [...] } }` — the
 *  `EditorState.toJSON()` shape). Opaque here — callers round-trip through
 *  lexical's own schema on both platforms. */
export type LexicalJSON = { root: Record<string, unknown> } & Record<string, unknown>

export interface LexicalEditorHandle {
	/** AppKit: returns the latest WebKit snapshot; commands are asynchronous. */
	getHTML(): string
	/** Web: `setEditorState` inside an update (undo-aware). Native: Aztec
	 *  `fromHtml` — resets undo history. */
	setHTML(html: string): void
	/** Serialized editor state, or null while the native doc-model modules
	 *  are still loading / on a runtime that can't host them (`onJSONReady`
	 *  reports the outcome). Web is always ready. */
	/** AppKit: latest live engine JSON snapshot; null before onReady. */
	getJSON(): LexicalJSON | null
	setJSON(doc: LexicalJSON): void
	apply(format: LexicalFormat): void
	linkTo(url: string, anchor?: string): void
	removeLink(): void
	isActive(format: LexicalFormat): boolean
	undo(): void
	redo(): void
	focus(): void
	blur(): void
	isFocused(): boolean
	/** The platform surface — the lexical `LexicalEditor` on web,
	 *  `AztecText` on Android. */
	/** AppKit: the XplatEditorHost transport, not the browser engine instance. */
	native: any
}

export interface LexicalEditorProps {
	id?: string
	className?: string
	style?: any
	/** Document HTML. Seed at mount; external changes re-push. */
	value?: string
	/** Serialized editor state. Takes precedence over `value` when both
	 *  arrive. On native it waits for the doc-model modules (see
	 *  `onJSONReady`). */
	json?: LexicalJSON
	placeholder?: string
	editable?: boolean
	autofocus?: boolean
	onReady?: () => void
	/** Fires once when the native lexical bridge settles — `true` if the
	 *  DOM-free lexical modules loaded, `false` on runtimes that can't host
	 *  them (JSON calls then no-op / return null). Never fires on web. */
	/** AppKit: fires true with mounted engine readiness; no headless conversion bridge. */
	onJSONReady?: (ready: boolean) => void
	onChange?: (html: string) => void
	onJSONChange?: (doc: LexicalJSON) => void
	onSelectionChange?: (event: { start: number; end: number; active: LexicalFormat[] }) => void
	onFocus?: () => void
	onBlur?: () => void
	ref?: Octane.Ref<LexicalEditorHandle>
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
