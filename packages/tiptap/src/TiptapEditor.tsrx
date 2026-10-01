/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useEffect, useRef } from 'octane'
import { RichTextEditor, supported as leafSupported } from '@octane-xplat/richtext'
import type { RichTextEditorHandle } from '@octane-xplat/richtext'
import type { TiptapEditorHandle, TiptapEditorProps } from './types'
import { ensureJSONBridge, htmlToJSON, jsonBridgeReady, jsonToHTML } from './json-bridge'

export const supported = leafSupported

/** Unified editor facade, native half. Rendering/editing run through the
 *  Aztec leaf; the tiptap document model (schema, generateJSON,
 *  renderToHTMLString) handles JSON interchange on top of it. */
export function TiptapEditor(props: TiptapEditorProps) @{
	const inner = useRef<RichTextEditorHandle | null>(null)
	const jsonReady = useRef(false)
	const lastJSON = useRef<string | undefined>(undefined)

	const bindHost = useCallback((h: RichTextEditorHandle) => {
		inner.current = h

		props.bind?.({
			getHTML: () => h.getHTML(),
			setHTML: (html: string) => h.setHTML(html),
			getJSON: () => (jsonBridgeReady() ? htmlToJSON(h.getHTML()) : null),
			setJSON: (doc) => {
				const html = jsonBridgeReady() ? jsonToHTML(doc) : null
				if (html != null) {
					lastJSON.current = JSON.stringify(doc)
					h.setHTML(html)
				}
			},
			apply: (format) => h.apply(format),
			linkTo: (url, anchor) => h.linkTo(url, anchor),
			removeLink: () => h.removeLink(),
			isActive: (format) => h.isActive(format),
			undo: () => h.undo(),
			redo: () => h.redo(),
			focus: () => h.focus(),
			blur: () => h.blur(),
			isFocused: () => h.isFocused(),
			native: h.native,
		} satisfies TiptapEditorHandle)
	}, [])

	// The bridge loads once per process — dynamic imports of the DOM-free
	// tiptap slices, plus the zeed-dom parse shim.
	useEffect(() => {
		ensureJSONBridge().then((ok) => {
			jsonReady.current = ok
			props.onJSONReady?.(ok)
		})
	}, [])

	// `json` prop → editor content, when the bridge is up and the doc wasn't
	// emitted by the editor itself.
	useEffect(() => {
		if (!props.json || !jsonBridgeReady() || !inner.current) return
		const stamp = JSON.stringify(props.json)
		if (stamp === lastJSON.current) return
		const html = jsonToHTML(props.json)
		if (html != null) {
			lastJSON.current = stamp
			inner.current.setHTML(html)
		}
	}, [props.json])

	const emitJSON = () => {
		if (!inner.current || !jsonBridgeReady()) return
		const doc = htmlToJSON(inner.current.getHTML())
		if (doc) {
			lastJSON.current = JSON.stringify(doc)
			props.onJSONChange?.(doc)
		}
	}

	<RichTextEditor
		id={props.id}
		className={props.className}
		style={props.style}
		value={props.value}
		placeholder={props.placeholder}
		editable={props.editable}
		autofocus={props.autofocus}
		onReady={props.onReady}
		onChange={(html) => {
			props.onChange?.(html)
			emitJSON()
		}}
		onSelectionChange={props.onSelectionChange}
		onFocus={props.onFocus}
		onBlur={props.onBlur}
		bind={bindHost}
		android={props.android}
		ios={props.ios}
		row={props.row}
		col={props.col}
		rowSpan={props.rowSpan}
		colSpan={props.colSpan}
		dock={props.dock}
		left={props.left}
		top={props.top}
		flexGrow={props.flexGrow}
		flexShrink={props.flexShrink}
		alignSelf={props.alignSelf}
		order={props.order}
	/>;
}
