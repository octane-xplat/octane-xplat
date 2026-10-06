/** @jsxImportSource @nativescript-community/octane */
import { useImperativeHandle, useCallback, useEffect, useRef } from 'octane'
import { View } from '@nativescript/core'
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@nativescript-community/octane/intrinsics'
import type {
	RichTextEditorHandle,
	RichTextEditorProps,
	RichTextFormat,
} from './types'

/** `XplatAztecEditorView` arrives through the leaf's
 *  `platforms/ios/src` Swift facade over `Aztec.TextView` — there are no
 *  generated typings for it, so every touch goes through `as any` at one
 *  boundary instead of `declare const` per call site. */
declare const XplatAztecEditorView: any

/** AztecEditor-iOS has no task-list or text-alignment API — the facade
 *  reports these as unsupported rather than faking a result. `link` is
 *  valid but goes through `linkTo`, matching the Android leaf. */
const UNSUPPORTED: ReadonlySet<RichTextFormat> = new Set([
	'taskList',
	'alignLeft',
	'alignCenter',
	'alignRight',
])

class AztecEditor extends View {
	createNativeView() {
		return new XplatAztecEditorView()
	}
}

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		xplatrichtext: Attributes<typeof AztecEditor>
	}
}

registerElement('xplatrichtext', AztecEditor)

export const supported = true

/** WordPress AztecEditor-iOS surface — a UITextView-backed native editor,
 *  not a WebView. Content in/out is HTML (`setHTML`/`getHTML`); JSON
 *  interchange lives one layer up in @octane-xplat/tiptap. */
export function RichTextEditor(props: RichTextEditorProps) @{
	const host = useRef<any>(null)
	const lastEmitted = useRef<string | undefined>(undefined)
	const applyingValue = useRef(false)
	const emitTimer = useRef<any>(null)
	const warned = useRef<Set<string>>(new Set())

	// Stable identity — an inline closure re-fires ref(null)/ref(v) per
	// render, which would bounce host.current around the effects below.
	useImperativeHandle(props.ref, () => handle(editor()), []);

	const bindHost = useCallback((v: any) => {
		host.current = v
	}, [])

	const editor = () => host.current?.ios

	const emitChange = () => {
		const e = editor()
		if (!e || applyingValue.current) return
		clearTimeout(emitTimer.current)
		emitTimer.current = setTimeout(() => {
			const current = editor()
			if (!current || applyingValue.current) return
			const html = current.getHTML()
			lastEmitted.current = html
			props.onChange?.(html)
		}, 150)
	}

	const reportUnsupported = (format: RichTextFormat) => {
		if (warned.current.has(format)) return
		warned.current.add(format)
		console.warn(
			`[richtext] apply('${format}') is not supported by the iOS Aztec surface`,
		)
	}

	const handle = (e: any): RichTextEditorHandle => ({
		getHTML: () => e.getHTML(),
		setHTML: (html: string) => {
			applyingValue.current = true
			try {
				e.setHTML(html)
				lastEmitted.current = html
			} finally {
				applyingValue.current = false
			}
		},
		apply: (format: RichTextFormat) => {
			if (format === 'link') return
			if (UNSUPPORTED.has(format) || !e.applyFormat(format)) {
				reportUnsupported(format)
				return
			}

			emitChange()
		},
		linkTo: (url: string, anchor?: string) => {
			e.linkTo(url, anchor ?? null)
			emitChange()
		},
		removeLink: () => {
			e.removeLink()
			emitChange()
		},
		isActive: (format: RichTextFormat) =>
			!UNSUPPORTED.has(format) && Boolean(e.isFormatActive(format)),
		undo: () => e.undo(),
		redo: () => e.redo(),
		split: () => {
			const ok = Boolean(e.split())
			if (ok) emitChange()
			return ok
		},
		join: () => {
			const ok = Boolean(e.join())
			if (ok) emitChange()
			return ok
		},
		indent: () => {
			const ok = Boolean(e.indent())
			if (ok) emitChange()
			return ok
		},
		outdent: () => {
			const ok = Boolean(e.outdent())
			if (ok) emitChange()
			return ok
		},
		canIndent: () => Boolean(e.canIndent()),
		canOutdent: () => Boolean(e.canOutdent()),
		focus: () => e.focus(),
		blur: () => e.blur(),
		isFocused: () => e.focused(),
		native: e,
	})

	useEffect(() => {
		const e = editor()
		if (!e) return

		e.onTextChange = () => emitChange()
		e.onSelectionChange = (start: number, end: number, active: any) => {
			const formats: RichTextFormat[] = []
			const count = active?.count ?? 0
			for (let i = 0; i < count; i++) {
				formats.push(active.objectAtIndex(i))
			}

			props.onSelectionChange?.({ start, end, active: formats })
		}

		e.onFocus = () => props.onFocus?.()
		e.onBlur = () => props.onBlur?.()

		if (props.placeholder !== undefined) e.placeholder = props.placeholder
		e.editable = props.editable !== false

		if (props.value !== undefined) {
			applyingValue.current = true
			try {
				e.setHTML(props.value)
			} finally {
				applyingValue.current = false
			}
		}

		if (props.autofocus) e.focus()

		if (props.ios) Object.assign(e, props.ios)
		props.onReady?.()

		return () => {
			e.onTextChange = null
			e.onSelectionChange = null
			e.onFocus = null
			e.onBlur = null
		}
	}, [])

	// `value` lands like a controlled prop, minus the loop: text the editor
	// emitted through onChange is never pushed back; any other change is an
	// external reset (Aztec-iOS setHTML is non-undoable, matching Android).
	useEffect(() => {
		const e = editor()
		if (!e || props.value === undefined) return
		if (props.value === lastEmitted.current) return
		applyingValue.current = true
		try {
			e.setHTML(props.value)
		} finally {
			applyingValue.current = false
		}
	}, [props.value])

	useEffect(() => {
		const e = editor()
		if (e) e.editable = props.editable !== false
	}, [props.editable])

	useEffect(() => {
		const e = editor()
		if (e && props.placeholder !== undefined) e.placeholder = props.placeholder
	}, [props.placeholder])

	<xplatrichtext
		ref={bindHost}
		id={props.id}
		className={props.className}
		style={props.style}
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
