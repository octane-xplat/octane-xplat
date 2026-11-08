import { createElementAdapterCatalog } from '../src/element-adapter.ts'
import { createActionStore } from '../src/action-store.ts'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mockNativeBoundary } from './native-boundary.ts'
import { FailureCollector, PhaseErrors } from '../src/failures.ts'

const hooks = mockNativeBoundary()
const { createNodes } = await import('../src/nodes.ts')
const { createTree } = await import('../src/tree.ts')
const { createActions } = await import('../src/actions.ts')
const { createSubscriptions } = await import('../src/subscriptions.ts')
const { createContainerElements } = await import('../src/container-elements.ts')
const { createBackgroundPaint } = await import('../src/background-paint.ts')
const { createCssCascade } = await import('../src/css-cascade.ts')
const { observeLayoutCommits } = await import('../src/layout-observers.ts')
const { releaseTabItem } = await import('../src/tab-view.ts')

hooks.deregister()

function fixture() {
  const trace: string[] = []
  const injected = new Map<string, unknown>()
  const run = (name: string) => {
    trace.push(name)
    if (injected.has(name)) {
      throw injected.get(name)
    }
  }

  const services = (names: string[]) =>
    Object.fromEntries(names.map((name) => [name, () => run(name)]))

  const deps: any = {
    registry: {
      adapters: createElementAdapterCatalog(),
      assertSupportedType() {},
      behaviorOf: () => ({ destroy: () => run('prepare') }),
      nodeContainersByView: new WeakMap(),
      cssNodesByView: new WeakMap(),
    },
    cssCascade: { cssChildren: (node) => node.children },
    cssAnimations: services(['cancelKeyframeAnimations']),
    inputElements: services(['disposeBuiltinTextViewLayout', 'disposeBuiltinTextInput']),
    subscriptions: {
      focusWithinDispatcher: { set: () => run('focus') },
      keyboardDispatcher: { set: () => run('keys') },
    },
    hostedElements: services([
      'disposeBuiltinListView',
      'disposeBuiltinPager',
      'disposeBuiltinVideo',
      'disposeBuiltinTabView',
      'disposeBuiltinTabItem',
      'disposeBuiltinWebView',
    ]),
    pickerElements: services([
      'disposeBuiltinSegmentedItem',
      'disposeBuiltinSegmentedChildren',
      'disposeBuiltinSegmentedControl',
      'disposeBuiltinListPicker',
      'disposeBuiltinTimePicker',
      'disposeBuiltinDatePicker',
    ]),
    containerElements: services([
      'disposeBuiltinRootLayout',
      'disposeBuiltinLiquidGlass',
      'disposeBuiltinContentHost',
      'disposeBuiltinPlaceholder',
    ]),
    textElements: services(['disposeBuiltinFormattedText', 'disposeTextLinks']),
    projection: services(['disposeBuiltinProxyChildren']),
    controls: services(['disposeBuiltinActivityIndicator', 'disposeBuiltinScrollView']),
    imageElements: services(['disposeBuiltinImage']),
    tree: { detach: () => run('detach') },
    boxPaint: { dispose: () => run('paint') },
    layout: { layoutHandlers: new WeakMap() },
    accessibleHost: { accessibilityLabels: new Map(), accessibilityRoles: new Map() },
    store: createActionStore(),
    actions: {
      disposeActions(node) {
        deps.actions.actionHandlers.delete(node.actionId)
      },
      actionHandlers: new Map(),
    },
    accessibility: { disposeAccessibility() {} },
    elementProps: { applyProps: () => run('props') },
    cssPseudoState: { syncPseudoTracking() {} },
  }

  const container: any = {
    nodes: new Map(),
    children: [],
    fontFamily: undefined,
    cssDirty: new Set(),
  }

  const nodes = createNodes(deps)
  const node: any = {
    id: 1,
    type: 'span',
    lifecycle: 'live',
    view: {},
    props: { onFocus() {}, onKeyDown() {} },
    container,
    parent: null,
    children: [],
    actionId: 1,
    boxFrameOwner: {},
  }

  node.adapter = {
    container: false,
    hasView: true,
    create() {},
    retire: deps.inputElements.disposeBuiltinTextViewLayout,
    prepareDispose() {
      const failures = new FailureCollector()

      failures.run('prepare', () => run('prepare'))
      failures.run('list prepare', deps.hostedElements.disposeBuiltinListView)
      failures.throwIfFailed()
    },
    dispose(node) {
      const failures = new FailureCollector()

      failures.run('text input', deps.inputElements.disposeBuiltinTextInput)
      failures.run('actions', () => deps.actions.disposeActions(node))
      failures.throwIfFailed()
    },
  }

  container.nodes.set(1, node)
  deps.actions.actionHandlers.set(1, () => {})
  deps.registry.nodeContainersByView.set(node.view, container)
  deps.registry.cssNodesByView.set(node.view, node)
  return { deps, nodes, node, trace, injected, container, run }
}

for (const stage of [
  'focus',
  'keys',
  'prepare',
  'disposeBuiltinListView',
  'detach',
  'disposeBuiltinTextInput',
  'paint',
]) {
  test('node cleanup continues after ' + stage + ' and reentry cannot repeat it', () => {
    const fx = fixture()
    const failure = Error(stage)

    fx.injected.set(stage, failure)
    fx.node.destroyHooks = [
      () => {
        fx.nodes.destroy(fx.node)
        fx.run('hook')
      },
    ]

    assert.throws(
      () => fx.nodes.destroy(fx.node),
      (error) => error === failure,
    )

    assert.equal(fx.node.lifecycle, 'disposed')
    assert.equal(fx.container.nodes.size, 0)
    assert.equal(fx.deps.actions.actionHandlers.size, 0)
    assert.equal(fx.deps.registry.cssNodesByView.has(fx.node.view), false)
    assert.equal(fx.deps.registry.nodeContainersByView.has(fx.node.view), false)
    assert.equal(fx.trace.at(-1), 'paint')

    const count = fx.trace.length

    fx.nodes.destroy(fx.node)
    assert.equal(fx.trace.length, count)
    assert.equal(fx.trace.filter((name) => name === stage).length, 1)
  })
}

test('multiple cleanup errors retain values and labels while later identity cleanup still runs', () => {
  const fx = fixture()
  const first = Error('hook'),
    second = Error('paint'),
    third = Error('identity')

  fx.node.destroyHooks = [
    () => {
      throw first
    },
    () => fx.run('next hook'),
  ]

  fx.injected.set('paint', second)
  fx.deps.accessibility.disposeAccessibility = () => {
    throw third
  }

  assert.throws(
    () => fx.nodes.destroy(fx.node),
    (error) => {
      assert.ok(error instanceof PhaseErrors)
      assert.deepEqual(error.errors, [first, second, third])
      assert.deepEqual(
        error.failures.map((failure) => failure.phase),
        ['destroy hook 0', 'box paint', 'accessibility'],
      )

      return true
    },
  )

  assert.ok(fx.trace.includes('next hook'))
  assert.equal(fx.container.nodes.size, 0)
  assert.equal(fx.node.lifecycle, 'disposed')
})

test('failed partial construction preserves its primary error with cleanup errors', () => {
  const fx = fixture()
  const primary = Error('construction'),
    cleanup = Error('cleanup')

  fx.injected.set('props', primary)
  fx.injected.set('prepare', cleanup)
  fx.deps.registry.adapters.register('span', {
    container: false,
    hasView: false,
    create() {},
    prepareDispose() {
      fx.run('prepare')
    },
  })

  assert.throws(
    () => fx.nodes.makeNode(fx.container, 2, 'span', {}),
    (error) => {
      assert.ok(error instanceof PhaseErrors)
      assert.deepEqual(error.errors, [primary, cleanup])
      assert.deepEqual(
        error.failures.map((failure) => failure.phase),
        ['construction', 'construction cleanup'],
      )

      return true
    },
  )

  fx.injected.delete('prepare')
  assert.throws(
    () => fx.nodes.makeNode(fx.container, 2, 'span', {}),
    (error) => error === primary,
  )
})

test('held native action and submit closures are inert as soon as retirement starts', () => {
  const fx = fixture()
  const actions = createActions(fx.deps)

  fx.deps.actions = actions
  fx.node.container.root = { eventScope: (_kind, callback) => callback() }

  let calls = 0

  actions.acquireAction(fx.node, fx.node.view)
  actions.setControlAction(
    fx.node,
    () => calls++,
    () => 1,
  )

  actions.setTextSubmitAction(fx.node, () => calls++)

  const action = () => actions.invokeAction(fx.node.actionId),
    submit = fx.node.submitHandler

  action()
  submit()
  assert.equal(calls, 2)
  fx.node.destroyHooks = [
    () => {
      action()
      submit()
    },
  ]

  fx.nodes.destroy(fx.node)
  action()
  submit()
  assert.equal(calls, 2)
})

test('native detach failure still releases pins and synchronizes the live parent', () => {
  const fx = fixture()
  const parent: any = {
    type: 'contentview',
    children: [fx.node],
    contentChild: fx.node,
    view: { invalidateIntrinsicContentSize: () => fx.run('parent size') },
  }

  fx.node.parent = parent

  const failure = Error('native detach')

  fx.node.view.removeFromSuperview = () => {
    throw failure
  }

  const tree = createTree({
    ...fx.deps,
    cssAnimations: { stopSubtreeAnimations: () => fx.run('stop') },
    nativeStyle: { deactivateSizeConstraints: () => fx.run('size') },
    layout: {
      releasePlacementPins: () => fx.run('pins'),
      layoutView: (node) => node.view,
      queueLayoutReconcile: () => fx.run('parent layout'),
    },
    textElements: { syncText: () => fx.run('parent text') },
  })

  assert.throws(
    () => tree.detach(fx.container, fx.node),
    (error) => error === failure,
  )

  assert.deepEqual(fx.trace, [
    'stop',
    'size',
    'pins',
    'parent size',
    'parent layout',
    'parent text',
  ])

  assert.equal(fx.node.parent, null)
  assert.deepEqual(parent.children, [])
})

test('tab nested-root failure retires root once and continues native/resource disposal', () => {
  const fx = fixture()

  fx.node.type = 'tabviewitem'

  const failure = Error('nested root')

  fx.node.tabContentRoot = {
    unmount() {
      fx.run('unmount')
      releaseTabItem(fx.node)
      throw failure
    },
  }

  fx.node.tabIconTask = { cancel: () => fx.run('cancel') }
  fx.node.tabNativeItem = { view: {}, image: {} }
  fx.node.childHost = { removeFromSuperview: () => fx.run('child host') }
  assert.throws(
    () => releaseTabItem(fx.node),
    (error) => error === failure,
  )

  releaseTabItem(fx.node)
  assert.deepEqual(fx.trace, ['unmount', 'cancel', 'child host'])
  assert.equal(fx.node.tabContentRoot, null)
  assert.equal(fx.node.tabNativeItem.view, null)
})

test('subscription release failure retires held callbacks and attempts the other leases', () => {
  const fx = fixture()
  const subscriptions = createSubscriptions(fx.deps)
  const held: (() => void)[] = []
  let releases = 0,
    calls = 0

  const failure = Error('subscription release')

  subscriptions.keyboardDispatcher.subscribe = (_view, handlers) => {
    held.push(() => handlers.onKeyDown?.({} as any))

    const index = held.length

    return () => {
      releases++
      if (index === 1) {
        throw failure
      }
    }
  }

  fx.node.container.root = { eventScope: (_kind, callback) => callback() }
  subscriptions.observeViewKeys(fx.node.view, { onKeyDown: () => calls++ })
  subscriptions.observeViewKeys(fx.node.view, { onKeyDown: () => calls++ })
  held.forEach((callback) => callback())
  assert.equal(calls, 2)
  assert.throws(
    () => fx.nodes.destroy(fx.node),
    (error) => error === failure,
  )

  held.forEach((callback) => callback())
  assert.equal(calls, 2)
  assert.equal(releases, 2)
})

test('content preparation failure cannot skip sibling detachment or the host identity', () => {
  const fx = fixture()
  const elements = createContainerElements(fx.deps)

  fx.node.type = 'contentview'
  fx.node.children = [{ id: 2 }, { id: 3 }]
  elements.contentViewNodesByView.set(fx.node.view, fx.node)

  const failure = Error('child detach')
  const detached: number[] = []

  fx.deps.tree.detach = (_container, child) => {
    detached.push(child.id)
    if (child.id === 2) {
      throw failure
    }
  }

  assert.throws(
    () => elements.disposeBuiltinContentHost(fx.node),
    (error) => error === failure,
  )

  assert.deepEqual(detached, [2, 3])
  assert.equal(elements.contentViewNodesByView.has(fx.node.view), false)
})

test('paint cleanup retires every image release before reentry and still detaches its host', () => {
  const fx = fixture()
  const paint = createBackgroundPaint()
  const failure = Error('image release')

  fx.node.bgPainted = [
    {
      release() {
        fx.run('image one')
        paint.clearBackgrounds(fx.node, fx.node)
        throw failure
      },
    },
    {
      release() {
        fx.run('image two')
      },
    },
  ]

  fx.node.bgHost = { removeFromSuperlayer: () => fx.run('paint host') }
  assert.throws(
    () => paint.clearBackgrounds(fx.node, fx.node),
    (error) => error === failure,
  )

  paint.clearBackgrounds(fx.node, fx.node)
  assert.deepEqual(fx.trace, ['image one', 'image two', 'paint host'])
  assert.equal(fx.node.bgPainted, undefined)
})

test('standalone CSS failure resets ownership without publishing success; next flush commits', () => {
  const fx = fixture()

  fx.node.view = null
  fx.node.props = {}
  fx.node.cssClasses = new Set()
  fx.node.cssPseudoClasses = new Set()
  fx.node.computedCustomProps = new Map()
  fx.container.hostView = {}
  fx.container.layoutDirty = null

  const failure = Error('cascade')
  let fail = true,
    observations = 0,
    drains = 0

  const css = createCssCascade({
    ...fx.deps,
    hostBridge: { appKitBridge: {} },
    roots: { appKitContainers: new Set() },
    layout: {
      drainLayoutDirty() {
        drains++
      },
    },
    cssAnimations: { ...fx.deps.cssAnimations, sameAnimations: () => true },
    nativeStyle: {
      applyStyle() {
        if (fail) {
          throw failure
        }
      },
    },
    textElements: { syncText() {} },
  })

  const off = observeLayoutCommits(() => observations++)

  try {
    fx.container.cssDirty = new Set([fx.node])
    assert.throws(
      () => css.flushStyleDirty(fx.container),
      (error) => error === failure,
    )

    assert.equal(fx.container.layoutDirty, null)
    assert.equal(observations, 0)
    assert.equal(drains, 0)
    fail = false
    fx.container.cssDirty = new Set([fx.node])
    css.flushStyleDirty(fx.container)
    assert.equal(observations, 1)
    assert.equal(drains, 1)
  } finally {
    off()
  }
})

test('destruction during construction cannot revive or register the partial node', () => {
  const fx = fixture()
  let partial: any

  fx.deps.registry.adapters.register('span', {
    container: false,
    hasView: false,
    create(node) {
      partial = node
      fx.nodes.destroy(node)
    },
  })

  assert.throws(() => fx.nodes.makeNode(fx.container, 2, 'span', {}), /retired during construction/)
  assert.equal(partial.lifecycle, 'disposed')
  assert.equal(fx.container.nodes.has(2), false)
  assert.equal(fx.trace.includes('props'), false)
})
