import type { Actions } from './actions'
import type { TextElements } from './text-elements'
import type { CssCascade } from './css-cascade'
import type { Layout } from './layout'
import type { Subscriptions } from './subscriptions'
import type { AccessibleHost } from './accessible-host'
import type { Accessibility } from './accessibility'
import type { PropBag, ElementNode } from './model'
import { normalizeHostStyleProps } from './inline-style.ts'
import { setPressGesture } from './gestures'

interface Dependencies {
  actions: Pick<Actions, 'hasHandler' | 'setPanAction'>
  textElements: Pick<TextElements, 'syncTextLinks'>
  cssCascade: Pick<CssCascade, 'setNodeId' | 'setPseudoClass' | 'syncNormalState'>
  layout: Pick<Layout, 'queueLayoutReconcile' | 'setLayoutAction'>
  subscriptions: Pick<Subscriptions, 'setKeyActions' | 'setFocusActions'>
  accessibleHost: Pick<AccessibleHost, 'AccessibleHostView'>
  accessibility: Pick<Accessibility, 'applyAccessibility'>
}

export type ElementProps = ReturnType<typeof createElementProps>

export function createElementProps(deps: Dependencies) {
  /** Host updates carry the complete next prop bag, but applyProps merges — a
   *  key that vanishes would keep its last value forever. Every dropped key
   *  with a recorded value gets an explicit `undefined` clear: node.props then
   *  reads it as removed and each handler resets the native state the prop
   *  installed (sync readers consult the merged bag; writers map `?? default`).
   *  A prior `undefined`/`null` applied nothing, so it needs no clear. */
  function droppedPropClears(node: ElementNode, next: PropBag): PropBag {
    const clears: PropBag = {}
    for (const name of Object.keys(node.props)) {
      if (node.props[name] != null && !(name in next)) {
        clears[name] = undefined
      }
    }

    const authored = node.authoredProps
    if (authored !== undefined) {
      for (const name of Object.keys(authored)) {
        if (authored[name] != null && !(name in next) && !(name in clears)) {
          clears[name] = undefined
        }
      }
    }

    return clears
  }

  function applyProps(node: ElementNode, props: PropBag) {
    props = normalizeHostStyleProps(props)
    if (node.lifecycle !== 'constructing') {
      node.adapter?.validate?.(props, node.props)
    }
    node.adapter?.beforeProps?.(node, props)

    node.props = { ...node.props, ...props }
    if ('testID' in props && node.view) {
      node.view.accessibilityIdentifier = String(props.testID ?? '')
    }
    if ('disabled' in props && node.clickGestureRecognizer) {
      node.clickGestureRecognizer.enabled =
        !node.props.disabled && deps.actions.hasHandler(node.view!)
    }
    if (
      ('disabled' in props || 'isEnabled' in props || 'enabled' in props) &&
      node.linkClickRecognizer
    ) {
      deps.textElements.syncTextLinks(node)
    }
    if ('id' in props) {
      deps.cssCascade.setNodeId(node, props.id)
    }
    if ('disabled' in props || 'isEnabled' in props || 'enabled' in props) {
      deps.cssCascade.setPseudoClass(
        node,
        'disabled',
        node.props.disabled === true ||
          node.props.isEnabled === false ||
          node.props.enabled === false,
      )

      deps.cssCascade.syncNormalState(node)
    }
    if (
      node.authoredProps ||
      node.parent?.type === 'proxyviewcontainer' ||
      node.type === 'proxyviewcontainer'
    ) {
      node.authoredProps = { ...node.authoredProps, ...props }
    }

    if (node.adapter && !node.adapter.hasView) {
      for (const [name, value] of Object.entries(props)) {
        node.adapter.applyProp?.(node, name, value)
      }
      node.adapter.afterProps?.(node, props)
      return
    }
    if ('onKeyDown' in props || 'onKeyUp' in props) {
      deps.subscriptions.setKeyActions(node)
    }
    if ('onFocus' in props || 'onBlur' in props) {
      deps.subscriptions.setFocusActions(node)
    }

    for (const [name, value] of Object.entries(props)) {
      if (name === 'data-grid-cell') {
        continue
      } // Retained in props for native useGridFocus discovery.

      if (name === 'testID') {
        continue
      } // Applied once to every concrete native host above.

      if (name === 'onKeyDown' || name === 'onKeyUp' || name === 'onFocus' || name === 'onBlur') {
        continue
      }

      if (
        (node.layoutParent ?? node.parent) &&
        (node.layoutParent ?? node.parent)?.adapter?.childProps?.has(name)
      ) {
        continue
      }

      // Attached alignment metadata is retained before the batch inserts
      // the child; its parent consumes it during layout reconciliation.
      if (
        !node.parent &&
        [
          'dock',
          'horizontalAlignment',
          'verticalAlignment',
          'row',
          'col',
          'rowSpan',
          'colSpan',
          'left',
          'top',
          'right',
          'bottom',
        ].includes(name)
      ) {
        continue
      }

      if (name === 'onLayoutChanged') {
        deps.layout.setLayoutAction(node, value)
        continue
      }

      if (node.adapter?.containerStyles) {
        if (['onTouch', 'onLongPress', 'onDoubleTap'].includes(name)) {
          setPressGesture(node, name)
          continue
        }

        if (name === 'onSwipe') {
          deps.actions.setPanAction(node, value)
          continue
        }

        if (name === 'disabled') {
          deps.actions.setPanAction(node, node.props.onPan)
          for (const event of ['onTouch', 'onLongPress', 'onDoubleTap']) {
            setPressGesture(node, event)
          }

          continue
        }
      }

      if (
        (name === 'onAccessibilityIncrement' || name === 'onAccessibilityDecrement') &&
        node.view instanceof deps.accessibleHost.AccessibleHostView
      ) {
        deps.accessibility.applyAccessibility(node, name, value)
        continue
      }

      node.adapter?.applyProp?.(node, name, value)
    }

    node.adapter?.afterProps?.(node, props)

    // A container queues its own subtree; a child of a layout parent also
    // queues the parent — the two are not exclusive (a masonview nested in a
    // masonview needs both passes).
    if (node.adapter?.layout != null) {
      deps.layout.queueLayoutReconcile(node.container, node)
    }
    if (node.parent?.adapter?.container === true) {
      deps.layout.queueLayoutReconcile(node.container, node.parent)
    }
  }
  return {
    droppedPropClears,
    applyProps,
  }
}
