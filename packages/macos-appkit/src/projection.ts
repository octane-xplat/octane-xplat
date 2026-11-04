import { effectiveStyle, isCollapsed } from './style-values.ts'
import type { NativeStyle } from './native-style'
import type { Layout } from './layout'
import type { CssCascade } from './css-cascade'
import type { Registry } from './registry'
import type { Tree } from './tree'
import type { PropBag, ElementNode, RootContainer } from './model'
import { NSView, NSWindowOrderingMode } from '@octane-xplat/platform/macos'
import type { UniversalHostCommand, UniversalHostParent } from 'octane/universal/native'

interface Dependencies {
  nativeStyle: Pick<NativeStyle, 'deactivateSizeConstraints'>
  layout: Pick<Layout, 'releasePlacementPins' | 'layoutView' | 'pinLayoutChild'>
  cssCascade: Pick<CssCascade, 'markStyleDirty' | 'setNodeInlineStyle'>
  registry: Pick<Registry, 'isManualLayoutParent' | 'parentReference' | 'typeHasView'>
  tree: Pick<Tree, 'detach'>
}

export type Projection = ReturnType<typeof createProjection>

export function createProjection(deps: Dependencies) {
  // NativeScript ProxyViewContainer's attached layout-property inventory.
  // These are forwarded to children; explicit child values retain precedence.
  const PROXY_LAYOUT_PROPS = [
    'left',
    'top',
    'dock',
    'flexDirection',
    'flexWrap',
    'justifyContent',
    'alignItems',
    'alignContent',
    'order',
    'flexGrow',
    'flexShrink',
    'flexWrapBefore',
    'alignSelf',
    'flexFlow',
    'flex',
    'column',
    'columnSpan',
    'col',
    'colSpan',
    'row',
    'rowSpan',
  ] as const

  const PROXY_LAYOUT_STYLES = [
    'position',
    'left',
    'right',
    'top',
    'bottom',
    'gridRow',
    'gridColumn',
    'gridRowStart',
    'gridRowEnd',
    'gridColumnStart',
    'gridColumnEnd',
    'gridArea',
    'order',
    'alignSelf',
    'justifySelf',
    'flexGrow',
    'flexShrink',
    'flexBasis',
  ] as const

  function projectedViews(parent: ElementNode): ElementNode[] {
    const children = ['contentview', 'actionbar'].includes(parent.type ?? '')
      ? parent.contentChild
        ? [parent.contentChild]
        : []
      : parent.children

    return children.flatMap((child: ElementNode) => {
      if (isCollapsed(child)) {
        return []
      }

      if (child.type === 'proxyviewcontainer') {
        return projectedViews(child)
      }

      return child.view ? [child] : []
    })
  }

  function releaseProjectedView(node: ElementNode) {
    deps.nativeStyle.deactivateSizeConstraints(node)
    deps.layout.releasePlacementPins(node)
    const parent = node.layoutParent
    const view = parent?.childHost ?? parent?.view
    if (deps.layout.layoutView(node)?.superview === view) {
      view?.removeArrangedSubview?.(deps.layout.layoutView(node))
    }

    deps.layout.layoutView(node)?.removeFromSuperview()
    node.layoutParent = null
    if (node.authoredProps) {
      for (const name of PROXY_LAYOUT_PROPS) {
        if (node.props[name] !== node.authoredProps[name]) {
          node.props[name] = node.authoredProps[name]
        }
      }

      node.props.style = node.authoredProps.style
      deps.cssCascade.markStyleDirty(node)
    }
  }

  function syncProxyProjection(parent: ElementNode) {
    const children = projectedViews(parent)
    if (['contentview', 'actionbar'].includes(parent.type ?? '') && children.length > 1) {
      throw new Error(
        'AppKit <contentview> cannot project multiple ProxyViewContainer layout children',
      )
    }

    const previous = parent.projectedChildren ?? []
    for (const child of previous) {
      if (!children.includes(child) && child.layoutParent === parent) {
        releaseProjectedView(child)
      }
    }

    parent.projectedChildren = children
    const host = parent.childHost ?? parent.view
    const manual =
      ['liquidglass', 'contentview', 'actionbar', 'rootlayout', '#root', 'portalroot'].includes(
        parent.type,
      ) || deps.registry.isManualLayoutParent(parent.type)

    for (const child of children) {
      // Preserve authored values separately from the parent's forwarded values.
      child.authoredProps ??= { ...child.props }
      const chain: ElementNode[] = []
      for (let owner = child.parent; owner?.type === 'proxyviewcontainer'; owner = owner.parent) {
        chain.push(owner)
      }

      const forwarded: PropBag = {}
      const forwardedStyle: PropBag = {}
      for (const owner of chain.reverse()) {
        for (const name of PROXY_LAYOUT_PROPS) {
          if (owner.props[name] != null) {
            forwarded[name] = owner.props[name]
          }
        }

        for (const name of PROXY_LAYOUT_STYLES) {
          const ownerStyle = effectiveStyle(owner)
          if (ownerStyle[name] != null) {
            forwardedStyle[name] = ownerStyle[name]
          }
        }
      }

      deps.cssCascade.setNodeInlineStyle(child, { ...forwardedStyle, ...child.authoredProps.style })

      const changes: PropBag = {}
      for (const name of PROXY_LAYOUT_PROPS) {
        const next = child.authoredProps[name] ?? forwarded[name]
        if (next !== child.props[name]) {
          changes[name] = next
          child.props[name] = next
        }
      }

      child.layoutParent = parent
      if (manual) {
        if (deps.layout.layoutView(child).superview !== host) {
          host!.addSubview(deps.layout.layoutView(child))
        }

        deps.layout.layoutView(child).translatesAutoresizingMaskIntoConstraints = false
        deps.nativeStyle.deactivateSizeConstraints(child)
        if (parent.type === '#root') {
          deps.layout.pinLayoutChild(
            child,
            host,
            0,
            0,
            Number(host!.bounds.size.width),
            Number(host!.bounds.size.height),
          )
        }
      }
    }

    if (manual && host?.addSubviewPositionedRelativeTo) {
      const views = children.map(deps.layout.layoutView)
      const native = host.subviews
      const count = native.count
      const actual = Array.from({ length: Number(count) }, (_, index) =>
        native.objectAtIndex(index),
      ).filter((view) => views.includes(view))

      if (views.some((view, index) => view !== actual[index])) {
        let previous: NSView | null = null
        for (const view of views) {
          host.addSubviewPositionedRelativeTo(view, NSWindowOrderingMode.Above, previous)
          previous = view
        }
      }
    }
  }

  /** Simulate logical ownership and ContentView's current slot before applying
   * a batch. A proxy may be empty when inserted and gain its children later in
   * that same batch; checking only the insert command misses that failure. */
  function validateProxyTree(container: RootContainer, commands: readonly UniversalHostCommand[]) {
    if (
      ![...container.nodes.values()].some((node) => node.type === 'proxyviewcontainer') &&
      !commands.some((command) => 'type' in command && command.type === 'proxyviewcontainer')
    ) {
      return
    }

    const nodes = new Map<
      number,
      {
        type: string
        props: PropBag
        children: number[]
        parent: UniversalHostParent
        slot?: number | null
      }
    >()

    for (const node of container.nodes.values()) {
      nodes.set(node.id, {
        type: node.type,
        props: node.props,
        children: node.children.map((child) => child.id),
        parent: deps.registry.parentReference(node.parent),
        slot: node.contentChild?.id ?? null,
      })
    }

    const unlink = (id: number) => {
      const node = nodes.get(id)
      const parent =
        node?.parent == null || typeof node.parent !== 'number' ? null : nodes.get(node.parent)

      if (parent) {
        parent.children = parent.children.filter((child) => child !== id)
        if (parent.slot === id) {
          parent.slot = null
        }
      }

      if (node) {
        node.parent = null
      }
    }

    for (const command of commands) {
      if (command.op === 'create' || command.op === 'recreate') {
        const old = nodes.get(command.id)
        nodes.set(command.id, {
          type: command.type,
          props: command.props,
          children: [],
          parent: old?.parent ?? null,
        })
      } else if (command.op === 'update') {
        const node = nodes.get(command.id)
        if (node) {
          node.props = command.props
        }
      } else if (command.op === 'insert' || command.op === 'move') {
        unlink(command.id)
        const node = nodes.get(command.id)!,
          parent = typeof command.parent === 'number' ? nodes.get(command.parent) : null

        node.parent = command.parent
        if (parent) {
          const index = parent.children.indexOf(command.before!)
          parent.children.splice(index < 0 ? parent.children.length : index, 0, command.id)
          if (['contentview', 'actionbar'].includes(parent.type ?? '')) {
            parent.slot = command.id
          }
        }
      } else if (command.op === 'remove') {
        if (Object.is(nodes.get(command.id)?.parent, command.parent)) {
          unlink(command.id)
        }
      } else if (command.op === 'destroy') {
        unlink(command.id)
        nodes.delete(command.id)
      }
    }

    const count = (id: number, seen = new Set<number>()): number => {
      if (seen.has(id)) {
        throw new Error('AppKit ProxyViewContainer ownership cycle')
      }

      const node = nodes.get(id)
      if (!node || isCollapsed(node)) {
        return 0
      }

      if (node.type !== 'proxyviewcontainer') {
        return deps.registry.typeHasView(node.type) ? 1 : 0
      }

      return node.children.reduce((sum, child) => sum + count(child, new Set([...seen, id])), 0)
    }

    for (const [id, node] of nodes) {
      if (
        ['contentview', 'actionbar'].includes(node.type ?? '') &&
        node.slot != null &&
        count(node.slot) > 1
      ) {
        throw new Error(
          'AppKit <contentview> cannot project multiple ProxyViewContainer layout children',
        )
      }

      if (node.type === 'proxyviewcontainer') {
        count(id)
        for (const child of node.children) {
          const type = nodes.get(child)?.type
          if (type === '#text' || type === 'span') {
            throw new Error('AppKit <proxyviewcontainer> cannot contain text-only children')
          }
        }
      }
    }
  }
  function disposeBuiltinProxyChildren(node: ElementNode) {
    if (node.type === 'proxyviewcontainer') {
      deps.tree.detach(node.container, node)
      for (const child of node.children.slice()) {
        deps.tree.detach(node.container, child)
      }
    }
  }

  return {
    projectedViews,
    releaseProjectedView,
    syncProxyProjection,
    validateProxyTree,
    disposeBuiltinProxyChildren,
  }
}
