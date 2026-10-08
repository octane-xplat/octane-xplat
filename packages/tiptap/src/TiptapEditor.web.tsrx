import { useImperativeHandle, useEffect, useMemo, useRef } from 'octane'
import { EditorContent, useEditor } from '@octanejs/tiptap'
import StarterKit from '@tiptap/starter-kit'
import type { Extensions } from '@tiptap/core'
import type { TiptapEditorHandle, TiptapEditorProps, TiptapFormat, TiptapWebOptions } from './types'

export const supported = true

type WebFormat = Exclude<TiptapFormat, 'link' | 'taskList' | 'highlight' | 'subscript' | 'superscript' | 'alignLeft' | 'alignCenter' | 'alignRight'>

const COMMAND: Record<WebFormat, [string, object?]> = {
	bold: ['toggleBold'],
	italic: ['toggleItalic'],
	underline: ['toggleUnderline'],
	strikethrough: ['toggleStrike'],
	code: ['toggleCode'],
	blockquote: ['toggleBlockquote'],
	bulletList: ['toggleBulletList'],
	orderedList: ['toggleOrderedList'],
	codeBlock: ['toggleCodeBlock'],
	horizontalRule: ['setHorizontalRule'],
	paragraph: ['setParagraph'],
	heading1: ['toggleHeading', { level: 1 }],
	heading2: ['toggleHeading', { level: 2 }],
	heading3: ['toggleHeading', { level: 3 }],
	heading4: ['toggleHeading', { level: 4 }],
	heading5: ['toggleHeading', { level: 5 }],
	heading6: ['toggleHeading', { level: 6 }],
}

const ACTIVE_OF: [TiptapFormat, string, any?][] = [
	['bold', 'bold'],
	['italic', 'italic'],
	['underline', 'underline'],
	['strikethrough', 'strike'],
	['code', 'code'],
	['blockquote', 'blockquote'],
	['bulletList', 'bulletList'],
	['orderedList', 'orderedList'],
	['codeBlock', 'codeBlock'],
	['link', 'link'],
	['heading1', 'heading', { level: 1 }],
	['heading2', 'heading', { level: 2 }],
	['heading3', 'heading', { level: 3 }],
	['heading4', 'heading', { level: 4 }],
	['heading5', 'heading', { level: 5 }],
	['heading6', 'heading', { level: 6 }],
	['paragraph', 'paragraph'],
]

function activeFormats(editor: any): TiptapFormat[] {
	const out: TiptapFormat[] = []
	for (const [name, kind, attrs] of ACTIVE_OF) {
		if (editor.isActive(kind, attrs)) out.push(name)
	}

	return out
}

/** Extension list for the web engine: the built-in StarterKit (optionally
 *  configured) followed by caller extras. `starterKit: false` or a
 *  starterKit-named caller entry hands the schema over to the caller —
 *  registering two StarterKits trips tiptap's duplicate-name warning. */
function resolveExtensions(web: TiptapWebOptions | undefined): Extensions {
	const extras = web?.extensions ?? []
	if (web?.starterKit === false || extras.some((ext) => ext?.name === 'starterKit')) {
		return extras
	}

	const kit = web?.starterKit ? StarterKit.configure(web.starterKit) : StarterKit
	return [kit, ...extras]
}

/** Unified editor facade, web half — a thin adapter over the published
 *  `@octanejs/tiptap` binding (useEditor + EditorContent + StarterKit). */
export function TiptapEditor(props: TiptapEditorProps) @{
	const lastEmitted = useRef<string | undefined>(undefined)
	const lastJSON = useRef<string | undefined>(undefined)
	const lastHTMLInput = useRef(JSON.stringify([props.json !== undefined, props.value]))
	const lastJSONInput = useRef(JSON.stringify(props.json))
	const bound = useRef<TiptapEditorHandle | undefined>(undefined)

	// tiptap fixes the schema at construction; memoized on the option values
	// so a stable caller config never re-triggers setOptions.
	const extensions = useMemo(
		() => resolveExtensions(props.web),
		[props.web?.extensions, props.web?.starterKit],
	)

	const editor = useEditor({
		extensions,
		content: (props.json ?? props.value ?? '') as any,
		editable: props.editable !== false,
		autofocus: props.autofocus ?? false,
		onCreate: () => props.onReady?.(),
		onUpdate: ({ editor: e }: any) => {
			const html = e.getHTML()
			lastEmitted.current = html
			props.onChange?.(html)
			const doc = e.getJSON()
			lastJSON.current = JSON.stringify(doc)
			props.onJSONChange?.(doc)
		},
		onFocus: () => props.onFocus?.(),
		onBlur: () => props.onBlur?.(),
		onSelectionUpdate: ({ editor: e }: any) =>
			props.onSelectionChange?.({
				start: e.state.selection.from,
				end: e.state.selection.to,
				active: activeFormats(e),
			}),
	})

	// External `value` changes push setContent; editor-emitted HTML is skipped
	// (the transaction already owns the doc).
	useEffect(() => {
		if (!editor) return
		const stamp = JSON.stringify([props.json !== undefined, props.value])
		if (stamp === lastHTMLInput.current) return
		lastHTMLInput.current = stamp
		if (props.value === undefined || props.json !== undefined) return
		if (props.value === lastEmitted.current) return
		editor.commands.setContent(props.value)
	}, [editor, props.value, props.json])

	useEffect(() => {
		if (!editor) return
		const stamp = JSON.stringify(props.json)
		if (stamp === lastJSONInput.current) return
		lastJSONInput.current = stamp
		if (props.json === undefined || stamp === lastJSON.current) return
		editor.commands.setContent(props.json as any)
	}, [editor, props.json])

	useEffect(() => {
		if (!editor) return
		editor.setEditable(props.editable !== false)
	}, [editor, props.editable])

	// The handle rebinds whenever the editor instance appears — stable
	// afterward (useEditor keeps the instance identity).
	useImperativeHandle<TiptapEditorHandle | null>(props.ref, () => {
		if (!editor) return null
		const e: any = editor
		bound.current = {
			getHTML: () => e.getHTML(),
			setHTML: (html: string) => e.commands.setContent(html),
			getJSON: () => e.getJSON(),
			setJSON: (doc) => e.commands.setContent(doc),
			apply: (format) => {
				const command = COMMAND[format as WebFormat]
				if (!command || typeof e.commands[command[0]] !== 'function') {
					throw new RangeError(`[tiptap] Unsupported apply format: ${format}; use linkTo for links`)
				}

				e.chain().focus()[command[0]](command[1]).run()
			},
			linkTo: (url, anchor) => {
				if (anchor != null && anchor !== '') {
					e.chain().focus().insertContent({ type: 'text', text: anchor, marks: [{ type: 'link', attrs: { href: url } }] }).run()
				} else {
					e.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
				}
			},
			removeLink: () => e.chain().focus().unsetLink().run(),
			isActive: (format) => activeFormats(e).includes(format),
			undo: () => e.commands.undo(),
			redo: () => e.commands.redo(),
			focus: () => e.commands.focus(),
			blur: () => e.commands.blur(),
			isFocused: () => e.isFocused,
			native: e,
		}

		return bound.current
	}, [editor])

	<div className={['vx-richtext', props.className]} style={props.style}>
		<EditorContent editor={editor} />
	</div>
}
