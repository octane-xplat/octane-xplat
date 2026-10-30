import type { Octane } from 'octane/jsx-runtime'
import type { Extensions } from '@tiptap/core'
import type { StarterKitOptions } from '@tiptap/starter-kit'

/** Format vocabulary shared by the web (tiptap StarterKit) and native
 *  (Aztec) backends. On web, starter-kit covers everything except
 *  taskList/highlight/subscript/superscript/align* — those throw RangeError there and
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
export type TiptapJSON = {
	/** Root node name — always `'doc'` for a document. */
	type: string
	/** Top-level nodes; absent for an empty document. */
	content?: unknown[]
} & Record<string, unknown>

/** Engine options for the web target only. The `.web` entry mounts a real
 *  tiptap `Editor`, so callers can extend its schema here. The Android
 *  facade (Aztec leaf) and the bundled AppKit engine cannot host DOM-bound
 *  ProseMirror/tiptap extension objects and ignore these options. Caller
 *  plugins, node views, and browser menus are web behavior, not shared
 *  contract. */
export interface TiptapWebOptions {
	/** Extra tiptap extensions appended after the built-in StarterKit — any
	 *  `Extension`/`Node`/`Mark` from `@tiptap/*` or app code. An entry named
	 *  `starterKit` replaces the built-in instead of registering it twice.
	 *  The editor fixes its schema at construction; keep the list
	 *  referentially stable across renders. */
	extensions?: Extensions
	/** `StarterKit.configure()` options for the built-in StarterKit, or
	 *  `false` to omit it — `extensions` must then supply a complete schema
	 *  (document, paragraph, and text nodes at minimum). */
	starterKit?: StarterKitOptions | false
}

/** Imperative handle exposed through the editor `ref`. */
export interface TiptapEditorHandle {
	/** AppKit: returns the latest WebKit snapshot; commands are asynchronous. */
	getHTML(): string
	/** Web: `commands.setContent` (undo-aware). Native: Aztec `fromHtml` —
	 *  resets undo history. */
	setHTML(html: string): void
	/** Doc JSON, or null while the native schema modules are still loading /
	 *  on a runtime that can't host them (`json` flag). Web is always ready. */
	/** AppKit: latest live engine JSON snapshot; null before onReady. */
	getJSON(): TiptapJSON | null
	/** Replace the document with a serialized JSON string. */
	setJSON(doc: TiptapJSON): void
	/** Toggle a format supported by the mounted backend. Unsupported formats
	 * throw RangeError on web/iOS/Android; use linkTo for links. AppKit
	 * commands are asynchronous and report engine errors through its transport.
	 * See the platform subset in docs/app/rich-text.md. */
	apply(format: TiptapFormat): void
	/** Apply a link to the current selection. */
	linkTo(url: string, anchor?: string): void
	/** Strip the link covering the current selection. */
	removeLink(): void
	/** Query whether a mark/node type is active at the selection. */
	isActive(format: TiptapFormat): boolean
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
	/** The platform surface — a tiptap `Editor` on web, `AztecText` on
	 *  Android. */
	/** AppKit: the XplatEditorHost transport, not the browser engine instance. */
	native: any
}

/** Props for the editor element. */
export interface TiptapEditorProps {
	/** Element id passed through to the host element. */
	id?: string
	/** Class list applied to the editor element. */
	className?: string
	/** Inline style (string CSS or object). */
	style?: any
	/** Document HTML. Seed at mount; external changes re-push (web: via
	 *  setContent, preserving the diff loop the editor emitted is skipped). */
	value?: string
	/** Document JSON. Takes precedence over `value` when both arrive. On
	 *  native it waits for the schema modules and host readiness (see
	 *  `onJSONReady`); a doc that arrives early is applied once both are up
	 *  rather than dropped. */
	json?: TiptapJSON
	/** Empty-state hint text. */
	placeholder?: string
	/** Read-write vs read-only. @default true */
	editable?: boolean
	/** Focus the editor on mount. @default false */
	autofocus?: boolean
	/** Fires once the editor engine is ready for commands. */
	onReady?: () => void
	/** Fires once when the native JSON bridge settles — `true` if the
	 *  DOM-free tiptap modules loaded, `false` on runtimes that can't host
	 *  them (JSON calls then no-op / return null). Never fires on web. */
	/** AppKit: fires true with mounted engine readiness; no headless conversion bridge. */
	onJSONReady?: (ready: boolean) => void
	/** Fires on each content edit — not on selection moves. */
	onChange?: (html: string) => void
	/** Fires with the serialized JSON document on each edit. */
	onJSONChange?: (doc: TiptapJSON) => void
	/** Fires when the selection/focus range moves. */
	onSelectionChange?: (event: { start: number; end: number; active: TiptapFormat[] }) => void
	/** Editor gained focus. */
	onFocus?: () => void
	/** Editor lost focus. */
	onBlur?: () => void
	/** Imperative handle — see the exported *EditorHandle type. */
	ref?: Octane.Ref<TiptapEditorHandle>
	/** Platform escape hatch — same bag contract as `ios`. */
	android?: Record<string, any>
	/** Platform escape hatch (native editor props). */
	ios?: Record<string, any>
	/** Web-target engine configuration — tiptap extensions and StarterKit
	 *  options. See `TiptapWebOptions`; ignored on native and AppKit. */
	web?: TiptapWebOptions
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
