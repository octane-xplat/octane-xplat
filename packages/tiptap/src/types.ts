import type { Octane } from 'octane/jsx-runtime'
import type { Extensions } from '@tiptap/core'
import type { StarterKitOptions } from '@tiptap/starter-kit'

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

/** Engine options for the web target only. The `.web` entry mounts a real
 *  tiptap `Editor`, so callers can extend its schema here. The Android
 *  facade (Aztec leaf) and the bundled AppKit engine cannot host DOM-bound
 *  ProseMirror/tiptap extension objects and ignore these options — a caller
 *  extension is web behavior, not shared contract. */
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
	/** AppKit: the XplatEditorHost transport, not the browser engine instance. */
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
	/** AppKit: fires true with mounted engine readiness; no headless conversion bridge. */
	onJSONReady?: (ready: boolean) => void
	onChange?: (html: string) => void
	onJSONChange?: (doc: TiptapJSON) => void
	onSelectionChange?: (event: { start: number; end: number; active: TiptapFormat[] }) => void
	onFocus?: () => void
	onBlur?: () => void
	ref?: Octane.Ref<TiptapEditorHandle>
	android?: Record<string, any>
	ios?: Record<string, any>
	/** Web-target engine configuration — tiptap extensions and StarterKit
	 *  options. See `TiptapWebOptions`; ignored on native and AppKit. */
	web?: TiptapWebOptions
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
