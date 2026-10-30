/** @jsxImportSource @octane-xplat/jsx */
import {
	useImperativeHandle,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'octane'

import { View } from '@nativescript/core'
import { registerElement } from '@nativescript-community/octane'
import type { Attributes } from '@octane-xplat/jsx/intrinsics'
import type { RichTextEditorHandle, RichTextEditorProps, RichTextFormat } from './types'
import { layoutChildProps } from './layout-child'

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

declare module '@octane-xplat/jsx/intrinsics' {
	interface NativeElements<TElement> {
		xplatrichtext: Attributes<TElement, {}>
	}
}

registerElement('xplatrichtext', AztecEditor)

/** Whether this leaf has a working editor backend. */
export const supported: boolean = true

/** Active formats at the selection, mapped back to facade spellings. */
const activeFormats = (editor: any): RichTextFormat[] => {
	const styles = editor.getAppliedStyles(editor.getSelectionStart(), editor.getSelectionEnd())

	const count = styles?.size?.() ?? 0
	const active = new Set<any>()
	for (let i = 0; i < count; i++) {
		active.add(styles.get(i))
	}

	const out: RichTextFormat[] = []
	for (const [name, get] of AZTEC_OF) {
		if (active.has(get())) {
			out.push(name)
		}
	}

	if (active.has(aztec.AztecTextFormat.FORMAT_LINK)) {
		out.push('link')
	}

	return out
}

/** WordPress Aztec surface on Android — a true Spannable-backed editor, not
 *  a WebView. Content in/out is HTML (`fromHtml`/`toPlainHtml`); JSON
 *  interchange lives one layer up in @octane-xplat/tiptap. */
export function RichTextEditor(props: RichTextEditorProps): unknown @{
	const host = useRef<any>(null)
	const lastEmitted = useRef<string | undefined>(undefined)
	const applyingValue = useRef(false)
	const keyListener = useRef<any>(null)
	const emitTimer = useRef<any>(null)
	const loadedOff = useRef<(() => void) | null>(null)
	// The AztecText widget — created by the host view's `_setupUI`, which is
	// deferred while the tree above isn't loaded yet. `null` until `loaded`
	// delivers it; the ref and the init effect below key off this.
	const [nativeView, setNativeView] = useState<any>(null)

	// The handle fires only once the native editor exists — before that a
	// consumer gets null, not a stub that throws on every method.
	useImperativeHandle<RichTextEditorHandle | null>(props.ref, () => (nativeView ? handle : null), [
		nativeView,
	])

	const bindHost = useCallback((v: any) => {
		loadedOff.current?.()
		loadedOff.current = null
		host.current = v
		if (!v) {
			return
		}

		if (v.android) {
			setNativeView(v.android)
			return
		}

		setNativeView(null)
		// `.android` arrives with `loaded`; subscribe until it does.
		const onLoaded = () => {
			const e = editor()
			if (e) {
				setNativeView(e)
			}
		}

		v.on('loaded', onLoaded)
		loadedOff.current = () => v.off('loaded', onLoaded)
	}, [])

	const editor = () => host.current?.android

	const setEditable = (next: boolean) => {
		const e = editor()
		if (!e) {
			return
		}

		if (keyListener.current == null) {
			keyListener.current = e.getKeyListener()
		}

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
			const imm = e
				.getContext()
				.getSystemService((globalThis as any).android.content.Context.INPUT_METHOD_SERVICE)

			imm?.showSoftInput(e, androidView.inputmethod.InputMethodManager.SHOW_IMPLICIT)
		} catch {}
	}

	const emitChange = () => {
		const e = editor()
		if (!e || applyingValue.current) {
			return
		}

		clearTimeout(emitTimer.current)
		emitTimer.current = setTimeout(() => {
			const current = editor()
			if (!current || applyingValue.current) {
				return
			}

			const html = current.toPlainHtml(false)
			lastEmitted.current = html
			props.onChange?.(html)
		}, 150)
	}

	// Methods resolve the editor at call time so a host-view swap can't
	// strand them on a dead widget.
	const handle: RichTextEditorHandle = {
		getHTML: () => editor()?.toPlainHtml(false) ?? '',
		setHTML: (html: string) => {
			const e = editor()
			if (!e) {
				return
			}

			applyingValue.current = true
			try {
				e.fromHtml(html, true)
				lastEmitted.current = html
			} finally {
				applyingValue.current = false
			}
		},
		apply: (format: RichTextFormat) => {
			if (format === 'link') {
				throw new RangeError('Use linkTo(url, anchor) to apply a link')
			}

			if (!FORMATS[format]) {
				throw new RangeError(`[richtext] Unsupported format: ${format}`)
			}

			const e = editor()
			if (!e) {
				return
			}

			e.toggleFormatting(formatOf(format))
			emitChange()
		},
		linkTo: (url: string, anchor?: string) => {
			const e = editor()
			if (!e) {
				return
			}

			e.link(url, anchor ?? url, false)
			emitChange()
		},
		removeLink: () => {
			const e = editor()
			if (!e) {
				return
			}

			e.removeLink()
			emitChange()
		},
		isActive: (format: RichTextFormat) => {
			const e = editor()
			if (!e) {
				return false
			}

			const applied = e.getAppliedStyles(e.getSelectionStart(), e.getSelectionEnd())
			const count = applied?.size?.() ?? 0
			const target = formatOf(format)
			for (let i = 0; i < count; i++) {
				if (applied.get(i) === target) {
					return true
				}
			}

			return false
		},
		undo: () => editor()?.undo(),
		redo: () => editor()?.redo(),
		split: () => {
			const e = editor()
			if (!e) {
				return false
			}

			const selStart = e.getSelectionStart()
			const selEnd = e.getSelectionEnd()
			if (selStart < 0 || selEnd < 0) {
				return false
			}

			const start = Math.min(selStart, selEnd)
			const end = Math.max(selStart, selEnd)
			const text = e.getText()
			if (end > String(text).length) {
				return false
			}

			if (end > start) {
				text.delete(start, end)
			}

			text.insert(start, '\n')
			e.setSelection(start + 1)
			emitChange()
			return true
		},
		join: () => {
			const e = editor()
			if (!e) {
				return false
			}

			const start = e.getSelectionStart()
			if (start <= 0 || e.getSelectionEnd() !== start) {
				return false
			}

			const text = e.getText()
			const s = String(text)
			if (start > s.length || s.charAt(start - 1) !== '\n') {
				return false
			}

			text.delete(start - 1, start)
			e.setSelection(start - 1)
			emitChange()
			return true
		},
		indent: () => {
			const e = editor()
			if (!e || !e.isIndentAvailable()) {
				return false
			}

			e.indent()
			emitChange()
			return true
		},
		outdent: () => {
			const e = editor()
			if (!e || !e.isOutdentAvailable()) {
				return false
			}

			e.outdent()
			emitChange()
			return true
		},
		canIndent: () => Boolean(editor()?.isIndentAvailable()),
		canOutdent: () => Boolean(editor()?.isOutdentAvailable()),
		focus: () => {
			const e = editor()
			if (!e) {
				return
			}

			e.requestFocus()
			showKeyboard(e)
		},
		blur: () => editor()?.clearFocus(),
		isFocused: () => editor()?.isFocused() ?? false,
		get native() {
			return editor()
		},
	}

	// Runs once the native editor exists — after `loaded` on a deferred
	// mount, or right at mount on an already-loaded tree — and again if the
	// platform view is ever recreated. Layout phase keeps the ref publish →
	// value seed → onReady order inside one commit. Listeners guard on
	// `alive` so teardown (or a Kotlin setter that won't take null) can't
	// call back into a dead component.
	useLayoutEffect(() => {
		const e = nativeView
		if (!e || !aztec) {
			return
		}

		let alive = true

		e.setOnSelectionChangedListener(
			new aztec.AztecText.OnSelectionChangedListener({
				onSelectionChanged: (start: number, end: number) => {
					if (alive) {
						props.onSelectionChange?.({
							start,
							end,
							active: activeFormats(e),
						})
					}
				},
			}),
		)

		const watcher = new androidText.TextWatcher({
			beforeTextChanged: () => {},
			onTextChanged: () => {},
			afterTextChanged: () => {
				if (alive) {
					emitChange()
				}
			},
		})

		e.addTextChangedListener(watcher)

		e.setOnFocusChangeListener(
			new androidView.View.OnFocusChangeListener({
				onFocusChange: (_v: any, focused: boolean) => {
					if (alive) {
						focused ? props.onFocus?.() : props.onBlur?.()
					}
				},
			}),
		)

		if (props.placeholder !== undefined) {
			e.setHint(props.placeholder)
		}

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

		if (props.android) {
			Object.assign(e, props.android)
		}

		props.onReady?.()

		return () => {
			alive = false
			clearTimeout(emitTimer.current)
			e.removeTextChangedListener?.(watcher)
			e.setOnFocusChangeListener?.(null)
			keyListener.current = null
		}
	}, [nativeView])

	// `value` lands like a controlled prop, minus the loop: text the editor
	// emitted through onChange is never pushed back; any other change is an
	// external reset (and resets Aztec's undo stack, like PM setContent).
	useEffect(() => {
		const e = editor()
		if (!e || props.value === undefined) {
			return
		}

		if (props.value === lastEmitted.current) {
			return
		}

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
		if (e && props.placeholder !== undefined) {
			e.setHint(props.placeholder)
		}
	}, [props.placeholder])

	<xplatrichtext
		ref={bindHost}
		id={props.id}
		className={props.className}
		{...layoutChildProps(props)}
	/>
}
