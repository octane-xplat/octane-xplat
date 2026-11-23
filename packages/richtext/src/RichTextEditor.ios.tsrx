/** @jsxImportSource @octane-xplat/jsx */
import { useImperativeHandle, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'octane'
import { View } from '@nativescript/core'
import { registerElement } from '@octane-xplat/nativescript-octane'
import type { Attributes } from '@octane-xplat/jsx/intrinsics'
import type { RichTextEditorHandle, RichTextEditorProps, RichTextFormat } from './types'
import { layoutChildProps } from './layout-child'

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

declare module '@octane-xplat/jsx/intrinsics' {
  interface NativeElements<TElement> {
    xplatrichtext: Attributes<TElement, {}>
  }
}

registerElement('xplatrichtext', AztecEditor)

/** Whether this leaf has a working editor backend. */
export const supported: boolean = true

/** WordPress AztecEditor-iOS surface — a UITextView-backed native editor,
 *  not a WebView. Content in/out is HTML (`setHTML`/`getHTML`); JSON
 *  interchange lives one layer up in @octane-xplat/tiptap. */
export function RichTextEditor(props: RichTextEditorProps): unknown @{
  const host = useRef<any>(null)
  const lastEmitted = useRef<string | undefined>(undefined)
  const applyingValue = useRef(false)
  const emitTimer = useRef<any>(null)
  const loadedOff = useRef<(() => void) | null>(null)
  // The XplatAztecEditorView widget — created by the host view's
  // `_setupUI`, which is deferred while the tree above isn't loaded yet.
  // `null` until `loaded` delivers it; the ref and the init effect below
  // key off this.
  const [nativeView, setNativeView] = useState<any>(null)

  // The handle fires only once the native editor exists — before that a
  // consumer gets null, not a stub that throws on every method.
  useImperativeHandle<RichTextEditorHandle | null>(props.ref, () => (nativeView ? handle : null), [
    nativeView,
  ])

  // Stable identity — an inline closure re-fires ref(null)/ref(v) per
  // render, which would bounce host.current around the effects below.
  const bindHost = useCallback((v: any) => {
    loadedOff.current?.()
    loadedOff.current = null
    host.current = v
    if (!v) {
      return
    }

    if (v.ios) {
      setNativeView(v.ios)
      return
    }

    setNativeView(null)

    // `.ios` arrives with `loaded`; subscribe until it does.
    const onLoaded = () => {
      const e = editor()

      if (e) {
        setNativeView(e)
      }
    }

    v.on('loaded', onLoaded)
    loadedOff.current = () => v.off('loaded', onLoaded)
  }, [])

  const editor = () => host.current?.ios

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

      const html = current.getHTML()

      lastEmitted.current = html
      props.onChange?.(html)
    }, 150)
  }

  // Methods resolve the editor at call time so a host-view swap can't
  // strand them on a dead widget.
  const handle: RichTextEditorHandle = {
    getHTML: () => editor()?.getHTML() ?? '',
    setHTML: (html: string) => {
      const e = editor()

      if (!e) {
        return
      }

      applyingValue.current = true
      try {
        e.setHTML(html)
        lastEmitted.current = html
      } finally {
        applyingValue.current = false
      }
    },
    apply: (format: RichTextFormat) => {
      if (format === 'link') {
        throw new RangeError('Use linkTo(url, anchor) to apply a link')
      }

      if (UNSUPPORTED.has(format)) {
        throw new RangeError(
          `[richtext] apply('${format}') is not supported by the iOS Aztec surface`,
        )
      }

      const e = editor()

      if (!e) {
        return
      }

      if (!e.applyFormat(format)) {
        throw new RangeError(
          `[richtext] apply('${format}') is not supported by the iOS Aztec surface`,
        )
      }

      emitChange()
    },
    linkTo: (url: string, anchor?: string) => {
      const e = editor()

      if (!e) {
        return
      }

      e.linkTo(url, anchor ?? null)
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

      return Boolean(e && !UNSUPPORTED.has(format) && e.isFormatActive(format))
    },
    undo: () => editor()?.undo(),
    redo: () => editor()?.redo(),
    split: () => {
      const e = editor()

      if (!e) {
        return false
      }

      const ok = Boolean(e.split())

      if (ok) {
        emitChange()
      }

      return ok
    },
    join: () => {
      const e = editor()

      if (!e) {
        return false
      }

      const ok = Boolean(e.join())

      if (ok) {
        emitChange()
      }

      return ok
    },
    indent: () => {
      const e = editor()

      if (!e) {
        return false
      }

      const ok = Boolean(e.indent())

      if (ok) {
        emitChange()
      }

      return ok
    },
    outdent: () => {
      const e = editor()

      if (!e) {
        return false
      }

      const ok = Boolean(e.outdent())

      if (ok) {
        emitChange()
      }

      return ok
    },
    canIndent: () => Boolean(editor()?.canIndent()),
    canOutdent: () => Boolean(editor()?.canOutdent()),
    focus: () => editor()?.focus(),
    blur: () => editor()?.blur(),
    isFocused: () => editor()?.focused() ?? false,
    get native() {
      return editor()
    },
  }

  // Runs once the native editor exists — after `loaded` on a deferred
  // mount, or right at mount on an already-loaded tree — and again if the
  // platform view is ever recreated. Layout phase keeps the ref publish →
  // value seed → onReady order inside one commit. Listeners guard on
  // `alive` so teardown can't call back into a dead component.
  useLayoutEffect(() => {
    const e = nativeView

    if (!e) {
      return
    }

    let alive = true

    e.onTextChange = () => {
      if (alive) {
        emitChange()
      }
    }
    e.onSelectionChange = (start: number, end: number, active: any) => {
      if (!alive) {
        return
      }

      const formats: RichTextFormat[] = []
      const count = active?.count ?? 0

      for (let i = 0; i < count; i++) {
        formats.push(active.objectAtIndex(i))
      }

      props.onSelectionChange?.({ start, end, active: formats })
    }

    e.onFocus = () => {
      if (alive) {
        props.onFocus?.()
      }
    }
    e.onBlur = () => {
      if (alive) {
        props.onBlur?.()
      }
    }

    if (props.placeholder !== undefined) {
      e.placeholder = props.placeholder
    }

    e.editable = props.editable !== false

    if (props.value !== undefined) {
      applyingValue.current = true
      try {
        e.setHTML(props.value)
      } finally {
        applyingValue.current = false
      }
    }

    if (props.autofocus) {
      e.focus()
    }

    if (props.ios) {
      Object.assign(e, props.ios)
    }

    props.onReady?.()

    return () => {
      alive = false
      clearTimeout(emitTimer.current)
      e.onTextChange = null
      e.onSelectionChange = null
      e.onFocus = null
      e.onBlur = null
    }
  }, [nativeView])

  // `value` lands like a controlled prop, minus the loop: text the editor
  // emitted through onChange is never pushed back; any other change is an
  // external reset (Aztec-iOS setHTML is non-undoable, matching Android).
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
      e.setHTML(props.value)
    } finally {
      applyingValue.current = false
    }
  }, [props.value])

  useEffect(() => {
    const e = editor()

    if (e) {
      e.editable = props.editable !== false
    }
  }, [props.editable])

  useEffect(() => {
    const e = editor()

    if (e && props.placeholder !== undefined) {
      e.placeholder = props.placeholder
    }
  }, [props.placeholder])

  <xplatrichtext
    ref={bindHost}
    id={props.id}
    className={props.className}
    {...layoutChildProps(props)}
  />
}
