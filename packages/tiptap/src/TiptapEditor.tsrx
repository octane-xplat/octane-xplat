/** @jsxImportSource @nativescript-community/octane */
import { useState, useImperativeHandle, useCallback, useEffect, useRef } from 'octane'
import { RichTextEditor, supported as leafSupported } from '@octane-xplat/richtext'
import type { RichTextEditorHandle } from '@octane-xplat/richtext'
import type { TiptapEditorHandle, TiptapEditorProps, TiptapJSON } from './types'
import { ensureJSONBridge, htmlToJSON, jsonBridgeReady, jsonToHTML } from './json-bridge'

export const supported = leafSupported

/** Unified editor facade, native half. Rendering/editing run through the
 *  Aztec leaf; the tiptap document model (schema, generateJSON,
 *  renderToHTMLString) handles JSON interchange on top of it. */
export function TiptapEditor(props: TiptapEditorProps) @{
	const inner = useRef<RichTextEditorHandle | null>(null)
	const [exposedHandle, setHandle] = useState<TiptapEditorHandle | null>(null)
	useImperativeHandle<TiptapEditorHandle | null>(props.ref, () => exposedHandle, [exposedHandle])
	const lastJSON = useRef<string | undefined>(undefined)
	const appliedHost = useRef<RichTextEditorHandle | null>(null)
	// Latest doc requested for the host — by `json` prop or `setJSON`. Kept
	// after a successful push so a rebound (recreated) host still gets it.
	const desiredDoc = useRef<TiptapJSON | undefined>(undefined)
	const desiredHTML = useRef<string | undefined>(undefined)
	const lastHTMLInput = useRef(props.value)

	// Push the requested doc once both halves are up — the JSON bridge
	// (async module load) and the bound host (ref/onReady timing). Skips the
	// stamp the host already shows, so editor-emitted echoes and repeat props
	// never reach setHTML; a different host always gets its own copy.
	const applyDoc = () => {
		const host = inner.current
		const doc = desiredDoc.current
		if (!host) return
		if (doc === undefined) {
			if (desiredHTML.current !== undefined && appliedHost.current !== host) {
				host.setHTML(desiredHTML.current)
				appliedHost.current = host
			}

			return
		}

		if (!jsonBridgeReady()) return
		const stamp = JSON.stringify(doc)
		if (stamp === lastJSON.current && appliedHost.current === host) return
		const html = jsonToHTML(doc)
		if (html != null) {
			lastJSON.current = stamp
			appliedHost.current = host
			host.setHTML(html)
		}
	}

	const bindHost = useCallback((h: RichTextEditorHandle | null) => {
		const previousHost = inner.current
		inner.current = h
		if (h) {
			// The ref binds inside the leaf's commit, before its own `value`
			// seed — defer so `json` keeps precedence over `value`.
			queueMicrotask(applyDoc)
		}

		setHandle((previous) => previousHost === h ? previous : h ? ({
			getHTML: () => h.getHTML(),
			setHTML: (html: string) => {
				desiredDoc.current = undefined
				desiredHTML.current = html
				lastJSON.current = undefined
				appliedHost.current = h
				h.setHTML(html)
			},
			getJSON: () => (jsonBridgeReady() ? htmlToJSON(h.getHTML()) : null),
			setJSON: (doc) => {
				desiredDoc.current = doc
				desiredHTML.current = undefined
				applyDoc()
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
		} satisfies TiptapEditorHandle) : null)
	}, [])

	// The bridge loads once per process — dynamic imports of the DOM-free
	// tiptap slices, plus the zeed-dom parse shim. A doc that arrived before
	// it settles is applied here, not dropped.
	useEffect(() => {
		if (!leafSupported) {
			props.onJSONReady?.(false)
			return
		}

		let alive = true
		ensureJSONBridge().then((ok) => {
			if (!alive) return
			props.onJSONReady?.(ok)
			applyDoc()
		})

		return () => {
			alive = false
		}
	}, [])

	// `json` prop → editor content. It may land before the bridge settles or
	// before the host binds — park it in desiredDoc and let the readiness
	// flushes apply it.
	useEffect(() => {
		desiredDoc.current = props.json
		desiredHTML.current = undefined
		if (props.json === undefined) return
		applyDoc()
	}, [props.json])

	// External HTML changes replace the rebind snapshot too. Unchanged
	// props must not replay over imperative replacements or user edits.
	useEffect(() => {
		if (props.value === lastHTMLInput.current) return
		lastHTMLInput.current = props.value
		if (props.json !== undefined || props.value === undefined) return
		desiredDoc.current = undefined
		desiredHTML.current = props.value
		appliedHost.current = inner.current
	}, [props.value])

	const emitJSON = () => {
		if (!inner.current || !jsonBridgeReady()) return
		const doc = htmlToJSON(inner.current.getHTML())
		if (doc) {
			desiredDoc.current = doc
			lastJSON.current = JSON.stringify(doc)
			appliedHost.current = inner.current
			props.onJSONChange?.(doc)
		}
	}

	<RichTextEditor
		id={props.id}
		className={props.className}
		style={props.style}
		value={props.json === undefined ? props.value : undefined}
		placeholder={props.placeholder}
		editable={props.editable}
		autofocus={props.autofocus}
		onReady={() => {
			// Host signalled ready after the leaf's own initial content seed —
			// the last apply point that still outranks a `value` prop.
			applyDoc()
			props.onReady?.()
		}}
		onChange={(html) => {
			desiredHTML.current = html
			desiredDoc.current = undefined
			appliedHost.current = inner.current
			props.onChange?.(html)
			emitJSON()
		}}
		onSelectionChange={props.onSelectionChange}
		onFocus={props.onFocus}
		onBlur={props.onBlur}
		ref={bindHost}
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
