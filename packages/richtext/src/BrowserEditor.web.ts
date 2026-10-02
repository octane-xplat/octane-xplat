import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { installEditorDocument } from './browser-transport.web'

let editor: Editor | undefined
let current: any
let lastHTML: string | undefined
let lastJSON: string | undefined
let lastHTMLInput: string | undefined
const command: Record<string, (chain: any) => any> = {
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
}

for (let level = 1; level <= 6; level++) {
	command['heading' + level] = (c) => c.toggleHeading({ level })
}

installEditorDocument((props) => {
	current = props
	if (!editor) {
		const element = document.createElement('div')
		document.body.append(element)
		editor = new Editor({
			element,
			extensions: [StarterKit],
			content: props.value ?? '',
			editable: props.editable !== false,
			autofocus: props.autofocus ?? false,
			onUpdate: ({ editor: e }) => {
				lastHTML = e.getHTML()
				current.onChange?.(lastHTML)
			},
			onSelectionUpdate: ({ editor: e }) =>
				current.onSelectionChange?.({
					start: e.state.selection.from,
					end: e.state.selection.to,
					active: [],
				}),
			onFocus: () => current.onFocus?.(),
			onBlur: () => current.onBlur?.(),
		})

		lastHTMLInput = JSON.stringify([props.json !== undefined, props.value])
		const e = editor
		props.ref({
			getHTML: () => e.getHTML(),
			setHTML: (html: string) => e.commands.setContent(html),
			getJSON: () => e.getJSON(),
			setJSON: (doc: any) => e.commands.setContent(doc),
			apply: (format: string) => {
				command[format]?.(e.chain().focus()).run()
			},
			linkTo: (url: string, anchor?: string) =>
				anchor
					? e
							.chain()
							.focus()
							.insertContent({
								type: 'text',
								text: anchor,
								marks: [{ type: 'link', attrs: { href: url } }],
							})
							.run()
					: e.chain().focus().extendMarkRange('link').setLink({ href: url }).run(),
			removeLink: () => e.chain().focus().unsetLink().run(),
			isActive: (format: string) =>
				format.startsWith('heading')
					? e.isActive('heading', { level: Number(format.slice(7)) })
					: e.isActive(format === 'strikethrough' ? 'strike' : format),
			undo: () => e.commands.undo(),
			redo: () => e.commands.redo(),
			focus: () => e.commands.focus(),
			blur: () => e.commands.blur(),
			isFocused: () => e.isFocused,
		})
	}

	if (props.json !== undefined) {
		const stamp = JSON.stringify(props.json)
		if (stamp !== lastJSON && stamp !== JSON.stringify(editor.getJSON())) {
			editor.commands.setContent(props.json)
		}

		lastJSON = stamp
	} else {
		const stamp = JSON.stringify([false, props.value])
		if (stamp !== lastHTMLInput && props.value !== undefined && props.value !== lastHTML) {
			editor.commands.setContent(props.value)
		}

		lastHTMLInput = stamp
	}

	editor.setEditable(props.editable !== false)
	editor.view.dom.dataset.placeholder = props.placeholder ?? ''
	editor.view.dom.setAttribute('aria-label', props.placeholder ?? 'Rich text editor')
})
