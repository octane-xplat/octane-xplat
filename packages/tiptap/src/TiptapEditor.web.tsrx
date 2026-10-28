/** @jsxImportSource @octane-xplat/jsx/dom */
import { useImperativeHandle, useEffect, useMemo, useRef } from 'octane'
import { EditorContent, useEditor } from '@octanejs/tiptap'
import { activeFormats, bindEditorHandle, resolveExtensions } from './editor-core.web'
import type { TiptapEditorHandle, TiptapEditorProps } from './types'

export const supported = true

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
		if (!editor) {
			return
		}

		const stamp = JSON.stringify([props.json !== undefined, props.value])
		if (stamp === lastHTMLInput.current) {
			return
		}

		lastHTMLInput.current = stamp
		if (props.value === undefined || props.json !== undefined) {
			return
		}

		if (props.value === lastEmitted.current) {
			return
		}

		editor.commands.setContent(props.value)
	}, [editor, props.value, props.json])

	useEffect(() => {
		if (!editor) {
			return
		}

		const stamp = JSON.stringify(props.json)
		if (stamp === lastJSONInput.current) {
			return
		}

		lastJSONInput.current = stamp
		if (props.json === undefined || stamp === lastJSON.current) {
			return
		}

		editor.commands.setContent(props.json as any)
	}, [editor, props.json])

	useEffect(() => {
		if (!editor) {
			return
		}

		editor.setEditable(props.editable !== false)
	}, [editor, props.editable])

	// The handle rebinds whenever the editor instance appears — stable
	// afterward (useEditor keeps the instance identity).
	useImperativeHandle<TiptapEditorHandle | null>(
		props.ref,
		() => {
			if (!editor) {
				return null
			}

			bound.current = bindEditorHandle(editor)

			return bound.current
		},
		[editor],
	)

	<div className={['vx-richtext', props.className]} style={props.style}>
		<EditorContent editor={editor} />
	</div>
}
