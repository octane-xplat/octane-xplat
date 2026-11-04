import type { Nodes } from './nodes'
import type { ElementNode, RootContainer, ElementBehavior } from './model'
import type { UniversalHostParent, UniversalPortalTargetHandle } from 'octane/universal/native'
import { NSView } from '@octane-xplat/platform/macos'

interface Dependencies {
  nodes: Pick<Nodes, 'VIEW_PARENT_TYPES'>
}

export type Registry = ReturnType<typeof createRegistry>

export function createRegistry(deps: Dependencies) {
  const nodeContainersByView = new WeakMap<object, RootContainer>()

  const portalHandlesByNode = new WeakMap<ElementNode, UniversalPortalTargetHandle>()

  /** Every node view, for firstResponder→node resolution (focus pseudo-classes). */
  const cssNodesByView = new WeakMap<object, ElementNode>()

  function parentReference(parent: ElementNode | null | undefined): UniversalHostParent {
    if (!parent) {
      return null
    }

    const handle =
      typeof portalHandlesByNode === 'undefined' ? undefined : portalHandlesByNode.get(parent)

    return handle ?? parent.id ?? null
  }

  function resolveParentNode(
    container: RootContainer,
    parent: UniversalHostParent,
  ): ElementNode | null {
    if (parent === null) {
      return null
    }

    if (typeof parent === 'number') {
      return container.nodes.get(parent) ?? null
    }

    return container.portalTargets.get(parent)?.root ?? null
  }

  function canContainView(type: string): boolean {
    return (
      deps.nodes.VIEW_PARENT_TYPES.has(type) ||
      type === 'portalroot' ||
      behaviorOf(type)?.container === true
    )
  }

  function isPortalTargetView(target: unknown): target is NSView {
    if (target === null || typeof target !== 'object') {
      return false
    }

    const view = target as NSView
    return (
      typeof view.addSubview === 'function' &&
      typeof view.leadingAnchor?.constraintEqualToAnchor === 'function' &&
      typeof view.trailingAnchor?.constraintEqualToAnchor === 'function' &&
      typeof view.topAnchor?.constraintEqualToAnchor === 'function' &&
      typeof view.bottomAnchor?.constraintEqualToAnchor === 'function'
    )
  }

  /** Per-type behavior for Mason containers and compatibility/plugin elements.
   *  Generic renderer dispatch checks this registry before builtin handlers. */
  const elementBehaviors = new Map<string, ElementBehavior>()

  function registerElementType(type: string, behavior: ElementBehavior) {
    elementBehaviors.set(type, behavior)
  }

  function behaviorOf(type: string | undefined): ElementBehavior | undefined {
    return type ? elementBehaviors.get(type) : undefined
  }

  /** Parents that position children themselves — child margins and size
   *  constraints are consumed by the host's own layout pass. */
  function isManualLayoutParent(type: string | undefined) {
    return (
      ['contentview', 'actionbar', 'rootlayout'].includes(type ?? '') ||
      behaviorOf(type)?.layout != null
    )
  }
  return {
    nodeContainersByView,
    portalHandlesByNode,
    cssNodesByView,
    parentReference,
    resolveParentNode,
    canContainView,
    isPortalTargetView,
    elementBehaviors,
    registerElementType,
    behaviorOf,
    isManualLayoutParent,
  }
}
