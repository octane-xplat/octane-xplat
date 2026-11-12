import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript-classic'

const source = ts.transpileModule(
  readFileSync(
    new URL('../src/components/collections/tab-control.windows.ts', import.meta.url),
    'utf8',
  ),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

function fixture() {
  const types = new Map()
  let focused
  let control = false
  const tasks = new Map()
  let nextTask = 0
  const createdTabs = []
  class Vector extends Array {
    constructor(owner) {
      super()
      this.owner = owner
    }
    Append(value) {
      this.InsertAt(this.length, value)
    }
    InsertAt(index, value) {
      if (index < 0 || index > this.length) {
        throw new RangeError('Invalid WinRT vector insertion')
      }

      if (value.Parent) {
        throw new Error('Native element already has a parent')
      }

      value.Parent = this.owner
      this.splice(index, 0, value)
    }
    RemoveAt(index) {
      this.splice(index, 1)[0].Parent = undefined
    }
    Clear() {
      for (const child of this) {
        child.Parent = undefined
      }

      this.length = 0
    }
  }

  class Panel {
    Children = new Vector(this)
  }

  class View {
    isEnabled = true
    isLoaded = false
    children = []
    onLoaded() {
      this.isLoaded = true
    }
    onUnloaded() {
      this.isLoaded = false
    }
    disposeNativeView() {}
    _tearDownUI() {
      for (const child of this.children) {
        this._removeViewFromNativeVisualTree(child)
      }

      this.disposeNativeView()
    }
    getChildrenCount() {
      return this.children.length
    }
    getChildAt(index) {
      return this.children[index]
    }
    eachChildView(callback) {
      for (const child of this.children) {
        if (callback(child) === false) {
          break
        }
      }
    }
    _removeViewFromNativeVisualTree(child) {
      child._isAddedToNativeVisualTree = false
    }
  }

  class Property {
    constructor(options) {
      this.options = options
    }
    register(Type) {
      const { name, valueChanged } = this.options
      const key = Symbol(name)

      Object.defineProperty(Type.prototype, name, {
        get() {
          return this[key]
        },
        set(value) {
          const previous = this[key]

          this[key] = value
          valueChanged(this, previous, value)
        },
      })
    }
  }

  class NativeTabs {
    peers = []
    constructor(xaml) {
      for (const _match of xaml.matchAll(/x:Name="XplatTab\d+"/g)) {
        this.peers.push(new NativeItem())
      }

      createdTabs.push(this)
    }
    get TabItems() {
      throw new Error('Use the proven named XAML slots, not the failing collection projection')
    }
    FindName(name) {
      return this.peers[Number(name.replace('XplatTab', ''))]
    }
    footer = null
    get TabStripFooter() {
      return this.footer
    }
    set TabStripFooter(value) {
      if (this.footer) {
        this.footer.Parent = undefined
      }

      if (value?.Parent) {
        throw new Error('Native footer already has a parent')
      }

      if (value) {
        value.Parent = this
      }

      this.footer = value
    }
    index = -1
    eventDepth = 0
    reentrantWrites = []
    get SelectedIndex() {
      return this.index
    }
    set SelectedIndex(value) {
      if (value === this.index) {
        return
      }

      if (this.eventDepth) {
        this.reentrantWrites.push(value)
      }

      this.index = value
      this.eventDepth++
      try {
        this.SelectionChanged?.()
      } finally {
        this.eventDepth--
      }
    }
  }

  class NativeItem {
    header = null
    get Header() {
      return this.header
    }
    set Header(value) {
      if (value === this.header) {
        return
      }

      if (this.header) {
        this.header.Parent = undefined
      }

      if (value?.Parent) {
        throw new Error('Native header already has a parent')
      }

      if (value) {
        value.Parent = this
      }

      this.header = value
    }
    FocusState = 0
    Focus() {
      if (!this.IsEnabled || !this.IsTabStop) {
        return false
      }

      if (focused) {
        focused.FocusState = 0
      }

      focused = this
      this.FocusState = 1
      return true
    }
  }

  const Microsoft = {
    UI: {
      Input: { InputKeyboardSource: { GetKeyStateForCurrentThread: () => (control ? 1 : 0) } },
      Xaml: {
        Controls: {
          Grid: Panel,
          StackPanel: Panel,
          Orientation: { Horizontal: 0 },
          TabViewWidthMode: { Equal: 0, SizeToContent: 1 },
        },
        FocusState: { Unfocused: 0, Keyboard: 1 },
        HorizontalAlignment: { Left: 0 },
        Automation: {
          AutomationProperties: {
            SetName: (peer, name) => {
              peer.name = name
            },
            SetAutomationId: (peer, id) => {
              peer.id = id
            },
          },
        },
        Markup: {
          XamlReader: {
            Load: (xaml) => new NativeTabs(xaml),
          },
        },
      },
    },
  }

  vm.runInNewContext(source, {
    exports: {},
    setTimeout: (callback) => {
      const id = ++nextTask

      tasks.set(id, callback)
      return id
    },
    clearTimeout: (id) => tasks.delete(id),
    require: (name) => {
      if (name === '@nativescript/core') {
        return { View, ContentView: View, LayoutBase: View, Property }
      }

      if (name === '@nativescript-community/octane') {
        return { registerElement: (name, type) => types.set(name, type) }
      }

      if (name === '@octane-xplat/platform/windows') {
        return { Microsoft, NSWinRT: { asDelegate: (_type, callback) => callback } }
      }

      throw new Error(name)
    },
  })

  const Strip = types.get('xplatwindowstabstrip')
  const Header = types.get('xplatwindowstabheader')
  const strip = new Strip()

  strip.settings = { value: 'a', layout: 'fill' }
  strip.nativeViewProtected = strip.createNativeView()

  const calls = []
  function header(value, disabled = false, index = strip.children.length) {
    const view = new Header()

    view.nativeViewProtected = new Panel()
    view.settings = {
      value,
      disabled,
      label: value.toUpperCase(),
      request: () => calls.push(value),
    }

    view.id = 'tab-' + value
    insert(view, index)
    return view
  }

  function insert(view, index) {
    strip.children.splice(index, 0, view)
    assert.equal(strip._addViewToNativeVisualTree(view, index), true)
  }

  function remove(view) {
    strip._removeViewFromNativeVisualTree(view)
    strip.children.splice(strip.children.indexOf(view), 1)
  }

  function key(code, options = {}) {
    const args = { Key: code, Handled: false, ...options }
    const tabs = strip.nativeViewProtected.Children[0]

    tabs.PreviewKeyDown?.(tabs, args)
    return args
  }

  return {
    strip,
    get tabs() {
      return strip.nativeViewProtected.Children[0]
    },
    createdTabs,
    tasks,
    flushTasks() {
      for (const [id, callback] of Array.from(tasks)) {
        tasks.delete(id)
        callback()
      }
    },
    header,
    calls,
    insert,
    remove,
    key,
    View,
    Panel,
    setControl: (value) => {
      control = value
    },
  }
}

test('Windows panel tabs retain rich native headers and controlled selection across rejected and accepted UIA requests', () => {
  const f = fixture()
  const a = f.header('a')

  f.header('disabled', true)

  const b = f.header('b')

  f.strip.onLoaded()
  assert.equal(a.peer.Header, a.nativeViewProtected)
  assert.equal(b.peer.name, 'B')
  assert.equal(b.peer.id, 'tab-b')
  assert.equal(f.tabs.SelectedIndex, 0)
  f.tabs.SelectedIndex = 2
  assert.deepEqual(f.calls, ['b'])
  assert.deepEqual(f.tabs.reentrantWrites, [], 'do not roll back inside the native event stack')
  assert.equal(f.tabs.SelectedIndex, 2, 'allow the native selection stack to finish')
  f.flushTasks()
  assert.equal(
    f.tabs.SelectedIndex,
    0,
    'rejected request restores the model without echo callbacks',
  )

  f.strip.settings = { value: 'b', layout: 'hug' }
  assert.equal(f.tabs.SelectedIndex, 2)
  assert.equal(f.tabs.TabWidthMode, 1)
  assert.deepEqual(f.calls, ['b'], 'controlled prop updates do not report a second request')
  assert.deepEqual(
    Array.from(f.tabs.peers, (peer) => peer.IsTabStop),
    [false, false, true],
  )
})

test('Windows UIA selection settles the latest controlled value after the native selection stack returns', () => {
  const f = fixture()

  f.header('a')

  const b = f.header('b')

  f.strip.onLoaded()
  b.settings = {
    ...b.settings,
    request: () => {
      f.calls.push('b')
      f.strip.settings = { value: 'b', layout: 'fill' }
    },
  }

  f.tabs.SelectedIndex = 1
  // Model the native selection finalizer overwriting a reentrant prop write.
  f.tabs.index = 0
  f.flushTasks()
  assert.equal(f.tabs.SelectedIndex, 1)
  assert.deepEqual(f.calls, ['b'], 'settling must not issue another request')
  assert.deepEqual(
    Array.from(f.tabs.peers, (peer) => peer.IsTabStop),
    [false, true],
  )

  f.tabs.SelectedIndex = 0
  f.tabs.index = 0
  f.flushTasks()
  assert.equal(f.tabs.SelectedIndex, 1, 'rejected requests settle back to the model too')
})

test('Windows selection settlement ignores a retired native tree after unload or rebuild', () => {
  const f = fixture()

  f.header('a')
  f.header('b')
  f.strip.onLoaded()
  f.tabs.SelectedIndex = 1

  const stale = [...f.tasks.values()][0]

  f.strip.onUnloaded()
  assert.equal(f.tasks.size, 0)
  f.strip.onLoaded()
  f.strip.settings = { value: 'b', layout: 'fill' }
  f.tabs.index = 0
  stale()
  assert.equal(f.tabs.SelectedIndex, 0, 'an already dispatched stale timer must not write')
  f.tabs.SelectedIndex = 1
  f.tabs.SelectedIndex = 0
  f.header('c')
  assert.equal(f.tasks.size, 0, 'structural replacement cancels pending selection work')
})

test('Windows tab arrow/Home/End keys select exactly once, skip disabled tabs and respect handled/modifier keys', () => {
  const f = fixture()
  const a = f.header('a')

  f.header('disabled', true)

  const b = f.header('b')

  f.strip.onLoaded()
  a.peer.Focus()
  assert.equal(f.key(39).Handled, true)
  assert.deepEqual(f.calls, ['b'])
  assert.equal(b.peer.FocusState, 1)
  assert.equal(f.tabs.SelectedIndex, 0)
  f.strip.settings = { value: 'b', layout: 'fill' }
  assert.equal(f.key(36).Handled, true)
  assert.deepEqual(f.calls, ['b', 'a'])
  f.strip.settings = { value: 'a', layout: 'fill' }
  f.key(35)
  assert.deepEqual(f.calls, ['b', 'a', 'b'])
  f.setControl(true)
  assert.equal(f.key(37).Handled, false)
  f.setControl(false)
  f.key(37, { Handled: true })
  f.key(37, { KeyStatus: { IsMenuKeyDown: true } })
  assert.deepEqual(f.calls, ['b', 'a', 'b'])
})

test('Windows tabs use current labels, disabled state and callbacks, and ignore stale handlers after unload', () => {
  const f = fixture()

  f.header('a')

  const b = f.header('b')

  f.strip.onLoaded()

  const stale = f.tabs.SelectionChanged

  b.settings = {
    value: 'b',
    label: 'Updated B',
    disabled: true,
    request: () => f.calls.push('stale'),
  }

  assert.equal(b.peer.name, 'Updated B')
  assert.equal(b.peer.IsEnabled, false)
  f.tabs.SelectedIndex = 1
  f.flushTasks()
  assert.equal(f.tabs.SelectedIndex, 0)
  assert.deepEqual(f.calls, [])
  b.settings = { ...b.settings, disabled: false, request: () => f.calls.push('current') }
  f.tabs.SelectedIndex = 1
  assert.deepEqual(f.calls, ['current'])
  f.strip.onUnloaded()
  assert.equal(f.tabs.SelectionChanged, null)
  assert.equal(f.tabs.PreviewKeyDown, null)
  stale()
  assert.deepEqual(f.calls, ['current'])
  f.strip.onLoaded()
  stale()
  assert.deepEqual(
    f.calls,
    ['current'],
    'delegates from a prior load stay inactive after reloading',
  )

  f.tabs.SelectedIndex = 1
  assert.deepEqual(f.calls, ['current', 'current'])
})

test('Windows tabs preserve order and footer content during insertion, removal and native remount', () => {
  const f = fixture()
  const a = f.header('a')
  const footer = new f.View()

  footer.nativeViewProtected = new f.Panel()
  f.insert(footer, 1)

  const b = f.header('b')
  const first = f.header('first', false, 0)

  f.strip.onLoaded()
  assert.deepEqual(
    Array.from(f.tabs.peers, (peer) => peer.name),
    ['FIRST', 'A', 'B'],
  )

  assert.equal(f.tabs.TabStripFooter.Children[0], footer.nativeViewProtected)
  f.remove(first)
  f.remove(b)
  assert.equal(b.peer, undefined)
  assert.equal(b.owner, undefined)
  f.insert(b, 0)
  assert.deepEqual(
    Array.from(f.tabs.peers, (peer) => peer.name),
    ['B', 'A'],
  )

  assert.equal(f.tabs.SelectedIndex, 1)
  f.remove(footer)
  assert.equal(f.tabs.TabStripFooter, null)
  f.strip.onUnloaded()
  f.strip.disposeNativeView()
  assert.equal(a.peer, undefined)
  assert.equal(b.owner, undefined)
})

test('Windows native recreation attaches an already populated logical tree without an insertion index', () => {
  const f = fixture()
  const a = f.header('a')
  const b = f.header('b')
  const footer = new f.View()

  footer.nativeViewProtected = new f.Panel()
  f.insert(footer, 1)
  f.strip.disposeNativeView()
  f.strip.nativeViewProtected = f.strip.createNativeView()
  // NativeScript recursively recreates children without atIndex. Both logical
  // siblings already exist, unlike incremental renderer insertion.
  f.strip._addViewToNativeVisualTree(a)
  f.strip._addViewToNativeVisualTree(footer)
  f.strip._addViewToNativeVisualTree(b)

  const tabs = f.strip.nativeViewProtected.Children[0]

  assert.deepEqual(
    Array.from(tabs.peers, (peer) => peer.name),
    ['A', 'B'],
  )

  assert.equal(tabs.SelectedIndex, 0)
  assert.equal(tabs.TabStripFooter.Children[0], footer.nativeViewProtected)
})

test('Windows structural updates rebuild named slots, retire old delegates and restore the focused header', () => {
  const f = fixture()
  const a = f.header('a')

  f.header('b')
  f.strip.onLoaded()
  a.peer.Focus()

  const oldTabs = f.tabs
  const oldPeer = a.peer
  const stale = oldTabs.SelectionChanged

  f.header('middle', false, 1)
  assert.notEqual(f.tabs, oldTabs)
  assert.equal(oldTabs.SelectionChanged, null)
  assert.equal(oldTabs.PreviewKeyDown, null)
  assert.equal(oldPeer.Header, null)
  assert.equal(a.nativeViewProtected.Parent, a.peer)
  assert.deepEqual(
    Array.from(f.tabs.peers, (peer) => peer.name),
    ['A', 'MIDDLE', 'B'],
  )

  oldTabs.index = 1
  stale()
  assert.deepEqual(f.calls, [])
  f.flushTasks()
  assert.equal(a.peer.FocusState, 1)
  assert.equal(f.tabs.SelectedIndex, 0)
  f.strip.onUnloaded()
  f.strip.disposeNativeView()
})

test('Windows native teardown does not rebuild slots or retain a queued focus reset', () => {
  const f = fixture()
  const a = f.header('a')

  f.header('b')
  f.strip.onLoaded()
  a.peer.Focus()
  f.header('c')
  assert.equal(f.tasks.size, 1)

  const roots = f.createdTabs.length

  f.strip._tearDownUI()
  assert.equal(f.createdTabs.length, roots)
  assert.equal(f.tasks.size, 0)
  assert.equal(a.peer, undefined)
  assert.equal(a.owner, undefined)
  f.flushTasks()
  assert.deepEqual(f.calls, [])
})

test('Windows removal restores focus to the controlled selection and keeps empty footer space absent', () => {
  const f = fixture()
  const a = f.header('a')
  const b = f.header('b')

  f.strip.onLoaded()
  assert.equal(f.tabs.TabStripFooter, null)
  f.strip.settings = { value: 'b', layout: 'fill' }
  b.peer.Focus()
  f.strip.settings = { value: 'a', layout: 'fill' }
  f.remove(b)
  f.flushTasks()
  assert.equal(a.peer.FocusState, 1)
  assert.equal(f.tabs.SelectedIndex, 0)
  assert.equal(f.tabs.TabStripFooter, null)
  assert.deepEqual(f.calls, [])
  f.strip.onUnloaded()
  f.strip.disposeNativeView()
})
