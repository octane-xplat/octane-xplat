import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ElementNode, PropBag } from '../src/model.ts'
import type { ElementAdapter } from '../src/element-adapter.ts'
import { createElementAdapterCatalog, unconvertedElementTypes } from '../src/element-adapter.ts'
import { createActionStore } from '../src/action-store.ts'
import { mockNativeBoundary } from './native-boundary.ts'

const hooks = mockNativeBoundary()
const { createElementAdapters } = await import('../src/adapter-assembly.ts')
const { createNodes } = await import('../src/nodes.ts')
const { createRegistry } = await import('../src/registry.ts')
const { createElementProps } = await import('../src/element-props.ts')
const { createControls } = await import('../src/controls.ts')
const { createContainerElements } = await import('../src/container-elements.ts')
const { createInputElements } = await import('../src/input-elements.ts')
const { createActions } = await import('../src/actions.ts')
const { NSButton, NSSlider, NSProgressIndicator, NSNotificationCenter, NSView } =
  await import('@octane-xplat/platform/macos')
hooks.deregister()

// Production node/prop/adapter/feature owners; only native objects and unrelated
// services are stand-ins. Native geometry and selector ABI require test:packed.
function fixture() {
  const trace: string[] = []
  const failures = new Map<string, unknown>()
  const run = (phase: string) => {
    trace.push(phase)
    if (failures.has(phase)) {
      throw failures.get(phase)
    }
  }
  const noop = () => {}
  const observers = new Set<object>()
  const held: (() => void)[] = []
  const views: any[] = []
  const nativeView = () => {
    const view = new NSView()
    Object.assign(view, {
      enabled: true,
      title: '',
      removeFromSuperview() {
        run('native detach')
      },
      setButtonType() {
        run('button type')
      },
      setAccessibilityLabel(value: string) {
        this.label = value
      },
    })
    views.push(view)
    return view
  }
  Object.defineProperty(NSButton, 'buttonWithTitleTargetAction', {
    configurable: true,
    value(title, target, action) {
      run('native create')
      const view = nativeView()
      Object.assign(view, { title, target, action })
      Object.defineProperty(view, 'tag', {
        configurable: true,
        set(value) {
          run('tag')
          Object.defineProperty(this, 'tag', { value, configurable: true })
        },
      })
      return view
    },
  })
  Object.assign(NSView.prototype, {
    initWithFrame() {
      run('content create')
      return this
    },
  })
  for (const NativeControl of [NSSlider, NSProgressIndicator]) {
    Object.assign(NativeControl.prototype, {
      initWithFrame() {
        return this
      },
      sizeToFit() {},
      startAnimation() {
        this.running = true
        run('spinner start')
      },
      stopAnimation() {
        this.running = false
        run('spinner stop')
      },
    })
  }
  Object.assign(NSNotificationCenter.defaultCenter, {
    addObserverForNameObjectQueueUsingBlock(_name, _view, _queue, callback) {
      run('observe')
      held.push(callback)
      const token = {}
      observers.add(token)
      return token
    },
    removeObserver(token) {
      observers.delete(token)
      run('unobserve')
    },
  })
  const registry = createRegistry(),
    store = createActionStore()
  const layout = {
    layoutHandlers: new WeakMap(),
    queueLayoutReconcile() {
      run('layout')
    },
    layoutContentChild() {
      run('content layout')
    },
  }
  const cssCascade = {
    cssChildren: (node) => node.children,
    setNodeId() {
      run('common id')
    },
    setPseudoClass: noop,
    syncNormalState: noop,
    setNodeInlineStyle() {
      run('style')
    },
    applyClassName() {
      run('class')
    },
  }
  const deps: any = {
    registry,
    store,
    layout,
    cssCascade,
    textElements: { syncText: noop, syncTextLinks: noop, disposeTextLinks: noop, syncLabelOverflow: noop, syncHtmlView: noop, makeLabel: nativeView },
    inputElements: {
      textNodesByView: new WeakMap(),
      disposeBuiltinTextViewLayout() {
        run('legacy retire')
      },
    },
    cssPseudoState: {
      syncPseudoState: noop,
      syncPseudoTracking() {
        run('identity sync')
      },
    },
    subscriptions: {
      setKeyActions: noop,
      setFocusActions: noop,
      focusWithinDispatcher: { set: noop },
      keyboardDispatcher: { set: noop },
    },
    cssAnimations: { cancelKeyframeAnimations: noop },
    tree: {
      detach(_container, node) {
        run('detach ' + node.id)
        node.view?.removeFromSuperview?.()
      },
    },
    boxPaint: {
      dispose() {
        run('paint')
      },
    },
    accessibility: { applyAccessibility: noop, disposeAccessibility: noop },
    accessibleHost: { AccessibleHostView: class {} },
    hostedElements: {},
    pickerElements: {},
    projection: {},
    imageElements: {},
  }
  const actions = createActions(deps)
  const controls = createControls({ ...deps, actions })
  const containers = createContainerElements({ ...deps, actions })
  const inputs = {
    ...createInputElements({ ...deps, actions }),
    makeTextField: nativeView,
    makeSearchBar: nativeView,
    initializeTextViewport() { run('text viewport') },
    fitTextView() { run('text fit') },
  }
  Object.assign(deps, { actions, controls, containerElements: containers, inputElements: inputs })
  const assembly = createElementAdapters({ registry, controls, containers, actions, layout, textElements: deps.textElements, inputElements: deps.inputElements })
  const nodes = createNodes(deps)
  const props = createElementProps({ ...deps, nodes })
  deps.elementProps = props
  const container: any = {
    nodes: new Map(),
    children: [],
    cssDirty: new Set(),
    root: { eventScope: (_kind, callback) => callback() },
  }
  const make = (type = 'button', values: PropBag = {}, id = 1) => {
    const node = nodes.makeNode(container, id, type, values)
    container.nodes.set(id, node)
    return node
  }
  return {
    registry,
    store,
    actions,
    nodes,
    props,
    assembly,
    containers,
    deps,
    container,
    make,
    trace,
    failures,
    observers,
    held,
    views,
    run,
  }
}

test('adapter phases order validation, common/feature writes, merged sync and phased retirement', () => {
  const f = fixture()
  const adapter: ElementAdapter = {
    container: false,
    hasView: true,
    validate() {
      f.run('validate')
    },
    create(node) {
      f.run('create')
      node.view = new NSView()
      node.destroyHooks = [
        () => {
          f.run('hook')
          f.nodes.destroy(node)
        },
      ]
    },
    applyProp(node, name) {
      f.run('feature ' + name)
      assert.equal(node.props.id, 'one')
      return true
    },
    afterProps(node) {
      f.run('after')
      assert.equal(node.props.custom, 2)
    },
    retire() {
      f.run('retire')
    },
    prepareDispose() {
      f.run('prepare')
    },
    dispose() {
      f.run('dispose')
    },
  }
  f.registry.adapters.register('pilot-test', adapter)
  const node = f.make('pilot-test', { id: 'one', custom: 2 })
  f.nodes.destroy(node)
  assert.deepEqual(f.trace, [
    'validate',
    'create',
    'common id',
    'feature id',
    'feature custom',
    'after',
    'identity sync',
    'retire',
    'hook',
    'prepare',
    'detach 1',
    'dispose',
    'paint',
  ])
  assert.equal(node.lifecycle, 'disposed')
  assert.equal(f.container.nodes.size, 0)
})

test('registration replacement and caller mutation affect future acquisitions only', () => {
  const f = fixture(),
    events: string[] = []
  const definition: ElementAdapter = {
    container: false,
    hasView: false,
    create() {},
    applyProp() {
      events.push('old prop')
      return true
    },
    dispose() {
      events.push('old dispose')
    },
  }
  f.registry.adapters.register('custom', definition)
  const older = f.make('custom')
  definition.dispose = () => events.push('mutated')
  f.registry.adapters.register('custom', {
    ...definition,
    applyProp() {
      events.push('new prop')
      return true
    },
    dispose() {
      events.push('new dispose')
    },
  })
  f.props.applyProps(older, { custom: true })
  const newer = f.make('custom', { custom: true }, 2)
  f.nodes.destroy(older)
  f.nodes.destroy(newer)
  assert.deepEqual(events, ['old prop', 'new prop', 'old dispose', 'new dispose'])
})

for (const boundary of ['validate', 'create', 'feature', 'after', 'identity sync']) {
  test('partial construction cleans acquired resources at ' + boundary, () => {
    const f = fixture(),
      failure = Error(boundary)
    let acquired: ElementNode | undefined
    f.registry.adapters.register('failing', {
      container: false,
      hasView: true,
      validate() {
        f.run('validate')
      },
      create(node) {
        acquired = node
        node.view = new NSView()
        node.destroyHooks = [() => f.run('hook')]
        f.run('create')
      },
      applyProp() {
        f.run('feature')
        return true
      },
      afterProps() {
        f.run('after')
      },
      retire() {
        f.run('retire')
      },
      prepareDispose() {
        f.run('prepare')
      },
      dispose() {
        f.run('dispose')
      },
    })
    f.failures.set(boundary, failure)
    assert.throws(
      () => f.make('failing', { value: 1 }),
      (error) => error === failure,
    )
    assert.equal(f.container.nodes.size, 0)
    if (boundary === 'validate') {
      assert.equal(acquired, undefined)
      return
    }
    assert.equal(acquired!.lifecycle, 'disposed')
    assert.deepEqual(f.trace.slice(-6), [
      'retire',
      'hook',
      'prepare',
      'detach 1',
      'dispose',
      'paint',
    ])
    assert.equal(f.registry.cssNodesByView.has(acquired!.view!), false)
  })
}

for (const boundary of ['retire', 'hook', 'prepare', 'detach 1', 'dispose']) {
  test('release failure at ' + boundary + ' still finishes independent phases once', () => {
    const f = fixture(),
      failure = Error(boundary)
    f.registry.adapters.register('release', {
      container: false,
      hasView: false,
      create(node) {
        node.destroyHooks = [
          () => {
            f.run('hook')
          },
        ]
      },
      retire() {
        f.run('retire')
      },
      prepareDispose() {
        f.run('prepare')
      },
      dispose() {
        f.run('dispose')
      },
    })
    const node = f.make('release')
    f.trace.length = 0
    f.failures.set(boundary, failure)
    assert.throws(
      () => f.nodes.destroy(node),
      (error) => error === failure,
    )
    assert.deepEqual(f.trace, ['retire', 'hook', 'prepare', 'detach 1', 'dispose', 'paint'])
    f.nodes.destroy(node)
    assert.equal(f.trace.length, 6)
    assert.equal(node.lifecycle, 'disposed')
  })
}

test('button pilot owns real action leases and clears the complete next bag without changing tag', () => {
  const f = fixture()
  let calls = 0
  const node = f.make('button', {
    text: 'Save',
    onPress: () => calls++,
    isEnabled: false,
    accessibilityLabel: 'Save item',
    id: 'save',
  })
  const tag = node.actionId
  f.actions.invokeAction(tag)
  assert.equal(calls, 0)
  f.props.applyProps(node, { ...f.props.droppedPropClears(node, {}) })
  assert.equal(node.view!.title, '')
  assert.equal(node.view!.enabled, true)
  assert.equal(node.view!.label, '')
  assert.equal(node.actionId, tag)
  f.actions.invokeAction(tag)
  assert.equal(calls, 0)
  f.props.applyProps(node, { onPress: () => calls++ })
  f.actions.invokeAction(tag)
  assert.equal(calls, 1)
  node.destroyHooks = [() => f.actions.invokeAction(tag)]
  f.nodes.destroy(node)
  f.actions.invokeAction(tag)
  assert.equal(calls, 1)
  assert.equal(f.store.idForView(node.view!), undefined)
})

for (const boundary of ['button type', 'tag', 'style', 'identity sync']) {
  test('button partial construction releases actions after ' + boundary, () => {
    const f = fixture(),
      failure = Error(boundary)
    f.failures.set(boundary, failure)
    assert.throws(
      () => f.make('button', { style: {} }),
      (error) => error === failure,
    )
    for (const view of f.views) {
      assert.equal(f.store.idForView(view), undefined)
    }
    assert.equal(f.container.nodes.size, 0)
  })
}

test('contentview owns geometry and detaches every child before the host even after a child failure', () => {
  const f = fixture(),
    failure = Error('child')
  const node = f.make('contentview')
  const child = f.make('button', {}, 2),
    sibling = f.make('button', {}, 3)
  node.children.push(child, sibling)
  f.trace.length = 0
  f.held[0]()
  assert.deepEqual(f.trace, ['layout'])
  node.destroyHooks = [
    () => {
      f.run('hook')
      assert.equal(f.observers.size, 1)
    },
  ]
  f.failures.set('detach 2', failure)
  assert.throws(
    () => f.nodes.destroy(node),
    (error) => error === failure,
  )
  assert.deepEqual(f.trace, [
    'layout',
    'hook',
    'unobserve',
    'detach 2',
    'detach 3',
    'native detach',
    'detach 1',
    'paint',
  ])
  assert.equal(f.observers.size, 0)
  assert.equal(f.containers.contentViewNodesByView.has(node.view!), false)
  f.trace.length = 0
  f.held[0]()
  assert.deepEqual(f.trace, [])
})

for (const boundary of ['observe', 'style', 'identity sync']) {
  test('contentview construction failure retires lookup and geometry at ' + boundary, () => {
    const f = fixture(),
      failure = Error(boundary)
    f.failures.set(boundary, failure)
    assert.throws(
      () => f.make('contentview', { style: {} }),
      (error) => error === failure,
    )
    assert.equal(f.observers.size, 0)
    f.trace.length = 0
    f.held.forEach((callback) => callback())
    assert.deepEqual(f.trace, [])
  })
}

test('missing pilot installation cannot silently fall back; legacy inventory stays explicit', () => {
  const registry = createRegistry()
  assert.throws(() => registry.assertSupportedType('button'), /does not support/)
  assert.throws(() => registry.assertSupportedType('contentview'), /does not support/)
  assert.throws(() => registry.assertSupportedType('portalroot'), /does not support/)
  assert.throws(() => registry.assertSupportedType('unknown'), /does not support/)
  assert.equal(unconvertedElementTypes.has('button'), false)
  assert.equal(unconvertedElementTypes.has('contentview'), false)
  const catalog = createElementAdapterCatalog()
  assert.equal(catalog.lookup('button'), undefined)
})

test('creation retains the validated definition when validation replaces its catalog entry', () => {
  const f = fixture(),
    events: string[] = []
  f.registry.adapters.register('reentrant-registration', {
    container: false,
    hasView: false,
    validate() {
      f.registry.adapters.register('reentrant-registration', {
        container: false,
        hasView: false,
        create() {
          events.push('replacement')
        },
      })
    },
    create() {
      events.push('validated')
    },
  })
  f.make('reentrant-registration')
  f.make('reentrant-registration', {}, 2)
  assert.deepEqual(events, ['validated', 'replacement'])
})

test('content geometry releases a late native token when registration reenters retirement', () => {
  const f = fixture(),
    token = {}
  let observedView: object | undefined
  for (const NativeControl of [NSSlider, NSProgressIndicator]) {
    Object.assign(NativeControl.prototype, {
      initWithFrame() {
        return this
      },
      sizeToFit() {},
      startAnimation() {
        this.running = true
        run('spinner start')
      },
      stopAnimation() {
        this.running = false
        run('spinner stop')
      },
    })
  }
  Object.assign(NSNotificationCenter.defaultCenter, {
    addObserverForNameObjectQueueUsingBlock(_name, view, _queue, callback) {
      observedView = view
      f.held.push(callback)
      f.nodes.destroy(f.containers.contentViewNodesByView.get(view)!)
      f.observers.add(token)
      return token
    },
  })
  assert.throws(() => f.make('contentview'), /retired during construction/)
  assert.equal(f.observers.size, 0)
  assert.equal(f.containers.contentViewNodesByView.has(observedView!), false)
  f.trace.length = 0
  f.held[0]()
  assert.deepEqual(f.trace, [])
})

test('content observation removal failure still retires callbacks, children and identities', () => {
  const f = fixture(),
    failure = Error('unobserve')
  const node = f.make('contentview')
  const child = f.make('button', {}, 2)
  node.children.push(child)
  f.failures.set('unobserve', failure)
  f.trace.length = 0
  assert.throws(
    () => f.nodes.destroy(node),
    (error) => error === failure,
  )
  assert.ok(f.trace.includes('detach 2'))
  assert.ok(f.trace.includes('detach 1'))
  assert.equal(f.registry.cssNodesByView.has(node.view!), false)
  f.trace.length = 0
  f.held[0]()
  assert.deepEqual(f.trace, [])
})

test('normal author registration replaces future pilot definitions without redirecting old cleanup', () => {
  const f = fixture(),
    events: string[] = []
  f.assembly.registerElementType('button', {
    applyProp(_node, name) {
      events.push('old ' + name)
      return false
    },
    destroy() {
      events.push('old dispose')
    },
  })
  const old = f.make('button', { text: 'Old' })
  f.assembly.registerElementType('button', {
    applyProp(_node, name) {
      events.push('new ' + name)
      return false
    },
    destroy() {
      events.push('new dispose')
    },
  })
  f.props.applyProps(old, { text: 'Still old' })
  const next = f.make('button', { text: 'New' }, 2)
  assert.equal(old.view!.title, 'Still old')
  assert.equal(next.view!.title, 'New')
  f.nodes.destroy(old)
  f.nodes.destroy(next)
  assert.deepEqual(events, ['old text', 'old text', 'new text', 'old dispose', 'new dispose'])
  assert.equal(f.store.idForView(old.view!), undefined)
  assert.equal(f.store.idForView(next.view!), undefined)
})

test('registration replacement inside a live native action cannot redirect reentrant disposal', () => {
  const f = fixture(),
    events: string[] = []
  f.assembly.registerElementType('button', {
    destroy() {
      events.push('acquired')
    },
  })
  const node = f.make('button', {
    onPress() {
      f.assembly.registerElementType('button', {
        destroy() {
          events.push('replacement')
        },
      })
      f.nodes.destroy(node)
    },
  })
  f.actions.invokeAction(node.actionId)
  f.actions.invokeAction(node.actionId)
  assert.deepEqual(events, ['acquired'])
  assert.equal(f.store.idForView(node.view!), undefined)
  const future = f.make('button', {}, 2)
  f.nodes.destroy(future)
  assert.deepEqual(events, ['acquired', 'replacement'])
})

test('canonical switch and slider clear handlers and values without replacing their native action identity', () => {
  for (const type of ['switch', 'slider']) {
    const f = fixture()
    let calls = 0
    const node = f.make(type, {
      checked: true,
      value: 0.7,
      onCheckedChange() {
        calls++
      },
      onValueChange() {
        calls++
      },
    })
    const id = node.view!.tag
    f.props.applyProps(node, f.props.droppedPropClears(node, {}))
    assert.equal(node.view!.tag, id)
    assert.equal(f.store.hasHandler(node.view!), false)
    f.store.dispatch(id)
    assert.equal(calls, 0)
    f.nodes.destroy(node)
    assert.equal(f.store.idForView(node.view!), undefined)
  }
})

test('canonical progress reads the full bag and spinner retirement stops animation after prop removal', () => {
  const f = fixture()
  const progress = f.make('progress', { value: 30, maxValue: 40 })
  f.props.applyProps(progress, { maxValue: 20 })
  assert.equal(progress.view!.doubleValue, 20)
  f.props.applyProps(progress, f.props.droppedPropClears(progress, {}))
  assert.equal(progress.view!.doubleValue, 0)
  assert.equal(progress.view!.maxValue, 100)
  const spinner = f.make('activityindicator', { busy: true }, 2)
  assert.equal(spinner.view!.running, true)
  f.props.applyProps(spinner, f.props.droppedPropClears(spinner, {}))
  assert.equal(spinner.view!.running, false)
  f.props.applyProps(spinner, { busy: true })
  f.nodes.destroy(spinner)
  assert.equal(spinner.view!.running, false)
  assert.equal(spinner.view!.hidden, true)
})

test('acquired textview retires sizing before hooks and releases its action after native detach', () => {
  const f = fixture()
  const node = f.make('textview')
  assert.equal(node.view!.delegate != null, true)
  node.textLayoutDetach = () => f.trace.push('text sizing retired')
  node.destroyHooks = [() => {
    assert.equal(node.textLayoutRetired, true)
    assert.equal(node.textLayoutDetach, undefined)
    assert.equal(f.store.idForView(node.view!) != null, true)
    f.trace.push('text hook')
  }]
  f.nodes.destroy(node)
  assert.ok(f.trace.indexOf('text sizing retired') < f.trace.indexOf('text hook'))
  assert.ok(f.trace.indexOf('text hook') < f.trace.indexOf('detach 1'))
  assert.equal(f.store.idForView(node.view!), undefined)
  assert.equal(node.view!.delegate, null)
})

test('partial textview construction unwinds delegate and action ownership after a common prop failure', () => {
  const f = fixture(), failure = Error('failed text props')
  f.failures.set('common id', failure)
  assert.throws(() => f.make('textview', { id: 'text' }), error => error === failure)
  const view = f.views.at(-1)
  assert.equal(view.delegate, null)
  assert.equal(f.store.idForView(view), undefined)
})
