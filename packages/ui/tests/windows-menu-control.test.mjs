import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript-classic'

const source = ts.transpileModule(
  readFileSync(
    new URL('../src/components/overlays/menu-control.windows.ts', import.meta.url),
    'utf8',
  ),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText

function fixture() {
  const types = new Map(),
    tasks = new Map(),
    openCalls = [],
    calls = [],
    errors = [],
    menus = []
  let taskId = 0,
    viewId = 0
  const popups = [{ Child: { id: 'foreign-menu', name: 'Unrelated', minimum: 17 } }]
  const focused = { current: null }
  class View {
    _domId = ++viewId
    children = []
    isEnabled = true
    isLoaded = false
    eachChildView(callback) {
      for (const child of this.children) {
        if (callback(child) === false) {
          break
        }
      }
    }
    onLoaded() {
      this.isLoaded = true
    }
    onUnloaded() {
      this.isLoaded = false
    }
    _removeViewFromNativeVisualTree() {}
    _addViewToNativeVisualTree(child, atIndex) {
      const entries = this.nativeViewProtected?.Children?.entries
      if (entries) {
        entries.splice(atIndex ?? entries.length, 0, child.nativeViewProtected)
      }
      return true
    }
    disposeNativeView() {}
    _tearDownUI() {
      for (const child of [...this.children]) {
        this._removeViewFromNativeVisualTree(child)
      }
      this.disposeNativeView()
    }
    getLocationOnScreen() {
      return { x: 22.5, y: 123 }
    }
  }
  class Collection {
    entries = []
    Append(child) {
      this.entries.push(child)
      child.shows = (child.shows ?? 0) + 1
    }
    Clear() {
      this.entries = []
    }
    GetAt(index) {
      return this.entries[index]
    }
    RemoveAt(index) {
      this.entries.splice(index, 1)
    }
    get Size() {
      return this.entries.length
    }
  }
  const hostChildren = new Collection()
  class TranslateTransform {
    X = 0
    Y = 0
  }
  class Panel {
    ActualWidth = 0
    XamlRoot = { Content: hostPanel, Size: { Width: 747, Height: 414.5 } }
    Visibility = { Visible: 0, Collapsed: 1 }
    Children = new Collection()
    get MinWidth() {
      return (this.target ?? this).minimum ?? 0
    }
    set MinWidth(value) {
      ;(this.target ?? this).minimum = value
    }
    FindName(name) {
      return this.attached.names[name]
    }
    TransformToVisual(_host) {
      return {
        TransformPoint: (point) => point,
      }
    }
  }
  const hostPanel = { Children: hostChildren }
  const VisualTreeHelper = {
    GetParent: (node) => node?.treeParent,
    GetChildrenCount: () => 0,
    GetChild: () => undefined,
  }
  class CanvasStatics {
    static SetLeft(el, v) {
      el.left = v
    }
    static SetTop(el, v) {
      el.top = v
    }
  }
  class Item {
    IsTabStop = true
    set Tag(value) {
      if (this.content) {
        this.content.Parent = undefined
      }
      if (value?.Parent) {
        throw Error('already parented')
      }
      this.content = value
      if (value) {
        value.Parent = this
      }
    }
    get Tag() {
      return this.content
    }
    Focus() {
      focused.current = this
    }
  }
  class Menu {
    Children = new Collection()
    constructor(xaml) {
      this.items = [...xaml.matchAll(/x:Name="XplatItem\d+"/g)].map(() => new Item())
      this.presenter = new Panel()
      this.dismiss = new Panel()
      this.names = {
        XplatDismiss: this.dismiss,
        XplatPresenter: this.presenter,
      }
      this.items.forEach((item, index) => {
        this.names['XplatItem' + index] = item
      })
      menus.push(this)
    }
    get open() {
      return hostChildren.entries.includes(this)
    }
    FindName(name) {
      return this.names[name]
    }
  }
  class Property {
    constructor(options) {
      this.options = options
    }
    register(Type) {
      const { name, valueChanged } = this.options,
        key = Symbol(name)
      Object.defineProperty(Type.prototype, name, {
        get() {
          return this[key]
        },
        set(value) {
          this[key] = value
          valueChanged(this)
        },
      })
    }
  }
  const target = (node) => node.target ?? node
  const Microsoft = {
    UI: {
      Xaml: {
        Markup: {
          XamlReader: {
            Load(xaml) {
              // Loaded WinRT objects do not expose typed framework accessors.
              return new Menu(xaml)
            },
          },
        },
        Input: {
          FocusManager: {
            GetFocusedElement: () => focused.current,
            TryFocusAsync: (element) => {
              focused.current = element
              return { Succeeded: true }
            },
          },
        },
        FocusState: { Programmatic: 3, Keyboard: 2 },
        Controls: {
          Grid: Panel,
          Canvas: CanvasStatics,
        },
        Automation: {
          AutomationProperties: {
            SetName: (node, name) => {
              target(node).name = name
            },
            GetName: (node) => target(node).name,
            SetAutomationId: (node, id) => {
              target(node).id = id
            },
            GetAutomationId: (node) => target(node).id,
          },
        },
        Media: {
          VisualTreeHelper,
          TranslateTransform,
          SolidColorBrush: class {
            constructor(color) {
              this.Color = color
            }
          },
        },
      },
    },
  }
  const sandbox = {
    exports: {},
    console,
    require(name) {
      if (name === '@nativescript/core') {
        return { LayoutBase: View, ContentView: View, Property }
      }
      if (name === '@nativescript-community/octane') {
        return { registerElement: (name, Type) => types.set(name, Type) }
      }
      if (name === '@octane-xplat/platform/windows') {
        return {
          Microsoft,
          NSWinRT: {
            asDelegate: (_type, callback) => callback,
            toPromise: (op) => Promise.resolve(op),
          },
        }
      }
      if (name.endsWith('/action-error')) {
        return { reportActionError: (error) => errors.push(error) }
      }
      throw Error(name)
    },
    setTimeout(callback) {
      tasks.set(++taskId, callback)
      return taskId
    },
    clearTimeout(id) {
      tasks.delete(id)
    },
  }
  vm.runInNewContext(source, sandbox)
  const control = new (types.get('xplatwindowsmenu'))()
  const root = control.createNativeView()
  const midPanel = new Panel()
  midPanel.treeParent = hostPanel
  midPanel.Children = undefined
  root.treeParent = midPanel
  control.nativeViewProtected = root
  function update(props) {
    control.settings = { ...control.settings, ...props }
  }
  update({
    open: false,
    blocked: false,
    label: 'Actions',
    onOpenChange(open) {
      openCalls.push(open)
      update({ open })
    },
  })
  function item(label, disabled = false, at = control.children.length) {
    const child = new (types.get('xplatwindowsmenuitem'))()
    child.nativeViewProtected = {}
    child.style = {}
    child.settings = { label, disabled, onSelect: () => calls.push(label) }
    control.children.splice(at, 0, child)
    if (!control._addViewToNativeVisualTree(child, at)) {
      root.Children.entries.splice(at, 0, child.nativeViewProtected)
    }
    return child
  }
  function flush() {
    let remaining = 20
    while (tasks.size) {
      assert.ok(remaining--, 'native reconciliation must settle')
      const batch = [...tasks.values()]
      tasks.clear()
      for (const callback of batch) {
        callback()
      }
    }
  }
  function layout(width = 300) {
    root.ActualWidth = width
    root.LayoutUpdated?.()
    flush()
  }
  return {
    control,
    root,
    item,
    update,
    flush,
    layout,
    calls,
    openCalls,
    errors,
    menus,
    tasks,
    hostChildren,
    hostPanel,
    get menu() {
      return control.canvas
    },
    get presenter() {
      return control.slots.presenter
    },
  }
}

test('Windows menu waits for a loaded measured anchor and updates only its owned presenter', () => {
  const f = fixture()
  f.item('Open')
  f.update({ open: true })
  assert.equal(f.menu.open, false)
  f.control.onLoaded()
  assert.equal(f.menu.open, false)
  f.layout(300)
  assert.equal(f.menu.open, true)
  assert.equal(f.presenter.name, 'Actions')
  assert.equal(f.presenter.minimum, 300)
  assert.deepEqual(f.hostChildren.entries, [f.menu])
  assert.deepEqual(f.openCalls, [])
  f.update({ label: 'Updated' })
  assert.equal(f.presenter.name, 'Updated')
  f.layout(180)
  assert.equal(f.presenter.minimum, 180)
  assert.equal(f.menu.shows, 1)
})

test('Windows menu reconciles rejected close requests outside native event callbacks', () => {
  const f = fixture()
  f.item('Open')
  f.control.onLoaded()
  f.layout()
  f.update({ open: true, onOpenChange: (open) => f.openCalls.push(open) })
  f.menu.dismiss.Tapped()
  assert.deepEqual(f.openCalls, [false])
  assert.equal(f.menu.open, false)
  f.flush()
  assert.equal(f.menu.open, true)
  f.update({
    onOpenChange(open) {
      f.openCalls.push(open)
      f.update({ open })
    },
  })
  f.menu.dismiss.Tapped()
  f.flush()
  assert.equal(f.menu.open, false)
  assert.deepEqual(f.openCalls, [false, false])
})

test('Windows menu callbacks read current item state and reject disabled/blocked actions', () => {
  const f = fixture(),
    a = f.item('Open'),
    b = f.item('Disabled', true)
  f.control.onLoaded()
  f.layout()
  const click = a.peer.Click
  a.settings = { label: 'Current', disabled: false, onSelect: () => f.calls.push('current') }
  assert.equal(a.peer.name, 'Current')
  click()
  b.peer.Click()
  f.flush()
  assert.deepEqual(f.calls, ['current'])
  assert.equal(b.peer.IsEnabled, false)
  f.update({ open: true, blocked: true })
  click()
  f.layout()
  f.flush()
  assert.equal(f.menu.open, false)
  assert.equal(a.peer.IsEnabled, false)
  assert.deepEqual(f.calls, ['current'])
  f.update({ blocked: false, open: false })
  const failure = Error('action failure')
  a.settings = {
    ...a.settings,
    onSelect: () => {
      throw failure
    },
  }
  click()
  f.flush()
  assert.deepEqual(f.errors, [failure])
})

test('Windows menu structural rebuilds retire callbacks and preserve one native parent', () => {
  const f = fixture(),
    a = f.item('First'),
    b = f.item('Last')
  f.control.onLoaded()
  f.layout()
  f.update({ open: true })
  const old = f.menu,
    lateTap = old.dismiss.Tapped,
    lateKey = old.presenter.KeyDown,
    lateClick = a.peer.Click
  const oldPresenter = f.presenter
  const oldMarker = oldPresenter.id
  f.item('Inserted', false, 1)
  assert.notEqual(f.menu, old)
  assert.notEqual(f.presenter.id, oldMarker)
  assert.notEqual(f.presenter, oldPresenter)
  assert.ok(f.root.Children.entries.includes(a.nativeViewProtected))
  assert.ok(f.root.Children.entries.includes(b.nativeViewProtected))
  assert.equal(old.dismiss.Tapped, null)
  const shows = f.menu.shows
  lateTap()
  lateKey()
  lateClick()
  f.update({ label: 'Current menu' })
  f.flush()
  assert.equal(f.menu.shows, shows)
  assert.deepEqual(f.calls, [])
  assert.deepEqual(f.openCalls, [])
  const staleLayout = f.root.LayoutUpdated,
    staleClick = a.peer.Click
  f.control.onUnloaded()
  staleLayout()
  staleClick()
  f.flush()
  assert.equal(f.tasks.size, 0)
  assert.deepEqual(f.calls, [])
  f.control.onLoaded()
  f.flush()
  assert.equal(f.menu.open, true)
  f.control._tearDownUI()
  assert.equal(f.hostChildren.entries.length, 0)
  assert.equal(a.owner, undefined)
  assert.equal(b.peer, undefined)
  assert.equal(f.tasks.size, 0)
})

test('Windows menu unmount inside an action does not restart retired reconciliation', () => {
  const f = fixture(),
    a = f.item('Unmount')
  f.control.onLoaded()
  f.layout()
  f.update({ open: true })
  const menu = f.menu
  a.settings = { ...a.settings, onSelect: () => f.control._tearDownUI() }
  a.peer.Click()
  assert.equal(menu.dismiss.Tapped, null)
  assert.equal(f.tasks.size, 0)
  assert.equal(a.peer, undefined)
})
