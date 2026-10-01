import { useEffect, useRef } from 'octane'
import { EditorContent, useEditor } from '@octanejs/tiptap'
import StarterKit from '@tiptap/starter-kit'
import type { TiptapEditorHandle, TiptapEditorProps, TiptapFormat } from './types'

export const supported = true

type WebFormat = Exclude<TiptapFormat, 'link' | 'taskList' | 'highlight' | 'subscript' | 'superscript' | 'alignLeft' | 'alignCenter' | 'alignRight'>

const COMMAND: Record<WebFormat, (chain: any) => any> = {
	bold: (c) => c.toggleBold(),
	italic: (c) => c.toggleItalic(),
	underline: (c) => c.toggleUnderline(),
	strikethrough: (c) => c.toggleStrike(),
	code: (c) => c.toggleCode(),
	blockquote: (c) => c.toggleBlockquote(),
	bulletList: (c) => c.toggleBulletList(),
	orderedList: (c) => c.toggleOrderedList(),
	codeBlock: (c) => c.toggleCodeBlock(),
	horizontalRule: (c) => c.setHorizontalRule(),
	paragraph: (c) => c.setParagraph(),
	heading1: (c) => c.toggleHeading({ level: 1 }),
	heading2: (c) => c.toggleHeading({ level: 2 }),
	heading3: (c) => c.toggleHeading({ level: 3 }),
	heading4: (c) => c.toggleHeading({ level: 4 }),
	heading5: (c) => c.toggleHeading({ level: 5 }),
	heading6: (c) => c.toggleHeading({ level: 6 }),
}

const IS_ACTIVE: Partial<Record<TiptapFormat, (editor: any) => boolean>> = {
	bold: (e) => e.isActive('bold'),
	italic: (e) => e.isActive('italic'),
	underline: (e) => e.isActive('underline'),
	strikethrough: (e) => e.isActive('strike'),
	code: (e) => e.isActive('code'),
	blockquote: (e) => e.isActive('blockquote'),
	bulletList: (e) => e.isActive('bulletList'),
	orderedList: (e) => e.isActive('orderedList'),
	codeBlock: (e) => e.isActive('codeBlock'),
	link: (e) => e.isActive('link'),
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

/** Unified editor facade, web half — a thin adapter over the published
 *  `@octanejs/tiptap` binding (useEditor + EditorContent + StarterKit). */
export function TiptapEditor(props: TiptapEditorProps) @{
	const lastEmitted = useRef<string | undefined>(undefined)
	const lastJSON = useRef<string | undefined>(undefined)
	const bound = useRef<TiptapEditorHandle | undefined>(undefined)

	const editor = useEditor({
		extensions: [StarterKit],
		content: (props.value ?? props.json ?? '') as any,
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
		if (!editor || props.value === undefined) return
		if (props.value === lastEmitted.current) return
		editor.commands.setContent(props.value)
	}, [editor, props.value])

	useEffect(() => {
		if (!editor || props.json === undefined) return
		if (JSON.stringify(props.json) === lastJSON.current) return
		editor.commands.setContent(props.json as any)
	}, [editor, props.json])

	useEffect(() => {
		if (!editor) return
		editor.setEditable(props.editable !== false)
	}, [editor, props.editable])

	// The handle rebinds whenever the editor instance appears — stable
	// afterward (useEditor keeps the instance identity).
	useEffect(() => {
		if (!editor || bound.current?.native === editor) return
		const e: any = editor
		bound.current = {
			getHTML: () => e.getHTML(),
			setHTML: (html: string) => e.commands.setContent(html),
			getJSON: () => e.getJSON(),
			setJSON: (doc) => e.commands.setContent(doc),
			apply: (format) => {
				const run = COMMAND[format as WebFormat]
				if (run) run(e.chain().focus()).run()
			},
			linkTo: (url, anchor) => {
				if (anchor != null && anchor !== '') {
					e.chain().focus().insertContent({ type: 'text', text: anchor, marks: [{ type: 'link', attrs: { href: url } }] }).run()
				} else {
					e.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
				}
			},
			removeLink: () => e.chain().focus().unsetLink().run(),
			isActive: (format) => IS_ACTIVE[format]?.(e) ?? false,
			undo: () => e.commands.undo(),
			redo: () => e.commands.redo(),
			focus: () => e.commands.focus(),
			blur: () => e.commands.blur(),
			isFocused: () => e.isFocused,
			native: e,
		}

		props.bind?.(bound.current)
	}, [editor])

	<div className={['vx-richtext', props.className]} style={props.style}>
		<EditorContent editor={editor} />
	</div>
}
