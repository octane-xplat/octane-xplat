import type { Octane } from 'octane/jsx-runtime'
import type { OctaneNode } from 'octane'
import type { Klass, LexicalNode, LexicalNodeReplacement } from 'lexical'

/** Format vocabulary shared by web Lexical and native Aztec. Web defaults
 * include checklist and horizontal-rule plugins; highlight/sub/superscript
 * are core text formats. iOS lacks task lists and alignment. apply('link')
 * requires linkTo instead; unsupported native requests throw RangeError. */
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
	/** Replace the default history, list, checklist, horizontal-rule, link, and autofocus plugins with the
	 *  plugin components supplied in `plugins`. Defaults to `false`. The rich
	 *  text surface and facade change/ref bindings remain installed. */
	replacePlugins?: boolean
	/** Additional Octane plugin components rendered inside the Lexical composer,
	 *  or the replacement plugin composition when `replacePlugins` is `true`.
	 *  Use a fragment when composing more than one plugin. */
	plugins?: OctaneNode
}

/** Imperative handle exposed through the editor `ref`. */
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
	/** Replace the document with a serialized JSON string. */
	setJSON(doc: LexicalJSON): void
	/** Toggle a format supported by the mounted backend. Unsupported formats
	 * throw RangeError on web/iOS/Android; use linkTo for links. AppKit
	 * commands are asynchronous and report engine errors through its transport.
	 * See the platform subset in docs/app/rich-text.md. */
	apply(format: LexicalFormat): void
	/** Apply a link to the current selection. */
linkTo(url: string, anchor?: string): void
	/** Strip the link covering the current selection. */
removeLink(): void
	/** Query whether a mark/node type is active at the selection. */
isActive(format: LexicalFormat): boolean
	/** Undo the last edit. */
undo(): void
	/** Redo the last undone edit. */
redo(): void
	/** Programmatically focus the editor. */
focus(): void
	/** Programmatically blur the editor. */
blur(): void
	/** Whether the editor currently has focus. */
isFocused(): boolean
	/** The platform surface — the lexical `LexicalEditor` on web,
	 *  `AztecText` on Android. */
	/** AppKit: the XplatEditorHost transport, not the browser engine instance. */
	native: any
}

/** Props for the editor element. */
export interface LexicalEditorProps {
	/** Element id passed through to the host element. */
	id?: string
	/** Class list applied to the editor element. */
	className?: string
	/** Inline style (string CSS or object). */
	style?: any
	/** Document HTML. Seed at mount; external changes re-push. */
	value?: string
	/** Serialized editor state. Takes precedence over `value` when both
	 *  arrive. On native it waits for the doc-model modules and host
	 *  readiness (see `onJSONReady`); a doc that arrives early is applied
	 *  once both are up rather than dropped. */
	json?: LexicalJSON
	/** Empty-state hint text. */
	placeholder?: string
	/** Read-write vs read-only. @default true */
	editable?: boolean
	/** Focus the editor on mount. @default false */
	autofocus?: boolean
	/** Fires once the editor engine is ready for commands. */
	onReady?: () => void
	/** Reports when serialized JSON access is available. Web and AppKit report
	 *  `true` when their live editor handle exists. Native reports whether its
	 *  lazy DOM-free conversion bridge loaded; unsupported runtimes report
	 *  `false` and JSON getters return `null`. */
	onJSONReady?: (ready: boolean) => void
	/** Fires on each content edit — not on selection moves. */
	onChange?: (html: string) => void
	/** Fires with the serialized JSON document on each edit. */
	onJSONChange?: (doc: LexicalJSON) => void
	/** Fires when the selection/focus range moves. */
	onSelectionChange?: (event: { start: number; end: number; active: LexicalFormat[] }) => void
	/** Editor gained focus. */
	onFocus?: () => void
	/** Editor lost focus. */
	onBlur?: () => void
	/** Web-only Lexical node and plugin composition. Ignored by native backends. */
	web?: LexicalWebOptions
	/** Imperative handle — see the exported *EditorHandle type. */
	ref?: Octane.Ref<LexicalEditorHandle>
	/** Platform escape hatch — same bag contract as `ios`. */
	android?: Record<string, any>
	/** Platform escape hatch (native editor props). */
	ios?: Record<string, any>
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
