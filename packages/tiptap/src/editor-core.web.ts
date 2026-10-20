import StarterKit from '@tiptap/starter-kit'
import type { Extensions } from '@tiptap/core'
import type { TiptapEditorHandle, TiptapFormat, TiptapWebOptions } from './types'

type WebFormat = Exclude<
	TiptapFormat,
	| 'link'
	| 'taskList'
	| 'highlight'
	| 'subscript'
	| 'superscript'
	| 'alignLeft'
	| 'alignCenter'
	| 'alignRight'
>

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

export function activeFormats(editor: any): TiptapFormat[] {
	const out: TiptapFormat[] = []
	for (const [name, kind, attrs] of ACTIVE_OF) {
		if (editor.isActive(kind, attrs)) {
			out.push(name)
		}
	}

	return out
}

/** Extension list for the web engine: the built-in StarterKit (optionally
 *  configured) followed by caller extras. `starterKit: false` or a
 *  starterKit-named caller entry hands the schema over to the caller —
 *  registering two StarterKits trips tiptap's duplicate-name warning. */
export function resolveExtensions(web: TiptapWebOptions | undefined): Extensions {
	const extras = web?.extensions ?? []
	if (web?.starterKit === false || extras.some((ext) => ext?.name === 'starterKit')) {
		return extras
	}

	const kit = web?.starterKit ? StarterKit.configure(web.starterKit) : StarterKit
	return [kit, ...extras]
}

/** The shared handle contract over a live tiptap `Editor` — used by the web
 *  leaf's imperative handle and the bundled AppKit document driver. */
export function bindEditorHandle(e: any): TiptapEditorHandle {
	return {
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
				e.chain()
					.focus()
					.insertContent({
						type: 'text',
						text: anchor,
						marks: [{ type: 'link', attrs: { href: url } }],
					})
					.run()
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
}
