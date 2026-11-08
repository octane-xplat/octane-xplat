import type { ElementAdapter } from './element-adapter'
import type { BoxPaint } from './box-paint'
import { FailureCollector } from './failures.ts'
import type { CssAnimations } from './css-animations'
import type { Registry } from './registry'
import type { Tree } from './tree'
import type { CssCascade } from './css-cascade'
import type { ElementProps } from './element-props'
import type { CssPseudoState } from './css-pseudo-state'
import type { Subscriptions } from './subscriptions'
import type { Layout } from './layout'
import type { Accessibility } from './accessibility'
import type { PropBag, ElementNode, RootContainer } from './model'
import { normalizeHostStyleProps } from './inline-style.ts'
import { NSNotificationCenter } from '@octane-xplat/platform/macos'
import { nativeColor } from './native-colors'

import { disposePressGestures, setVisualStateTracking } from './gestures'

interface Dependencies {
  boxPaint: Pick<BoxPaint, 'dispose'>
  cssAnimations: Pick<CssAnimations, 'cancelKeyframeAnimations'>
  registry: Pick<
    Registry,
    'adapters' | 'assertSupportedType' | 'nodeContainersByView' | 'cssNodesByView'
  >
  tree: Pick<Tree, 'detach'>
  cssCascade: Pick<CssCascade, 'cssChildren'>
  elementProps: Pick<ElementProps, 'applyProps'>
  cssPseudoState: Pick<CssPseudoState, 'syncPseudoTracking'>
  subscriptions: Pick<Subscriptions, 'focusWithinDispatcher' | 'keyboardDispatcher'>
  layout: Pick<Layout, 'layoutHandlers'>
  accessibility: Pick<Accessibility, 'disposeAccessibility'>
}

export type Nodes = ReturnType<typeof createNodes>

export function createNodes(deps: Dependencies) {
  /** Deterministic prop failures that would otherwise throw after views and
   *  registrations exist. `baseProps` supplies already-applied props for
   *  update commands so merged-prop rules (e.g. placeholder color) stay exact. */
  function validateNodeProps(
    type: string,
    props: PropBag | undefined,
    baseProps?: PropBag,
    adapter: ElementAdapter | undefined = deps.registry.adapters.lookup(type),
  ) {
    props = normalizeHostStyleProps(props)
    adapter?.validate?.(props ?? {}, baseProps)
    if (adapter?.styleValidation === 'none') {
      return
    }

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

      if (adapter?.styleValidation === 'text' && style.color != null) {
        nativeColor(style.color)
      }
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
      if (!node.adapter) {
        throw new Error('AppKit node requires an acquired adapter')
      }

      node.adapter.create(node, props)

      if (node.lifecycle !== 'constructing') {
        throw new Error('AppKit node retired during construction')
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

      failures.run('construction', () => {
        throw error
      })

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
    release('focus subscription', () => {
      if (
        node.view &&
        (typeof node.props.onFocus === 'function' || typeof node.props.onBlur === 'function')
      ) {
        deps.subscriptions.focusWithinDispatcher.set(node.view)
      }
    })

    release('keyboard subscription', () => {
      if (
        node.view &&
        (typeof node.props.onKeyDown === 'function' || typeof node.props.onKeyUp === 'function')
      ) {
        deps.subscriptions.keyboardDispatcher.set(node.view)
      }
    })

    release('css dirty', () => node.container?.cssDirty?.delete(node))
    release('animations', () => deps.cssAnimations.cancelKeyframeAnimations(node))
    for (const [index, hook] of hooks.entries()) {
      release('destroy hook ' + index, hook)
    }

    release('adapter prepare', () => node.adapter?.prepareDispose?.(node))
    release('detach', () => deps.tree.detach(node.container, node))
    release('press gestures', () => disposePressGestures(node))

    const hover = node.cssHoverDispose

    node.cssHoverDispose = undefined
    release('hover', () => hover?.())
    release('visual state', () => setVisualStateTracking(node, null))
    release('adapter dispose', () => node.adapter?.dispose?.(node))

    const layoutObserver = node.layoutObserver

    node.layoutObserver = null
    release('layout observer', () => {
      if (layoutObserver) {
        NSNotificationCenter.defaultCenter.removeObserver(layoutObserver)
      }
    })

    release('box paint', () => deps.boxPaint.dispose(node))

    const observedView = node.layoutObservedView

    node.layoutObservedView = null
    release('layout identity', () => deps.layout.layoutHandlers.delete(observedView))
    release('accessibility', () => deps.accessibility.disposeAccessibility(node))
    release('view owner identity', () => {
      if (
        node.view &&
        typeof deps.registry.nodeContainersByView !== 'undefined' &&
        deps.registry.nodeContainersByView.get(node.view) === node.container
      ) {
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
