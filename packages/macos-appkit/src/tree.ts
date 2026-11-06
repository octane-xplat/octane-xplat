import { FailureCollector } from './failures.ts'
import type { CssAnimations } from './css-animations'
import type { CssCascade } from './css-cascade'
import type { Projection } from './projection'
import type { NativeStyle } from './native-style'
import type { Layout } from './layout'
import type { TextElements } from './text-elements'
import type { PickerElements } from './picker-elements'
import type { Registry } from './registry'
import type { PropBag, ElementNode, RootContainer } from './model'
import { syncTabView, detachTabItem } from './tab-view'
import type { UniversalHostParent } from 'octane/universal/native'
import { stylesheetScope } from '@octane-xplat/css-engine'

interface Dependencies {
  cssAnimations: Pick<CssAnimations, 'stopSubtreeAnimations'>
  cssCascade: Pick<CssCascade, 'markStyleDirty'>
  projection: Pick<Projection, 'releaseProjectedView' | 'projectedViews'>
  nativeStyle: Pick<NativeStyle, 'deactivateSizeConstraints' | 'applySizeConstraints'>
  layout: Pick<
    Layout,
    'releasePlacementPins' | 'layoutView' | 'queueLayoutReconcile' | 'setLayoutAction'
  >
  textElements: Pick<TextElements, 'syncText'>
  pickerElements: Pick<PickerElements, 'syncSegmentedBar'>
  registry: Pick<Registry, 'resolveParentNode' | 'canContainView' | 'isManualLayoutParent'>
}

export type Tree = ReturnType<typeof createTree>

export function createTree(deps: Dependencies) {
  function detach(container: RootContainer, node: ElementNode, preserveTab = false) {
    const previousParent = node.parent
    const failures = new FailureCollector()
    const release = (phase: string, operation: () => void) => failures.run(phase, operation)
    release('detach animations', () => deps.cssAnimations.stopSubtreeAnimations(node))
    if (node.type === 'tabviewitem' && !preserveTab) {
      release('detach tab', () => detachTabItem(node))
    }
    const physicalParent = node.layoutParent ?? previousParent
    if (node.layoutParent) {
      release('detach projection', () => deps.projection.releaseProjectedView(node))
    }
    if (node.type === 'proxyviewcontainer') {
      for (const child of deps.projection.projectedViews(node)) {
        release('detach proxy projection', () => deps.projection.releaseProjectedView(child))
      }
    }
    const siblings = previousParent?.children ?? container.children
    const index = siblings.indexOf(node)
    if (index >= 0) {
      siblings.splice(index, 1)
    }
    // Retire edges before native calls can reenter; the live parent still needs
    // synchronization even though the child has begun disposal.
    node.parent = null
    node.layoutParent = null
    release('detach size', () => deps.nativeStyle.deactivateSizeConstraints(node))
    release('detach placement', () => deps.layout.releasePlacementPins(node))
    if (node.view) {
      const parentView = physicalParent?.childHost ?? physicalParent?.view
      release('detach arranged view', () => {
        if (
          parentView?.removeArrangedSubview &&
          deps.layout.layoutView(node)?.superview === parentView
        ) {
          parentView.removeArrangedSubview(deps.layout.layoutView(node))
        }
      })

      release('detach native view', () => deps.layout.layoutView(node).removeFromSuperview())
    }
    if (
      previousParent &&
      ['contentview', 'actionbar'].includes(previousParent.type) &&
      previousParent.contentChild === node
    ) {
      previousParent.contentChild = null
      release('detach content size', () => previousParent.view!.invalidateIntrinsicContentSize())
    }
    release('detach parent layout', () =>
      deps.layout.queueLayoutReconcile(container, previousParent),
    )
    release('detach parent text', () => deps.textElements.syncText(previousParent))
    if (previousParent?.type === 'tabview') {
      release('detach parent tab', () => syncTabView(previousParent))
    }
    if (previousParent?.type === 'segmentedbar') {
      release('detach parent segment', () => deps.pickerElements.syncSegmentedBar(previousParent))
    }
    failures.throwIfFailed()
  }

  function validateTextNesting(parentType: string | undefined, childType: string) {
    if (parentType === 'listview') {
      throw new Error('AppKit <listview> takes item templates, not JSX children')
    }

    if (parentType === 'tabview' && childType !== 'tabviewitem') {
      throw new TypeError('AppKit <tabview> accepts only tabviewitem children')
    }

    if (childType === 'tabviewitem' && parentType !== 'tabview' && parentType !== undefined) {
      throw new TypeError('AppKit <tabviewitem> requires a tabview parent or an unparented handle')
    }

    if (parentType === 'tabviewitem') {
      throw new TypeError('AppKit <tabviewitem> content requires the xplatMacOS compiler adapter')
    }

    if (parentType === 'segmentedbaritem') {
      throw new Error('AppKit <segmentedbaritem> takes title content, not JSX children')
    }

    if (childType === 'segmentedbaritem' && parentType !== 'segmentedbar') {
      throw new Error('AppKit <segmentedbaritem> requires a segmentedbar parent')
    }

    if (parentType === 'progress') {
      throw new Error('AppKit <progress> cannot contain JSX children')
    }

    if (parentType === 'placeholder') {
      throw new Error('AppKit <placeholder> content comes from creatingView, not JSX children')
    }

    if (parentType === 'segmentedbar' && childType !== 'segmentedbaritem') {
      throw new Error('AppKit <segmentedbar> accepts only segmentedbaritem children')
    }

    if (parentType === 'listpicker') {
      throw new Error('AppKit <listpicker> cannot contain JSX children')
    }

    if (parentType === 'timepicker') {
      throw new Error('AppKit <timepicker> cannot contain JSX children')
    }

    if (parentType === 'datepicker') {
      throw new Error('AppKit <datepicker> cannot contain JSX children')
    }

    if (parentType === 'activityindicator') {
      throw new Error('AppKit <activityindicator> cannot contain JSX children')
    }

    if (parentType === 'htmlview') {
      throw new Error('AppKit <htmlview> takes html content, not JSX children')
    }

    if (parentType === 'formattedstring' && childType !== 'span') {
      throw new Error('AppKit <formattedstring> accepts only span children')
    }

    if (parentType === 'span' && !['span', '#text'].includes(childType)) {
      throw new Error('AppKit <span> accepts only span or text children')
    }

    if (
      childType === 'formattedstring' &&
      !['label', 'button', 'textfield', 'textview', 'searchbar'].includes(parentType ?? '')
    ) {
      throw new Error('AppKit <formattedstring> requires a text-bearing parent')
    }

    if (parentType === 'searchbar' && childType !== 'formattedstring') {
      throw new Error('AppKit <searchbar> cannot contain children other than formattedstring')
    }
  }

  // Name the offending child (text preview or element type) and the parent's
  // id — "cannot contain text-only children" alone can't say which fixture
  // or leaf produced the illegal nesting.
  function textOnlyChildError(
    parent: { type: string; props?: PropBag } | null | undefined,
    childType: string,
    child?: { props?: PropBag; text?: string },
  ) {
    const text = child?.text ?? child?.props?.value
    const detail =
      childType === '#text' ? ` ("${String(text ?? '').slice(0, 60)}")` : ` (<${childType}>)`
    return new Error(
      'AppKit <' +
        (parent?.type ?? '?') +
        '> cannot contain text-only children' +
        detail +
        (parent?.props?.id ? ` — parent id=${parent.props.id}` : ''),
    )
  }

  function insert(
    container: RootContainer,
    parentId: UniversalHostParent,
    node: ElementNode,
    beforeId: number | null,
  ) {
    const parent = deps.registry.resolveParentNode(container, parentId)
    validateTextNesting(parent?.type, node.type)
    // Validate before detaching — a rejected insert must not leave the node
    // orphaned from its current parent.
    if (parentId !== null && !parent) {
      throw new Error(
        'Unknown AppKit ' +
          (typeof parentId === 'number' ? 'parent ' + parentId : 'portal parent ' + parentId.id),
      )
    }

    if (
      ['masonview', 'contentview', 'actionbar', 'rootlayout', 'proxyviewcontainer'].includes(
        parent?.type ?? '',
      ) &&
      !node.view &&
      node.type !== 'proxyviewcontainer'
    ) {
      throw textOnlyChildError(parent, node.type, node)
    }

    if (
      parent &&
      (node.view || node.type === 'proxyviewcontainer') &&
      !(parent.type === 'portalroot' || parent.adapter?.container === true)
    ) {
      throw new Error('AppKit <' + parent.type + '> cannot contain child views')
    }

    const projected =
      node.type === 'proxyviewcontainer' ||
      parent?.type === 'proxyviewcontainer' ||
      parent?.projectedChildren ||
      parent?.children.some((child) => child.type === 'proxyviewcontainer')

    const parentView = parent?.childHost ?? parent?.view ?? container.hostView
    if (node.view && !parentView) {
      throw new Error('AppKit host has no parent view for node ' + node.id)
    }

    detach(container, node, node.type === 'tabviewitem' && node.parent === parent)
    const siblings = parent ? parent.children : container.children
    const beforeIndex =
      beforeId === null ? -1 : siblings.findIndex((child) => child.id === beforeId)
    const index = beforeIndex < 0 ? siblings.length : beforeIndex
    siblings.splice(index, 0, node)
    node.parent = parent
    if (projected) {
      if (parent && ['contentview', 'actionbar'].includes(parent.type)) {
        const previous = parent.contentChild
        if (previous && previous !== node) {
          for (const child of previous.type === 'proxyviewcontainer'
            ? deps.projection.projectedViews(previous)
            : [previous]) {
            deps.projection.releaseProjectedView(child)
          }
        }

        if (parent.type === 'actionbar') {
          parent.actionBarExternal = null
        }

        parent.contentChild = node
      }

      deps.layout.queueLayoutReconcile(container, parent ?? node)
      if (node.type === 'placeholder') {
        node.adapter?.didAttach?.(node)
      }

      return
    }

    if (node.view) {
      if (parent) {
        if (
          ['portalroot', 'liquidglass', 'contentview', 'actionbar', 'rootlayout'].includes(
            parent.type,
          ) ||
          deps.registry.isManualLayoutParent(parent)
        ) {
        }

        if (parent.type === 'portalroot') {
          parentView.addSubview(deps.layout.layoutView(node))
          deps.layout.layoutView(node).translatesAutoresizingMaskIntoConstraints = false
          deps.layout
            .layoutView(node)
            .leadingAnchor.constraintEqualToAnchor(parentView.leadingAnchor).active = true

          deps.layout
            .layoutView(node)
            .trailingAnchor.constraintEqualToAnchor(parentView.trailingAnchor).active = true

          deps.layout
            .layoutView(node)
            .topAnchor.constraintEqualToAnchor(parentView.topAnchor).active = true

          deps.layout
            .layoutView(node)
            .bottomAnchor.constraintEqualToAnchor(parentView.bottomAnchor).active = true

          deps.nativeStyle.applySizeConstraints(node)
          deps.layout.queueLayoutReconcile(container, parent)
        } else if (['contentview', 'actionbar'].includes(parent.type ?? '')) {
          const previous = parent.contentChild
          if (previous && previous !== node) {
            deps.layout.releasePlacementPins(previous)
            deps.layout.layoutView(previous).removeFromSuperview()
          }

          if (parent.type === 'actionbar') {
            parent.actionBarExternal = null
          }

          parent.contentChild = node
          parentView.addSubview(deps.layout.layoutView(node))
          deps.layout.layoutView(node).translatesAutoresizingMaskIntoConstraints = false
          deps.nativeStyle.deactivateSizeConstraints(node)
          deps.layout.queueLayoutReconcile(container, parent)
        } else if (deps.registry.isManualLayoutParent(parent)) {
          parentView.addSubview(deps.layout.layoutView(node))
          deps.layout.layoutView(node).translatesAutoresizingMaskIntoConstraints = false
          deps.nativeStyle.deactivateSizeConstraints(node)
          deps.layout.queueLayoutReconcile(container, parent)
        } else {
          parentView.addSubview(deps.layout.layoutView(node))
          deps.layout.layoutView(node).translatesAutoresizingMaskIntoConstraints = false
          deps.nativeStyle.applySizeConstraints(node)
        }
      } else {
        parentView.addSubview(deps.layout.layoutView(node))
        deps.layout
          .layoutView(node)
          .leadingAnchor.constraintEqualToAnchor(parentView.leadingAnchor).active = true

        deps.layout
          .layoutView(node)
          .trailingAnchor.constraintEqualToAnchor(parentView.trailingAnchor).active = true

        deps.layout
          .layoutView(node)
          .topAnchor.constraintEqualToAnchor(parentView.topAnchor).active = true

        deps.layout
          .layoutView(node)
          .bottomAnchor.constraintEqualToAnchor(parentView.bottomAnchor).active = true

        deps.nativeStyle.applySizeConstraints(node)
      }

      if (node.type === 'placeholder') {
        node.adapter?.didAttach?.(node)
      }

      deps.cssCascade.markStyleDirty(node, true)
      if (
        parent &&
        (stylesheetScope().hasAdjacentCombinatorSelectors ||
          stylesheetScope().hasSiblingCombinatorSelectors)
      ) {
        for (const sib of parent.children) {
          if (sib !== node) {
            deps.cssCascade.markStyleDirty(sib, true)
          }
        }
      }
    } else {
      if (parent?.type === 'tabview') {
        syncTabView(parent)
      } else if (parent?.type === 'segmentedbar') {
        deps.pickerElements.syncSegmentedBar(parent)
      } else {
        deps.textElements.syncText(parent)
      }
    }
  }

  function remove(container: RootContainer, parentId: UniversalHostParent, node: ElementNode) {
    const expectedParent = deps.registry.resolveParentNode(container, parentId)
    if (node.parent !== expectedParent) {
      return
    }
    if (
      expectedParent &&
      (stylesheetScope().hasAdjacentCombinatorSelectors ||
        stylesheetScope().hasSiblingCombinatorSelectors)
    ) {
      for (const sib of expectedParent.children) {
        if (sib !== node) {
          deps.cssCascade.markStyleDirty(sib, true)
        }
      }
    }

    if (
      node.type === 'proxyviewcontainer' ||
      expectedParent?.type === 'proxyviewcontainer' ||
      node.layoutParent
    ) {
      detach(container, node)
      return
    }

    if (node.type === 'tabviewitem') {
      detachTabItem(node)
    }

    const siblings = expectedParent ? expectedParent.children : container.children
    const index = siblings.indexOf(node)
    if (index >= 0) {
      siblings.splice(index, 1)
    }

    deps.nativeStyle.deactivateSizeConstraints(node)
    deps.layout.releasePlacementPins(node)
    if (node.view) {
      const parentView = expectedParent?.childHost ?? expectedParent?.view
      if (
        parentView?.removeArrangedSubview &&
        deps.layout.layoutView(node)?.superview === parentView
      ) {
        parentView.removeArrangedSubview(deps.layout.layoutView(node))
      }

      deps.layout.layoutView(node).removeFromSuperview()
      deps.layout.setLayoutAction(node, node.props?.onLayoutChanged)
    }

    if (
      expectedParent &&
      ['contentview', 'actionbar'].includes(expectedParent.type) &&
      expectedParent.contentChild === node
    ) {
      expectedParent.contentChild = null
      expectedParent.view!.invalidateIntrinsicContentSize()
    }

    deps.layout.queueLayoutReconcile(container, expectedParent)
    node.parent = null
    deps.textElements.syncText(expectedParent)
    if (expectedParent?.type === 'tabview') {
      syncTabView(expectedParent)
    }

    if (expectedParent?.type === 'segmentedbar') {
      deps.pickerElements.syncSegmentedBar(expectedParent)
    }
  }
  return {
    detach,
    validateTextNesting,
    textOnlyChildError,
    insert,
    remove,
  }
}
