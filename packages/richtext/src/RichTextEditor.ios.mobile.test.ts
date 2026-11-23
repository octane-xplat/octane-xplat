import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushUniversalSync } from 'octane/universal/native'

// Faithful @nativescript/core stand-in: the lifecycle contract the real
// ViewBase/LayoutBase enforce — `.ios` is created by `createNativeView`
// inside `_setupUI`, which only runs once an ancestor holds a context;
// `loaded` fires on the view after that. Attaching to a not-yet-loaded
// parent defers both, which is exactly the window the leaf must survive.
const ns = vi.hoisted(() => {
  class ViewBase {
    _context: any = null
    _iosView: any = null
    _isLoaded = false
    _isAddedToNativeVisualTree = false
    parent: any = null
    _children: any[] = []
    _listeners = new Map<string, any[]>()
    style: any = {}
    className: any
    visibility: any = 'visible'
    id: any
    get ios() {
      return this._iosView
    }
    get isLoaded() {
      return this._isLoaded
    }
    get typeName() {
      return this.constructor.name
    }
    createNativeView(): any {
      return {}
    }
    on(name: string, cb: any) {
      let list = this._listeners.get(name)

      if (!list) {
        this._listeners.set(name, (list = []))
      }

      list.push(cb)
    }
    off(name: string, cb: any) {
      const list = this._listeners.get(name)
      const index = list?.indexOf(cb) ?? -1

      if (index >= 0) {
        list!.splice(index, 1)
      }
    }
    notify(event: { eventName: string }) {
      this._emit(event.eventName, event)
    }
    _emit(name: string, data?: any) {
      const listeners = [...(this._listeners.get(name) ?? [])]

      for (const cb of listeners) {
        cb(data ?? { eventName: name, object: this })
      }
    }
    eachChild(cb: (child: any) => boolean | void) {
      const children = [...this._children]

      for (const child of children) {
        if (cb(child) === false) {
          break
        }
      }
    }
    _addViewToNativeVisualTree(_view: any, _atIndex?: number) {
      return true
    }
    _setupUI(context: any, atIndex?: number) {
      if (this._context === context) {
        return
      }

      this._context = context
      if (!this._iosView) {
        this._iosView = this.createNativeView()
      }

      if (this.parent) {
        this._isAddedToNativeVisualTree = this.parent._addViewToNativeVisualTree(this, atIndex)
      }

      this.eachChild((child) => void child._setupUI(context))
    }
    _setupAsRootView(context: any) {
      this._setupUI(context)
    }
    _addViewCore(view: any, atIndex?: number) {
      if (this._context) {
        view._setupUI(this._context, atIndex)
      }

      if (this._isLoaded) {
        this.loadView(view)
      }
    }
    loadView(view: any) {
      if (view && !view.isLoaded) {
        view.callLoaded()
      }
    }
    callLoaded() {
      this.onLoaded()
    }
    onLoaded() {
      if (this._isLoaded) {
        return
      }

      this._isLoaded = true
      this.eachChild((child) => void this.loadView(child))
      this._emit('loaded')
    }
    callUnloaded() {
      this.onUnloaded()
    }
    onUnloaded() {
      if (!this._isLoaded) {
        return
      }

      this._isLoaded = false
      this._emit('unloaded')
    }
  }

  class View extends ViewBase {}
  class LayoutBase extends View {
    insertChild(view: any, index: number) {
      const at = Math.max(0, Math.min(index, this._children.length))

      this._children.splice(at, 0, view)
      view.parent = this
      this._addViewCore(view, at)
    }
    removeChild(view: any) {
      const index = this._children.indexOf(view)

      if (index >= 0) {
        this._children.splice(index, 1)
      }

      view.parent = null
    }
    getChildrenCount() {
      return this._children.length
    }
  }

  class ContentView extends View {
    _content: any = null
    get content() {
      return this._content
    }
    set content(view: any) {
      if (this._content) {
        this._content.parent = null
      }

      this._content = view ?? null
      if (view) {
        view.parent = this
        this._addViewCore(view)
      }
    }
  }

  class TextBase extends View {
    text = ''
    formattedText: any = null
  }

  class FormattedString extends ViewBase {
    spans: any[] = []
  }

  class Span extends ViewBase {}
  class ListView extends View {}
  class TabView extends View {
    items: any[] = []
  }

  class TabViewItem extends ViewBase {
    view: any = null
  }

  class ActionBar extends View {
    titleView: any = null
  }

  class Page extends ContentView {}
  class Button extends TextBase {}
  class Placeholder extends View {
    creatingView?: () => any
    createNativeView() {
      return this.creatingView?.() ?? {}
    }
  }

  class AbsoluteLayout extends LayoutBase {}
  class DockLayout extends LayoutBase {}
  class FlexboxLayout extends LayoutBase {}
  class GridLayout extends LayoutBase {}
  class RootLayout extends LayoutBase {}
  class StackLayout extends LayoutBase {}
  class WrapLayout extends LayoutBase {}

  class ActionItem extends ViewBase {}
  class ActivityIndicator extends View {}
  class DatePicker extends View {}
  class Frame extends View {}
  class HtmlView extends TextBase {}
  class Image extends View {}
  class Label extends TextBase {}
  class ListPicker extends View {}
  class LiquidGlass extends View {}
  class NavigationButton extends Button {}
  class Progress extends View {}
  class ProxyViewContainer extends View {}
  class ScrollView extends View {}
  class SearchBar extends TextBase {}
  class SegmentedBar extends View {}
  class SegmentedBarItem extends ViewBase {}
  class Slider extends View {}
  class Switch extends View {}
  class TextField extends TextBase {}
  class TextView extends TextBase {}
  class TimePicker extends View {}
  class WebView extends View {}

  const unsetValue = Symbol('unsetValue')

  return {
    ViewBase,
    View,
    LayoutBase,
    ContentView,
    TextBase,
    FormattedString,
    Span,
    ListView,
    TabView,
    TabViewItem,
    ActionBar,
    Page,
    Button,
    Placeholder,
    AbsoluteLayout,
    DockLayout,
    FlexboxLayout,
    GridLayout,
    RootLayout,
    StackLayout,
    WrapLayout,
    ActionItem,
    ActivityIndicator,
    DatePicker,
    Frame,
    HtmlView,
    Image,
    Label,
    ListPicker,
    LiquidGlass,
    NavigationButton,
    Progress,
    ProxyViewContainer,
    ScrollView,
    SearchBar,
    SegmentedBar,
    SegmentedBarItem,
    Slider,
    Switch,
    TextField,
    TextView,
    TimePicker,
    WebView,
    unsetValue,
  }
})

// XplatAztecEditorView facade — the leaf reads the global inside
// `createNativeView`, so the fake records what the leaf writes (html seeds,
// callback props, editable plumbing) and lets the test fire the same
// callbacks the Swift facade would.
const fake = vi.hoisted(() => {
  class FakeAztecEditor {
    static created: FakeAztecEditor[] = []
    html = ''
    htmlCalls: string[] = []
    onTextChange: any = null
    onSelectionChange: any = null
    onFocus: any = null
    onBlur: any = null
    placeholder: any = undefined
    editable: boolean | undefined = undefined
    focusedFlag = false
    constructor() {
      FakeAztecEditor.created.push(this)
    }
    getHTML() {
      return this.html
    }
    setHTML(html: string) {
      this.htmlCalls.push(html)
      this.html = html
      this.onTextChange?.()
    }
    applyFormat() {
      return true
    }
    linkTo() {}
    removeLink() {}
    isFormatActive() {
      return false
    }
    undo() {}
    redo() {}
    split() {
      return true
    }
    join() {
      return true
    }
    indent() {
      return true
    }
    outdent() {
      return true
    }
    canIndent() {
      return true
    }
    canOutdent() {
      return true
    }
    focus() {
      this.focusedFlag = true
    }
    blur() {
      this.focusedFlag = false
    }
    focused() {
      return this.focusedFlag
    }
    fireTextChanged() {
      this.onTextChange?.()
    }
    fireSelection(start: number, end: number) {
      this.onSelectionChange?.(start, end, { count: 0, objectAtIndex: () => undefined })
    }
    fireFocus(focused: boolean) {
      this.focusedFlag = focused
      if (focused) {
        this.onFocus?.()
      } else {
        this.onBlur?.()
      }
    }
  }

  ;(globalThis as any).XplatAztecEditorView = FakeAztecEditor

  return { FakeAztecEditor }
})

vi.mock('@nativescript/core', () => ns)
// These fake views have no registered NativeScript properties. Keep the
// driver's registry lookup inside the same host-independent boundary.
vi.mock('@nativescript/core/ui/core/properties', () => ({
  _getProperties: () => [],
  _getStyleProperties: () => [],
}))

import { createNativeScriptRoot } from '@octane-xplat/nativescript-octane'
import { RichTextEditor } from './RichTextEditor.ios.tsrx'

const CONTEXT = { name: 'uikit-context' }
const roots: any[] = []

function mount(host: any, props: any) {
  const root = createNativeScriptRoot(host)

  roots.push(root)
  root.render(RichTextEditor, props)
  return root
}

/** Microtask drain: passive effects and scheduled re-renders all run on the
 *  root's promise scheduler. */
async function settle() {
  for (let i = 0; i < 20; i++) {
    await Promise.resolve()
  }

  flushUniversalSync(() => {})
}

/** Attach the host tree to a context and fire `loaded` down it — the NS
 *  semantics for a page becoming visible. */
async function attachTree(host: any) {
  host._setupUI(CONTEXT)
  host.callLoaded()
  await settle()
}

function leafView(host: any) {
  return host._children[0]
}

function leafIOS(host: any) {
  return leafView(host)?._iosView ?? null
}

beforeEach(() => {
  fake.FakeAztecEditor.created.length = 0
})

afterEach(() => {
  for (const root of roots.splice(0)) {
    try {
      root.unmount()
    } catch {}
  }
})

describe('RichTextEditor (iOS leaf) native-view readiness', () => {
  it('applies props and fires onReady once when the tree is already loaded', async () => {
    const host = new ns.GridLayout()

    host._setupUI(CONTEXT)
    host.callLoaded()

    const onReady = vi.fn()
    const refs: any[] = []

    mount(host, {
      value: '<p>hi</p>',
      onReady,
      ref: (h: any) => refs.push(h),
    })

    await settle()

    const editor = leafIOS(host)

    expect(editor).toBeInstanceOf(fake.FakeAztecEditor)
    expect(onReady).toHaveBeenCalledTimes(1)
    expect(editor.htmlCalls).toContain('<p>hi</p>')
    expect(refs.at(-1)).toBeTruthy()
    expect(refs.at(-1).getHTML()).toBe('<p>hi</p>')
  })

  it('holds all initialization until the native view exists', async () => {
    const host = new ns.GridLayout()
    const onReady = vi.fn()
    const refs: any[] = []

    mount(host, {
      value: '<p>deferred</p>',
      placeholder: 'Write…',
      editable: false,
      onReady,
      ref: (h: any) => refs.push(h),
    })

    await settle()

    // Mounted but the host tree never loaded: no native editor yet.
    expect(leafView(host)).toBeTruthy()
    expect(leafIOS(host)).toBeNull()
    expect(onReady).not.toHaveBeenCalled()

    await attachTree(host)

    const editor = leafIOS(host)

    expect(editor).toBeInstanceOf(fake.FakeAztecEditor)
    expect(onReady).toHaveBeenCalledTimes(1)
    expect(editor.htmlCalls).toContain('<p>deferred</p>')
    expect(editor.placeholder).toBe('Write…')
    expect(editor.editable).toBe(false)
    expect(refs.at(-1)).toBeTruthy()
    expect(refs.at(-1).getHTML()).toBe('<p>deferred</p>')
  })

  it('fires the imperative ref only once the editor exists', async () => {
    const host = new ns.GridLayout()
    const refs: any[] = []

    mount(host, { ref: (h: any) => refs.push(h) })
    await settle()

    const latest = refs.filter((h) => h != null).at(-1)

    expect(latest === undefined || latest.native == null).toBe(true)

    await attachTree(host)

    const handle = refs.filter((h) => h != null).at(-1)

    expect(handle).toBeTruthy()
    expect(handle.native).toBe(leafIOS(host))
    expect(() => handle.setHTML('<p>via ref</p>')).not.toThrow()
    expect(leafIOS(host).html).toBe('<p>via ref</p>')
  })

  it('emits onChange and selection/focus events only from the attached editor', async () => {
    const host = new ns.GridLayout()
    const onChange = vi.fn()
    const onSelectionChange = vi.fn()
    const onFocus = vi.fn()
    const onBlur = vi.fn()

    mount(host, { onChange, onSelectionChange, onFocus, onBlur })
    await settle()

    await attachTree(host)

    const editor = leafIOS(host)

    editor.fireSelection(1, 3)
    expect(onSelectionChange).toHaveBeenCalledWith({ start: 1, end: 3, active: [] })

    editor.fireFocus(true)
    editor.fireFocus(false)
    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onBlur).toHaveBeenCalledTimes(1)

    editor.fireTextChanged()
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(onChange).toHaveBeenCalled()
  })

  it('re-applies an externally changed value prop after ready', async () => {
    const host = new ns.GridLayout()
    const root = mount(host, { value: '<p>one</p>' })

    await attachTree(host)

    const editor = leafIOS(host)

    expect(editor.htmlCalls.at(-1)).toBe('<p>one</p>')

    root.render(RichTextEditor, { value: '<p>two</p>' })
    await settle()
    expect(editor.htmlCalls.at(-1)).toBe('<p>two</p>')
  })

  it('parks a value update that lands while the native view is pending', async () => {
    const host = new ns.GridLayout()
    const root = mount(host, { value: '<p>one</p>' })

    await settle()

    root.render(RichTextEditor, { value: '<p>two</p>' })
    await settle()
    expect(fake.FakeAztecEditor.created).toHaveLength(0)

    await attachTree(host)
    expect(leafIOS(host).htmlCalls.at(-1)).toBe('<p>two</p>')
  })

  it('disposes listeners and pending readiness on unmount', async () => {
    const host = new ns.GridLayout()
    const onReady = vi.fn()
    const refs: any[] = []
    const root = mount(host, { onReady, ref: (h: any) => refs.push(h) })

    await settle()

    // Unmount before the tree ever loads: the loaded subscription must
    // not fire into a dead component.
    root.unmount()
    expect(refs.at(-1)).toBeNull()
    await attachTree(host)
    expect(onReady).not.toHaveBeenCalled()

    // Second mount: ready, then unmount — a queued emit and every
    // listener are dropped, the ref detaches.
    const host2 = new ns.GridLayout()
    const onChange2 = vi.fn()
    const onSelectionChange2 = vi.fn()
    const onFocus2 = vi.fn()
    const refs2: any[] = []
    const root2 = mount(host2, {
      onChange: onChange2,
      onSelectionChange: onSelectionChange2,
      onFocus: onFocus2,
      ref: (h: any) => refs2.push(h),
    })

    roots.push(root2)
    await attachTree(host2)

    const editor = leafIOS(host2)

    editor.fireTextChanged()
    root2.unmount()
    editor.fireTextChanged()
    editor.fireSelection(0, 1)
    editor.fireFocus(true)
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(onChange2).not.toHaveBeenCalled()
    expect(onSelectionChange2).not.toHaveBeenCalled()
    expect(onFocus2).not.toHaveBeenCalled()
    expect(refs2.at(-1)).toBeNull()
    expect(editor.onTextChange).toBeNull()
    expect(editor.onSelectionChange).toBeNull()
    expect(editor.onFocus).toBeNull()
    expect(editor.onBlur).toBeNull()
  })

  it('fires onReady once across later re-renders', async () => {
    const host = new ns.GridLayout()
    const onReady = vi.fn()
    const root = mount(host, { onReady, placeholder: 'a' })

    await attachTree(host)
    expect(onReady).toHaveBeenCalledTimes(1)

    root.render(RichTextEditor, { onReady, placeholder: 'b' })
    await settle()
    expect(onReady).toHaveBeenCalledTimes(1)
    expect(leafIOS(host).placeholder).toBe('b')
  })
})
