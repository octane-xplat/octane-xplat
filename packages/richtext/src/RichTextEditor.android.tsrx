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

/** `org.wordpress.aztec` arrives through the leaf's aar — there are no
 *  generated typings for it, so every touch goes through `as any` at one
 *  boundary instead of `declare const org` per call site. */
const aztec = (globalThis as any).org?.wordpress?.aztec
const androidText = (globalThis as any).android?.text
const androidView = (globalThis as any).android?.view

const FORMATS: Record<Exclude<RichTextFormat, 'link'>, () => any> = {
	bold: () => aztec.AztecTextFormat.FORMAT_BOLD,
	italic: () => aztec.AztecTextFormat.FORMAT_ITALIC,
	underline: () => aztec.AztecTextFormat.FORMAT_UNDERLINE,
	strikethrough: () => aztec.AztecTextFormat.FORMAT_STRIKETHROUGH,
	code: () => aztec.AztecTextFormat.FORMAT_CODE,
	blockquote: () => aztec.AztecTextFormat.FORMAT_QUOTE,
	bulletList: () => aztec.AztecTextFormat.FORMAT_UNORDERED_LIST,
	orderedList: () => aztec.AztecTextFormat.FORMAT_ORDERED_LIST,
	taskList: () => aztec.AztecTextFormat.FORMAT_TASK_LIST,
	codeBlock: () => aztec.AztecTextFormat.FORMAT_PREFORMAT,
	horizontalRule: () => aztec.AztecTextFormat.FORMAT_HORIZONTAL_RULE,
	highlight: () => aztec.AztecTextFormat.FORMAT_MARK,
	subscript: () => aztec.AztecTextFormat.FORMAT_SUBSCRIPT,
	superscript: () => aztec.AztecTextFormat.FORMAT_SUPERSCRIPT,
	paragraph: () => aztec.AztecTextFormat.FORMAT_PARAGRAPH,
	heading1: () => aztec.AztecTextFormat.FORMAT_HEADING_1,
	heading2: () => aztec.AztecTextFormat.FORMAT_HEADING_2,
	heading3: () => aztec.AztecTextFormat.FORMAT_HEADING_3,
	heading4: () => aztec.AztecTextFormat.FORMAT_HEADING_4,
	heading5: () => aztec.AztecTextFormat.FORMAT_HEADING_5,
	heading6: () => aztec.AztecTextFormat.FORMAT_HEADING_6,
	alignLeft: () => aztec.AztecTextFormat.FORMAT_ALIGN_LEFT,
	alignCenter: () => aztec.AztecTextFormat.FORMAT_ALIGN_CENTER,
	alignRight: () => aztec.AztecTextFormat.FORMAT_ALIGN_RIGHT,
}

const AZTEC_OF: [RichTextFormat, () => any][] = Object.entries(FORMATS) as any

const formatOf = (format: RichTextFormat) =>
	format === 'link' ? aztec.AztecTextFormat.FORMAT_LINK : FORMATS[format]()

class AztecEditor extends View {
	createNativeView() {
		return new aztec.AztecText(this._context)
	}
}

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		xplatrichtext: Attributes<typeof AztecEditor>
	}
}

registerElement('xplatrichtext', AztecEditor)

export const supported = true

/** Active formats at the selection, mapped back to facade spellings. */
const activeFormats = (editor: any): RichTextFormat[] => {
	const styles = editor.getAppliedStyles(
		editor.getSelectionStart(),
		editor.getSelectionEnd(),
	)

	const count = styles?.size?.() ?? 0
	const active = new Set<any>()
	for (let i = 0; i < count; i++) active.add(styles.get(i))

	const out: RichTextFormat[] = []
	for (const [name, get] of AZTEC_OF) {
		if (active.has(get())) out.push(name)
	}

	if (active.has(aztec.AztecTextFormat.FORMAT_LINK)) out.push('link')
	return out
}

/** WordPress Aztec surface on Android — a true Spannable-backed editor, not
 *  a WebView. Content in/out is HTML (`fromHtml`/`toPlainHtml`); JSON
 *  interchange lives one layer up in @octane-xplat/tiptap. */
export function RichTextEditor(props: RichTextEditorProps) @{
	const host = useRef<any>(null)
	const lastEmitted = useRef<string | undefined>(undefined)
	const applyingValue = useRef(false)
	const keyListener = useRef<any>(null)
	const emitTimer = useRef<any>(null)

	// Stable identity — an inline closure re-fires ref(null)/ref(v) per
	// render, which would bounce host.current around the effects below.
	useImperativeHandle(props.ref, () => handle(editor()), []);

	const bindHost = useCallback((v: any) => {
		host.current = v
	}, [])

	const editor = () => host.current?.android

	const setEditable = (next: boolean) => {
		const e = editor()
		if (!e) return
		if (keyListener.current == null) keyListener.current = e.getKeyListener()
		if (next) {
			e.setKeyListener(keyListener.current)
			e.setFocusable(true)
			e.setCursorVisible(true)
		} else {
			e.setKeyListener(null)
			e.setFocusable(false)
			e.setCursorVisible(false)
		}
	}

	const showKeyboard = (e: any) => {
		try {
			const imm = e.getContext().getSystemService(
				(globalThis as any).android.content.Context.INPUT_METHOD_SERVICE,
			)

			imm?.showSoftInput(e, androidView.inputmethod.InputMethodManager.SHOW_IMPLICIT)
		} catch {}
	}

	const emitChange = () => {
		const e = editor()
		if (!e || applyingValue.current) return
		clearTimeout(emitTimer.current)
		emitTimer.current = setTimeout(() => {
			const current = editor()
			if (!current || applyingValue.current) return
			const html = current.toPlainHtml(false)
			lastEmitted.current = html
			props.onChange?.(html)
		}, 150)
	}

	const handle = (e: any): RichTextEditorHandle => ({
		getHTML: () => e.toPlainHtml(false),
		setHTML: (html: string) => {
			applyingValue.current = true
			try {
				e.fromHtml(html, true)
				lastEmitted.current = html
			} finally {
				applyingValue.current = false
			}
		},
		apply: (format: RichTextFormat) => {
			if (format === 'link') throw new RangeError('Use linkTo(url, anchor) to apply a link')
			if (!FORMATS[format]) throw new RangeError(`[richtext] Unsupported format: ${format}`)
			e.toggleFormatting(formatOf(format))
			emitChange()
		},
		linkTo: (url: string, anchor?: string) => {
			e.link(url, anchor ?? url, false)
			emitChange()
		},
		removeLink: () => {
			e.removeLink()
			emitChange()
		},
		isActive: (format: RichTextFormat) => {
			const applied = e.getAppliedStyles(e.getSelectionStart(), e.getSelectionEnd())
			const count = applied?.size?.() ?? 0
			const target = formatOf(format)
			for (let i = 0; i < count; i++) {
				if (applied.get(i) === target) return true
			}

			return false
		},
		undo: () => e.undo(),
		redo: () => e.redo(),
		split: () => {
			const selStart = e.getSelectionStart()
			const selEnd = e.getSelectionEnd()
			if (selStart < 0 || selEnd < 0) return false
			const start = Math.min(selStart, selEnd)
			const end = Math.max(selStart, selEnd)
			const text = e.getText()
			if (end > String(text).length) return false
			if (end > start) text.delete(start, end)
			text.insert(start, '\n')
			e.setSelection(start + 1)
			emitChange()
			return true
		},
		join: () => {
			const start = e.getSelectionStart()
			if (start <= 0 || e.getSelectionEnd() !== start) return false
			const text = e.getText()
			const s = String(text)
			if (start > s.length || s.charAt(start - 1) !== '\n') return false
			text.delete(start - 1, start)
			e.setSelection(start - 1)
			emitChange()
			return true
		},
		indent: () => {
			if (!e.isIndentAvailable()) return false
			e.indent()
			emitChange()
			return true
		},
		outdent: () => {
			if (!e.isOutdentAvailable()) return false
			e.outdent()
			emitChange()
			return true
		},
		canIndent: () => Boolean(e.isIndentAvailable()),
		canOutdent: () => Boolean(e.isOutdentAvailable()),
		focus: () => {
			e.requestFocus()
			showKeyboard(e)
		},
		blur: () => e.clearFocus(),
		isFocused: () => e.isFocused(),
		native: e,
	})

	useEffect(() => {
		const e = editor()
		if (!e || !aztec) return

		e.setOnSelectionChangedListener(
			new aztec.AztecText.OnSelectionChangedListener({
				onSelectionChanged: (start: number, end: number) =>
					props.onSelectionChange?.({
						start,
						end,
						active: activeFormats(e),
					}),
			}),
		)

		const watcher = new androidText.TextWatcher({
			beforeTextChanged: () => {},
			onTextChanged: () => {},
			afterTextChanged: () => emitChange(),
		})

		e.addTextChangedListener(watcher)

		e.setOnFocusChangeListener(
			new androidView.View.OnFocusChangeListener({
				onFocusChange: (_v: any, focused: boolean) =>
					focused ? props.onFocus?.() : props.onBlur?.(),
			}),
		)

		if (props.placeholder !== undefined) e.setHint(props.placeholder)
		setEditable(props.editable !== false)

		if (props.value !== undefined) {
			applyingValue.current = true
			try {
				e.fromHtml(props.value, true)
			} finally {
				applyingValue.current = false
			}
		}

		if (props.autofocus) {
			e.requestFocus()
			showKeyboard(e)
		}

		if (props.android) Object.assign(e, props.android)
		props.onReady?.()

		return () => {
			clearTimeout(emitTimer.current)
			e.removeTextChangedListener(watcher)
			e.setOnFocusChangeListener(null)
		}
	}, [])

	// `value` lands like a controlled prop, minus the loop: text the editor
	// emitted through onChange is never pushed back; any other change is an
	// external reset (and resets Aztec's undo stack, like PM setContent).
	useEffect(() => {
		const e = editor()
		if (!e || props.value === undefined) return
		if (props.value === lastEmitted.current) return
		applyingValue.current = true
		try {
			e.fromHtml(props.value, true)
		} finally {
			applyingValue.current = false
		}
	}, [props.value])

	useEffect(() => {
		setEditable(props.editable !== false)
	}, [props.editable])

	useEffect(() => {
		const e = editor()
		if (e && props.placeholder !== undefined) e.setHint(props.placeholder)
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
