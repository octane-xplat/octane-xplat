import { createElementAdapterCatalog, unconvertedElementTypes } from './element-adapter.ts'
import type { ElementNode, RootContainer, ElementBehavior } from './model'
import type { UniversalHostParent, UniversalPortalTargetHandle } from 'octane/universal/native'
import type { NSView } from '@octane-xplat/platform/macos'

export type Registry = ReturnType<typeof createRegistry>

export function createRegistry() {
  const adapters = createElementAdapterCatalog()

  /** Types whose views arrange child views; mirrors the check in insert(). */
  const VIEW_PARENT_TYPES = new Set([
    'rootlayout',
    'contentview',
    'actionbar',
    'proxyviewcontainer',
    'masonview',
    'scrollview',
    'liquidglass',
  ])

  /** Builtin types implemented by the node and element factories. */
  const SUPPORTED_TYPES = new Set([
    ...VIEW_PARENT_TYPES,
    'label',
    'htmlview',
    '#text',
    'button',
    'textfield',
    'textview',
    'searchbar',
    'switch',
    'slider',
    'activityindicator',
    'progress',
    'datepicker',
    'timepicker',
    'listpicker',
    'listview',
    'segmentedbar',
    'tabview',
    'tabviewitem',
    'segmentedbaritem',
    'webview',
    'image',
    'animatedimage',
    'pager',
    'xplatvideo',
    'placeholder',
    'span',
    'formattedstring',
  ])

  function typeHasView(type: string) {
    return adapters.lookup(type)?.hasView ?? (
      type !== 'tabviewitem' &&
      type !== 'segmentedbaritem' &&
      type !== '#text' &&
      type !== 'span' &&
      type !== 'formattedstring' &&
      type !== 'proxyviewcontainer'
    )
  }

  function assertSupportedType(type: string) {
    if (adapters.lookup(type)) { return }
    if ((SUPPORTED_TYPES.has(type) && !unconvertedElementTypes.has(type)) ||
      (!SUPPORTED_TYPES.has(type) && !elementBehaviors.has(type))) {
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
    return (
      adapters.lookup(type)?.container ?? (VIEW_PARENT_TYPES.has(type) ||
      type === 'portalroot' ||
      behaviorOf(type)?.container === true)
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
      adapters.lookup(type ?? '')?.layout != null ||
      ['actionbar', 'rootlayout'].includes(type ?? '') ||
      behaviorOf(type)?.layout != null
    )
  }
  return {
    adapters,
    VIEW_PARENT_TYPES,
    typeHasView,
    assertSupportedType,
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
