// Framework-free AppKit webview document — drives tiptap's Editor directly.
// The macOS transport only ferries {value, json, placeholder, editable,
// autofocus} plus the callback surface, so the web-leaf Octane component's
// composition options were never reachable here; this mounts the same engine
// (StarterKit + the shared handle contract) without a renderer in between.
import { Editor } from '@tiptap/core'
import { installEditorDocument } from '@octane-xplat/richtext/browser-transport'
import { activeFormats, bindEditorHandle, resolveExtensions } from './editor-core.web'
import type { TiptapEditorHandle } from './types'

let editor: Editor | undefined
let handle: TiptapEditorHandle | undefined
let current: any
let lastEmitted: string | undefined
let lastJSON: string | undefined
let lastHTMLInput: string | undefined
let lastJSONInput: string | undefined

installEditorDocument((props) => {
	current = props
	if (!editor) {
		const element = document.createElement('div')
		element.className = 'vx-richtext'
		document.getElementById('root')!.append(element)
		editor = new Editor({
			element,
			extensions: resolveExtensions(current.web),
			content: (current.json ?? current.value ?? '') as any,
			editable: current.editable !== false,
			autofocus: current.autofocus ?? false,
			onCreate: () => current.onReady?.(),
			onUpdate: ({ editor: e }) => {
				const html = e.getHTML()
				lastEmitted = html
				current.onChange?.(html)
				const doc = e.getJSON()
				lastJSON = JSON.stringify(doc)
				current.onJSONChange?.(doc)
			},
			onFocus: () => current.onFocus?.(),
			onBlur: () => current.onBlur?.(),
			onSelectionUpdate: ({ editor: e }) =>
				current.onSelectionChange?.({
					start: e.state.selection.from,
					end: e.state.selection.to,
					active: activeFormats(e),
				}),
		})

		handle = bindEditorHandle(editor)
		lastHTMLInput = JSON.stringify([current.json !== undefined, current.value])
		lastJSONInput = JSON.stringify(current.json)
		props.ref(handle)
	}

	// External `value`/`json` changes push setContent; editor-emitted docs are
	// skipped (the transaction already owns the doc). Stamps track the web
	// leaf's two effects exactly — both advance every props packet.
	const htmlStamp = JSON.stringify([current.json !== undefined, current.value])
	if (htmlStamp !== lastHTMLInput) {
		lastHTMLInput = htmlStamp
		if (
			current.value !== undefined &&
			current.json === undefined &&
			current.value !== lastEmitted
		) {
			handle!.setHTML(current.value)
		}
	}

	const jsonStamp = JSON.stringify(current.json)
	if (jsonStamp !== lastJSONInput) {
		lastJSONInput = jsonStamp
		if (current.json !== undefined && jsonStamp !== lastJSON) {
			handle!.setJSON(current.json)
		}
	}

	editor.setEditable(current.editable !== false)
	editor.view.dom.dataset.placeholder = current.placeholder ?? ''
	editor.view.dom.setAttribute('aria-label', current.placeholder ?? 'Rich text editor')
})
