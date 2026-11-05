import { createElementAdapterCatalog } from './element-adapter.ts'
import type { ElementNode, RootContainer } from './model'
import type { UniversalHostParent, UniversalPortalTargetHandle } from 'octane/universal/native'
import type { NSView } from '@octane-xplat/platform/macos'

export type Registry = ReturnType<typeof createRegistry>

export function createRegistry() {
  const adapters = createElementAdapterCatalog()

  function adapterFor(type: string | undefined) {
    return type ? adapters.lookup(type) : undefined
  }

  function typeHasView(type: string) {
    return type === 'portalroot' || adapterFor(type)?.hasView === true
  }

  function assertSupportedType(type: string) {
    if (!adapterFor(type)) {
      throw new Error('AppKit spike does not support <' + type + '>')
    }
  }

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
    return type === 'portalroot' || adapterFor(type)?.container === true
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

  function isManualLayoutParent(node: Pick<ElementNode, 'adapter'> | null | undefined) {
    return node?.adapter?.layout != null
  }
  return {
    adapters,
    typeHasView,
    assertSupportedType,
    nodeContainersByView,
    portalHandlesByNode,
    cssNodesByView,
    parentReference,
    resolveParentNode,
    canContainView,
    isPortalTargetView,
    adapterFor,
    isManualLayoutParent,
  }
}
