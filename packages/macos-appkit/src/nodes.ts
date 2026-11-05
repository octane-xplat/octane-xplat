import type { ElementAdapter } from './element-adapter'
import type { BoxPaint } from './box-paint'
import { FailureCollector } from './failures.ts'
import type { CssAnimations } from './css-animations'
import type { Registry } from './registry'
import type { Tree } from './tree'
import type { PickerElements } from './picker-elements'
import type { CssCascade } from './css-cascade'
import type { ContainerElements } from './container-elements'
import type { Roots } from './roots'
import type { Controls } from './controls'
import type { TextElements } from './text-elements'
import type { InputElements } from './input-elements'
import type { ImageElements } from './image-elements'
import type { Actions } from './actions'
import type { ElementProps } from './element-props'
import type { CssPseudoState } from './css-pseudo-state'
import type { Subscriptions } from './subscriptions'
import type { HostedElements } from './hosted-elements'
import type { Projection } from './projection'
import type { Layout } from './layout'
import type { Accessibility } from './accessibility'
import type { PropBag, AppKitView, ElementNode, RootContainer } from './model'
import { normalizeHostStyleProps } from './inline-style.ts'
import { NSNotificationCenter, NSView } from '@octane-xplat/platform/macos'
import { validateListProps } from './list-template'
import { nativeColor } from './native-colors'
import { makeTabView, makeTabItem, validateTabProps } from './tab-view'
import { makeListView } from './list-view'
import { makeWebView } from './webview'
import { makePagerView } from './pager'
import { makeVideoView } from './video'

import { disposePressGestures, setVisualStateTracking } from './gestures'

interface Dependencies {
  boxPaint: Pick<BoxPaint, 'dispose'>
  cssAnimations: Pick<CssAnimations, 'cancelKeyframeAnimations'>
  registry: Pick<
    Registry,
    | 'adapters'
    | 'VIEW_PARENT_TYPES'
    | 'typeHasView'
    | 'assertSupportedType'
    | 'behaviorOf'
    | 'nodeContainersByView'
    | 'cssNodesByView'
  >
  tree: Pick<Tree, 'validateTextNesting' | 'detach'>
  pickerElements: Pick<
    PickerElements,
    | 'timeOfDay'
    | 'calendarDate'
    | 'makeSegmentedBar'
    | 'makeListPicker'
    | 'makeTimePicker'
    | 'makeDatePicker'
    | 'disposeBuiltinSegmentedItem'
    | 'disposeBuiltinSegmentedChildren'
    | 'disposeBuiltinSegmentedControl'
    | 'disposeBuiltinListPicker'
    | 'disposeBuiltinTimePicker'
    | 'disposeBuiltinDatePicker'
  >
  cssCascade: Pick<CssCascade, 'cssChildren'>
  containerElements: Pick<
    ContainerElements,
    | 'makeRootLayout'
    | 'makeActionBar'
    | 'contentViewNodesByView'
    | 'observeContentGeometry'
    | 'makeLiquidGlass'
    | 'makePlaceholder'
    | 'gridLayoutNodesByView'
    | 'disposeBuiltinRootLayout'
    | 'disposeBuiltinLiquidGlass'
    | 'disposeBuiltinContentHost'
    | 'disposeBuiltinPlaceholder'
  >
  roots: Pick<Roots, 'createMacOSRoot' | 'unmountOwnedRoot'>
  controls: Pick<
    Controls,
    | 'makeProgress'
    | 'makeActivityIndicator'
    | 'makeScrollView'
    | 'makeSwitch'
    | 'makeSlider'
    | 'disposeBuiltinActivityIndicator'
    | 'disposeBuiltinScrollView'
  >
  textElements: Pick<TextElements, 'makeLabel' | 'disposeBuiltinFormattedText' | 'disposeTextLinks'>
  inputElements: Pick<
    InputElements,
    | 'makeSearchBar'
    | 'makeTextField'
    | 'textNodesByView'
    | 'initializeTextViewport'
    | 'disposeBuiltinTextViewLayout'
    | 'disposeBuiltinTextInput'
  >
  imageElements: Pick<ImageElements, 'makeImageView' | 'makeAnimatedImageView' | 'disposeBuiltinImage'>
  actions: Pick<
    Actions,
    | 'acquireAction'
    | 'buttonActionTarget'
    | 'disposeActions'
  >
  elementProps: Pick<ElementProps, 'applyProps'>
  cssPseudoState: Pick<CssPseudoState, 'syncPseudoTracking'>
  subscriptions: Pick<Subscriptions, 'focusWithinDispatcher' | 'keyboardDispatcher'>
  hostedElements: Pick<
    HostedElements,
    | 'disposeBuiltinListView'
    | 'disposeBuiltinPager'
    | 'disposeBuiltinVideo'
    | 'disposeBuiltinTabView'
    | 'disposeBuiltinTabItem'
    | 'disposeBuiltinWebView'
  >
  projection: Pick<Projection, 'disposeBuiltinProxyChildren'>
  layout: Pick<Layout, 'layoutHandlers'>
  accessibility: Pick<Accessibility, 'disposeAccessibility'>
}

export type Nodes = ReturnType<typeof createNodes>

export function createNodes(deps: Dependencies) {
  /** Deterministic prop failures that would otherwise throw after views and
   *  registrations exist. `baseProps` supplies already-applied props for
   *  update commands so merged-prop rules (e.g. placeholder color) stay exact. */
  function validateNodeProps(type: string, props: PropBag | undefined, baseProps?: PropBag, adapter: ElementAdapter | undefined = deps.registry.adapters.lookup(type)) {
    props = normalizeHostStyleProps(props)
    adapter?.validate?.(props ?? {}, baseProps)
    if (type === 'actionbar' && props?.titleView != null && !(props.titleView instanceof NSView)) {
      throw new TypeError('AppKit actionbar titleView must be an AppKit NSView')
    }

    if (type === 'listview') {
      validateListProps(props ?? {}, (template) =>
        template.validate(
          (tag, values) => {
            try {
              deps.registry.assertSupportedType(tag)
              validateNodeProps(tag, values)
            } catch (error) {
              throw new TypeError('[macos-host] listview itemTemplate: ' + String(error))
            }
          },
          (parent, child) => {
            deps.tree.validateTextNesting(parent, child)
            if (
              parent &&
              (deps.registry.typeHasView(child) || child === 'proxyviewcontainer') &&
              !(
                deps.registry.VIEW_PARENT_TYPES.has(parent) ||
                deps.registry.behaviorOf(parent)?.container === true
              )
            ) {
              throw new TypeError(
                '[macos-host] listview itemTemplate: <' + parent + '> cannot contain child views',
              )
            }
          },
        ),
      )

      if (props?.separatorColor != null) {
        nativeColor(props.separatorColor)
      }
    }

    if (type === 'tabview' || type === 'tabviewitem') {
      validateTabProps(type, props ?? {})
    }

    if (type === 'segmentedbaritem' && props?.title != null && typeof props.title !== 'string') {
      throw new Error('AppKit segmentedbaritem title must be a string')
    }

    if (type === 'segmentedbar') {
      if (props?.items != null && !Array.isArray(props.items)) {
        throw new Error('AppKit segmentedbar items must be an array')
      }

      for (const item of props?.items ?? []) {
        if (!item || typeof item !== 'object') {
          throw new Error('AppKit segmentedbar items must be objects with optional titles')
        }

        if (item.title != null && typeof item.title !== 'string') {
          throw new Error('AppKit segmentedbar item title must be a string')
        }
      }

      if (props?.selectedIndex != null && !Number.isInteger(props.selectedIndex)) {
        throw new Error('AppKit segmentedbar selectedIndex must be an integer')
      }

      if (props?.style?.selectedBackgroundColor != null) {
        nativeColor(props.style.selectedBackgroundColor)
      }
    }

    if (type === 'listpicker') {
      if (props?.items != null && !Array.isArray(props.items)) {
        throw new Error('AppKit listpicker items must be an array')
      }

      if (props?.selectedIndex != null && !Number.isInteger(props.selectedIndex)) {
        throw new Error('AppKit listpicker selectedIndex must be an integer')
      }

      // Validate item conversion before allocating a view or registration.
      for (const item of props?.items ?? []) {
        if (item != null) {
          void (item + '')
        }
      }
    }

    if (type === 'timepicker') {
      if (props?.time != null) {
        deps.pickerElements.timeOfDay(props.time)
      }

      for (const name of ['hour', 'minute', 'minHour', 'minMinute', 'maxHour', 'maxMinute']) {
        const value = props?.[name]
        const maximum = name.toLowerCase().includes('hour') ? 23 : 59
        if (value != null && (!Number.isInteger(value) || value < 0 || value > maximum)) {
          throw new TypeError(
            'AppKit timepicker ' + name + ' must be an integer from 0 through ' + maximum,
          )
        }
      }
    }

    if (type === 'datepicker') {
      for (const name of ['date', 'minDate', 'maxDate']) {
        if (props?.[name] != null) {
          if (!(props[name] instanceof Date) && typeof props[name] !== 'string') {
            throw new Error('AppKit datepicker ' + name + ' must be Date or string')
          }

          deps.pickerElements.calendarDate(props[name])
        }
      }

      for (const name of ['year', 'month', 'day']) {
        if (props?.[name] != null && !Number.isInteger(props[name])) {
          throw new Error('AppKit datepicker ' + name + ' must be an integer')
        }
      }
    }

    if (
      type === 'placeholder' &&
      props?.onCreatingView != null &&
      typeof props.onCreatingView !== 'function'
    ) {
      throw new Error('AppKit placeholder onCreatingView must be a function')
    }

    if (['#text', 'span', 'formattedstring'].includes(type)) { return }

    const style = props?.style
    if (style != null) {
      if (typeof style !== 'object') {
        throw new Error('AppKit spike expects style to be an object')
      }

      // applyStyle feeds these straight into nativeColor.
      if (style.backgroundColor != null) {
        nativeColor(style.backgroundColor)
      }

      if (style.borderColor != null) {
        nativeColor(style.borderColor)
      }

      if (
        ['label', 'htmlview', 'textfield', 'textview', 'searchbar'].includes(type) &&
        style.color != null
      ) {
        nativeColor(style.color)
      }
    }

    if (
      type === 'scrollview' &&
      props?.orientation != null &&
      !['horizontal', 'vertical', 'both'].includes(props.orientation)
    ) {
      throw new Error('[macos-host] ' + type + ' orientation must be horizontal, vertical or both')
    }

    if (props?.dock != null && !['left', 'top', 'right', 'bottom'].includes(props.dock)) {
      throw new Error('[macos-host] dock must be left, top, right or bottom')
    }

  }

  function makeNode(container: RootContainer, id: number, type: string, props: PropBag) {
    props = normalizeHostStyleProps(props)
    // Reject malformed props before factories allocate views or register
    // actions — the node only reaches container.nodes after this returns, so
    // a throwing prop below must unwind whatever was already acquired.
    deps.registry.assertSupportedType(type)
    const adapter = deps.registry.adapters.lookup(type)
    validateNodeProps(type, props, undefined, adapter)

    const node: ElementNode = {
      id,
      type,
      lifecycle: 'constructing',
      adapter,
      view: null,
      props: {},
      parent: null,
      children: [],
      container,
      appliedFontFamily: container.fontFamily,
      scrollObserverInstalled: false,
      text: '',
      cssType: type,
      cssClasses: new Set(),
      cssPseudoClasses: new Set(),
      computedStyle: undefined,
      computedCustomProps: new Map(),
    }
    node.getChildIndex = (child: ElementNode) => deps.cssCascade.cssChildren(node).indexOf(child)
    node.getChildAt = (i: number) => deps.cssCascade.cssChildren(node)[i]
    node.getChildrenCount = () => deps.cssCascade.cssChildren(node).length

    try {
      const makeBehavior = deps.registry.behaviorOf(type)?.make
      if (node.adapter) {
        node.adapter.create(node, props)
      } else if (makeBehavior) {
        // Registered element behaviors own their factory (mason-backed
        // containers, plugin elements).
        makeBehavior(node, props)
      } else {
        switch (type) {
          case 'rootlayout':
            node.view = deps.containerElements.makeRootLayout(node)
            break
          case 'actionbar':
            node.view = deps.containerElements.makeActionBar(node)
            deps.containerElements.contentViewNodesByView.set(node.view!, node)
            deps.containerElements.observeContentGeometry(node)
            break
          case 'liquidglass':
            node.view = deps.containerElements.makeLiquidGlass(node)
            break
          case 'tabview':
            node.view = makeTabView(node)
            break
          case 'tabviewitem':
            makeTabItem(node)
            break
          case 'segmentedbar': {
            const control = deps.pickerElements.makeSegmentedBar(node)
            node.view = control.view
            break
          }
          case 'listview':
            node.view = makeListView({
              createRoot: (host) =>
                deps.roots.createMacOSRoot(host, { fontFamily: container.fontFamily }),
              releaseOwnedRoot: (host) => deps.roots.unmountOwnedRoot(host),
              color: nativeColor,
            }) as AppKitView

            break
          case 'listpicker': {
            const control = deps.pickerElements.makeListPicker(node)
            node.view = control.view
            break
          }
          case 'timepicker': {
            const control = deps.pickerElements.makeTimePicker(node)
            node.view = control.view
            break
          }
          case 'datepicker': {
            const control = deps.pickerElements.makeDatePicker(node)
            node.view = control.view
            break
          }
          case 'scrollview': {
            const scroll = deps.controls.makeScrollView(node)
            node.view = scroll.view
            node.childHost = scroll.childHost
            break
          }
          case 'webview':
            node.view = makeWebView()
            break
          case 'image':
            node.view = deps.imageElements.makeImageView(props)
            break
          case 'animatedimage':
            node.view = deps.imageElements.makeAnimatedImageView(props)
            break
          case 'pager':
            node.view = makePagerView()
            break
          case 'xplatvideo':
            node.view = makeVideoView()
            break
          case 'placeholder':
            node.view = deps.containerElements.makePlaceholder(node)
            break
          case 'proxyviewcontainer':
          case 'segmentedbaritem':
            break
          default: {
            const behavior = deps.registry.behaviorOf(type)
            if (!behavior?.make) {
              throw new Error('AppKit spike does not support <' + type + '>')
            }

            behavior.make(node, props)
            break
          }
        }
      }

      if (node.lifecycle !== 'constructing') {
        throw new Error('AppKit node retired during construction')
      }
      if (type === 'liquidglass') {
        deps.containerElements.gridLayoutNodesByView.set(node.view!, node)
      }

      deps.elementProps.applyProps(node, props)
      if (node.lifecycle !== 'constructing') {
        throw new Error('AppKit node retired during construction')
      }
      if (node.view) {
        const owner = deps.registry.nodeContainersByView.get(node.view)
        if (owner && owner !== container) {
          throw new Error('AppKit node view is already owned by another Octane root.')
        }

        deps.registry.nodeContainersByView.set(node.view, container)
        deps.registry.cssNodesByView.set(node.view, node)
        deps.cssPseudoState.syncPseudoTracking(node)
      }

      if (node.lifecycle !== 'constructing') {
        throw new Error('AppKit node retired during construction')
      }
      node.lifecycle = 'live'
      return node
    } catch (error) {
      // Release whatever the failed creation registered — action slots,
      // observers, WebView delegates — since no caller can destroy it.
      const failures = new FailureCollector()
      failures.run('construction', () => { throw error })
      failures.run('construction cleanup', () => destroy(node))
      failures.throwIfFailed()
      throw error
    }
  }

  function destroy(node: ElementNode) {
    if (node.lifecycle === 'disposing' || node.lifecycle === 'disposed') {
      return
    }
    node.lifecycle = 'disposing'
    const failures = new FailureCollector()
    const release = (phase: string, operation: () => void) => failures.run(phase, operation)

    // Feature dispatch checks lifecycle before entering user code. Retire every
    // stored hook before invoking any of them so reentrant destroy is inert.
    const hooks = [...(node.destroyHooks ?? [])]
    node.destroyHooks = undefined
    release('adapter retire', () => node.adapter?.retire?.(node))
    if (!node.adapter) {
      release('retire text layout', () => deps.inputElements.disposeBuiltinTextViewLayout(node))
    }
    release('focus subscription', () => {
      if (node.view && (typeof node.props.onFocus === 'function' || typeof node.props.onBlur === 'function')) {
        deps.subscriptions.focusWithinDispatcher.set(node.view)
      }
    })
    release('keyboard subscription', () => {
      if (node.view && (typeof node.props.onKeyDown === 'function' || typeof node.props.onKeyUp === 'function')) {
        deps.subscriptions.keyboardDispatcher.set(node.view)
      }
    })
    release('css dirty', () => node.container?.cssDirty?.delete(node))
    release('animations', () => deps.cssAnimations.cancelKeyframeAnimations(node))
    for (const [index, hook] of hooks.entries()) {
      release('destroy hook ' + index, hook)
    }
    release('adapter prepare', () => node.adapter?.prepareDispose?.(node))
    // Explicit legacy cohort only: migrated nodes never enter this path.
    if (!node.adapter) {
      release('behavior prepare', () => deps.registry.behaviorOf(node.type)?.destroy?.(node))
      release('list prepare', () => deps.hostedElements.disposeBuiltinListView(node))
      release('pager prepare', () => deps.hostedElements.disposeBuiltinPager(node))
      release('video prepare', () => deps.hostedElements.disposeBuiltinVideo(node))
      release('tab prepare', () => deps.hostedElements.disposeBuiltinTabView(node))
      release('tab item prepare', () => deps.hostedElements.disposeBuiltinTabItem(node))
      release('segment item prepare', () => deps.pickerElements.disposeBuiltinSegmentedItem(node))
      release('segment children prepare', () => deps.pickerElements.disposeBuiltinSegmentedChildren(node))
      release('formatted prepare', () => deps.textElements.disposeBuiltinFormattedText(node))
      release('proxy prepare', () => deps.projection.disposeBuiltinProxyChildren(node))
      release('root layout prepare', () => deps.containerElements.disposeBuiltinRootLayout(node))
      release('glass prepare', () => deps.containerElements.disposeBuiltinLiquidGlass(node))
      release('content prepare', () => deps.containerElements.disposeBuiltinContentHost(node))
      release('placeholder prepare', () => deps.containerElements.disposeBuiltinPlaceholder(node))
    }

    release('detach', () => deps.tree.detach(node.container, node))
    release('press gestures', () => disposePressGestures(node))
    if (!node.adapter) { release('text links', () => deps.textElements.disposeTextLinks(node)) }
    const hover = node.cssHoverDispose
    node.cssHoverDispose = undefined
    release('hover', () => hover?.())
    release('visual state', () => setVisualStateTracking(node, null))
    release('adapter dispose', () => node.adapter?.dispose?.(node))
    // Canonical definitions own their feature actions. Legacy types retain
    // the blanket feature cleanup only until their P6 migration.
    if (!node.adapter) {
      release('actions', () => deps.actions.disposeActions(node))

      release('text input dispose', () => deps.inputElements.disposeBuiltinTextInput(node))
      release('web dispose', () => deps.hostedElements.disposeBuiltinWebView(node))
      release('segment dispose', () => deps.pickerElements.disposeBuiltinSegmentedControl(node))
      release('list picker dispose', () => deps.pickerElements.disposeBuiltinListPicker(node))
      release('time picker dispose', () => deps.pickerElements.disposeBuiltinTimePicker(node))
      release('date picker dispose', () => deps.pickerElements.disposeBuiltinDatePicker(node))
      release('image dispose', () => deps.imageElements.disposeBuiltinImage(node))
      release('scroll dispose', () => deps.controls.disposeBuiltinScrollView(node))
    }

    const detachScrollGeometry = node.scrollGeometryDetach
    node.scrollGeometryDetach = null
    release('scroll geometry', () => detachScrollGeometry?.())
    const constraints = node.scrollAxisConstraints ?? []
    node.scrollAxisConstraints = undefined
    for (const constraint of constraints) {
      release('scroll constraint', () => { constraint.active = false })
    }
    const layoutObserver = node.layoutObserver
    node.layoutObserver = null
    release('layout observer', () => { if (layoutObserver) { NSNotificationCenter.defaultCenter.removeObserver(layoutObserver) } })
    release('box paint', () => deps.boxPaint.dispose(node))
    const observedView = node.layoutObservedView
    node.layoutObservedView = null
    release('layout identity', () => deps.layout.layoutHandlers.delete(observedView))
    release('accessibility', () => deps.accessibility.disposeAccessibility(node))
    release('view owner identity', () => {
      if (node.view && typeof deps.registry.nodeContainersByView !== 'undefined' && deps.registry.nodeContainersByView.get(node.view) === node.container) {
        deps.registry.nodeContainersByView.delete(node.view)
      }
    })
    release('css view identity', () => {
      if (node.view && deps.registry.cssNodesByView.get(node.view) === node) {
        deps.registry.cssNodesByView.delete(node.view)
      }
    })
    release('node identity', () => {
      if (node.container.nodes?.get(node.id) === node) {
        node.container.nodes.delete(node.id)
      }
    })
    node.lifecycle = 'disposed'
    failures.throwIfFailed()
  }

  return {
    validateNodeProps,
    makeNode,
    destroy,
  }
}
