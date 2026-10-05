import type { Octane } from 'octane/jsx-runtime'
import type { OctaneNode } from 'octane'
import type { Klass, LexicalNode, LexicalNodeReplacement } from 'lexical'

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

/** Web-only extensions for the live Lexical composer. These options are ignored
 *  by native backends; caller plugins, custom nodes, transforms, and browser
 *  views require a separate native implementation. */
export interface LexicalWebOptions {
	/** Additional Lexical node classes or replacements. By default these are
	 *  added to the facade's built-in node set. Set `replaceNodes` to use this
	 *  list as the complete custom node registry instead. */
	nodes?: readonly (Klass<LexicalNode> | LexicalNodeReplacement)[]
	/** Replace the facade's built-in custom node registry with `nodes`. Core
	 *  Lexical nodes remain managed by Lexical. Defaults to `false`. */
	replaceNodes?: boolean
	/** Replace the default history, list, link, and autofocus plugins with the
	 *  plugin components supplied in `plugins`. Defaults to `false`. The rich
	 *  text surface and facade change/ref bindings remain installed. */
	replacePlugins?: boolean
	/** Additional Octane plugin components rendered inside the Lexical composer,
	 *  or the replacement plugin composition when `replacePlugins` is `true`.
	 *  Use a fragment when composing more than one plugin. */
	plugins?: OctaneNode
}

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
	 *  arrive. On native it waits for the doc-model modules and host
	 *  readiness (see `onJSONReady`); a doc that arrives early is applied
	 *  once both are up rather than dropped. */
	json?: LexicalJSON
	placeholder?: string
	editable?: boolean
	autofocus?: boolean
	onReady?: () => void
	/** Reports when serialized JSON access is available. Web and AppKit report
	 *  `true` when their live editor handle exists. Native reports whether its
	 *  lazy DOM-free conversion bridge loaded; unsupported runtimes report
	 *  `false` and JSON getters return `null`. */
	onJSONReady?: (ready: boolean) => void
	onChange?: (html: string) => void
	onJSONChange?: (doc: LexicalJSON) => void
	onSelectionChange?: (event: { start: number; end: number; active: LexicalFormat[] }) => void
	onFocus?: () => void
	onBlur?: () => void
	/** Web-only Lexical node and plugin composition. Ignored by native backends. */
	web?: LexicalWebOptions
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
