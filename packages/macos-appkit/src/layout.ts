import { effectiveStyle } from './style-values.ts'
import type { Registry } from './registry'
import type { Projection } from './projection'
import type { ContainerElements } from './container-elements'
import type { ElementNode, RootContainer } from './model'
import {
  NSNotificationCenter,
  NSView,
  NSViewFrameDidChangeNotification,
} from '@octane-xplat/platform/macos'
import { createStickyPlacements } from './sticky-placement.ts'
import { observeScrollGeometry } from './scroll-view'

interface Dependencies {
  registry: Pick<Registry, 'cssNodesByView' | 'isManualLayoutParent' | 'behaviorOf'>
  projection: Pick<Projection, 'syncProxyProjection'>
  containerElements: Pick<ContainerElements, 'syncActionBar'>
}

export type Layout = ReturnType<typeof createLayout>

export function createLayout(deps: Dependencies) {
  function orderStickySiblings(node: ElementNode) {
    const parent = node.layoutParent ?? node.parent,
      host = layoutView(node)?.superview
    if (!parent || !host?.addSubviewPositionedRelativeTo) {
      return
    }
    const children = (parent.projectedChildren ?? parent.children).filter(
      (child) => child.view && layoutView(child)?.superview === host,
    )
    const ordered = children
      .slice()
      .sort((left, right) => stickyPlacements.priority(left) - stickyPlacements.priority(right))
      .map(layoutView)
    const native = host.subviews,
      count = Number(native?.count ?? native?.length ?? 0)
    const actual = Array.from({ length: count }, (_, i) =>
      native.objectAtIndex ? native.objectAtIndex(i) : native[i],
    ).filter((view) => ordered.includes(view))
    if (ordered.every((view, i) => view === actual[i])) {
      return
    }
    let previous: NSView | null = null
    for (const view of ordered) {
      host.addSubviewPositionedRelativeTo(view, 1, previous)
      previous = view
    }
  }

  const stickyPlacements = createStickyPlacements<ElementNode>({
    nodeFor: (view) => deps.registry.cssNodesByView.get(view),
    valid: (node, view) => node.view === view && node.container.nodes.get(node.id) === node,
    convert: (node, base, document) => {
      const parent = base.parent as NSView,
        target = document as NSView
      if (
        layoutView(node)?.superview !== parent ||
        !parent.window ||
        parent.window !== target.window ||
        !parent.isDescendantOf(target)
      ) {
        return
      }
      const rect = parent.convertRectToView(
        { origin: { x: base.x, y: base.y }, size: { width: base.width, height: base.height } },
        target,
      )
      const row = parent.convertRectToView(parent.bounds, target)
      const geometry = {
        x: Number(rect.origin.x),
        width: Number(rect.size.width),
        rowX: Number(row.origin.x),
        rowWidth: Number(row.size.width),
      }
      return Object.values(geometry).every(Number.isFinite) &&
        geometry.width >= 0 &&
        geometry.rowWidth > 0
        ? geometry
        : undefined
    },
    repin: (node, base) => {
      if (layoutView(node)?.superview === base.parent) {
        pinLayoutChild(node, base.parent, base.x, base.y, base.width, base.height)
      }
    },
    order: orderStickySiblings,
    invalidate: (node) => {
      const parent = node.layoutParent ?? node.parent
      if (parent) {
        queueLayoutReconcile(node.container, parent)
      }
    },
  })

  const MARGIN_SIDES: Record<string, string> = {
    marginTop: 'top',
    marginRight: 'right',
    marginBottom: 'bottom',
    marginLeft: 'left',
  }

  function layoutView(node: ElementNode) {
    return node.textViewport ?? node.view
  }

  /** Wrap/unwrap/re-apply margins on a node that is already arranged inside a
   *  stack. Margins set before insert are materialized there instead. */

  function setMarginStyle(node: ElementNode, name: string, value: any) {
    const points = Number(value)
    if (!Number.isFinite(points)) {
      console.warn(
        '[macos-style] ignored unsupported style.' + name + ' value ' + JSON.stringify(value),
      )

      return
    }

    const insets: Record<string, number> = (node.marginInsets ??= {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    })

    if (name === 'margin') {
      insets.top = insets.right = insets.bottom = insets.left = points
    } else {
      insets[MARGIN_SIDES[name]] = points
    }

    const parent = node.layoutParent ?? node.parent
    if (deps.registry.isManualLayoutParent(parent?.type)) {
      queueLayoutReconcile(node.container, parent)
    }
  }

  const layoutHandlers = new WeakMap<object, () => void>()

  /** Margin changes swap a node's arranged view without touching the node.
   *  Drop the observer and handler bound to the stale target — the caller
   *  re-runs `setLayoutAction`, which rebuilds both against the current
   *  arranged view so events keep reporting that view's bounds. */
  function syncLayoutObserver(node: ElementNode) {
    const observed = node.layoutObservedView
    if (!observed || observed === layoutView(node)) {
      return
    }

    layoutHandlers.delete(observed)
    if (node.layoutObserver) {
      NSNotificationCenter.defaultCenter.removeObserver(node.layoutObserver)
      node.layoutObserver = null
    }

    const detachGeometry = node.scrollGeometryDetach
    node.scrollGeometryDetach = null
    node.layoutObservedView = null
    detachGeometry?.()
  }

  /** `onLayoutChanged` prop: NSViewFrameDidChangeNotification on the arranged
   *  view (margin host when present) — the windowed VirtualList leaf measures
   *  rows through it. */
  function setLayoutAction(node: ElementNode, handler: ((event: any) => void) | undefined) {
    const target = layoutView(node)
    if (!target || node.type === '#text' || node.type === 'span') {
      return
    }

    syncLayoutObserver(node)
    if (typeof handler !== 'function') {
      layoutHandlers.delete(target)
      const detachGeometry = node.scrollGeometryDetach
      node.scrollGeometryDetach = null
      detachGeometry?.()
      return
    }

    target.postsFrameChangedNotifications = true
    if (node.type === 'scrollview') {
      if (!node.scrollGeometryDetach) {
        const detach = observeScrollGeometry(node, target, () => layoutHandlers.get(target)?.())
        if (node.scrollGeometryDetach !== detach) {
          return
        }

        node.layoutObservedView = target
      }
    } else if (!node.layoutObserver) {
      node.layoutObserver =
        NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
          typeof NSViewFrameDidChangeNotification !== 'undefined'
            ? NSViewFrameDidChangeNotification
            : 'NSViewFrameDidChangeNotification',
          target,
          null,
          () => layoutHandlers.get(target)?.(),
        )

      node.layoutObservedView = target
    }

    layoutHandlers.set(target, () => {
      if (node.lifecycle === 'disposing' || node.lifecycle === 'disposed') {
        return
      }
      const bounds = target.bounds
      try {
        node.container.root!.eventScope('discrete', () =>
          handler({
            object: target,
            width: Number(bounds.size.width ?? 0),
            height: Number(bounds.size.height ?? 0),
          }),
        )
      } catch (error) {
        console.error('[macos-event] layout handler failed', error)
      }
    })
  }

  function layoutLength(value: any, available: number, fallback: number) {
    if (typeof value === 'string' && value.trim().endsWith('%')) {
      const percent = Number(value.trim().slice(0, -1))
      return Number.isFinite(percent) ? (available * percent) / 100 : fallback
    }

    const length = Number(value)
    return Number.isFinite(length) ? length : fallback
  }

  /** Pin a grid/absolute child to the rect its parent's layout pass computed.
   *  Children are translates=false views, so Auto Layout owns their frames —
   *  an imperative frame write only holds until the next solve shrinks the
   *  child back to fitting size. Each axis gets one edge pin against the
   *  parent plus one size pin, so parent geometry stays an input; a pin set
   *  that also implied the parent's size would outrank the window's
   *  500-priority WindowSizeStayPut hold and lock the window at the content's
   *  fitting size. */
  function pinLayoutChild(
    child: ElementNode,
    parentView: any,
    x: number,
    top: number,
    width: number,
    height: number,
  ) {
    x = stickyPlacements.position(child, { parent: parentView, x, y: top, width, height })
    const pins = (child.placementPins ??= {})
    if (!pins.leading) {
      pins.leading = layoutView(child).leadingAnchor.constraintEqualToAnchorConstant(
        parentView.leadingAnchor,
        0,
      )

      pins.top = layoutView(child).topAnchor.constraintEqualToAnchorConstant(
        parentView.topAnchor,
        0,
      )
      pins.width = layoutView(child).widthAnchor.constraintEqualToConstant(0)
      pins.height = layoutView(child).heightAnchor.constraintEqualToConstant(0)
      for (const pin of [pins.leading, pins.top, pins.width, pins.height]) {
        pin.active = true
      }
    }

    const same = (a: number, b: number) => a === b || (Number.isNaN(a) && Number.isNaN(b))
    if (
      same(Number(pins.leading.constant), x) &&
      same(Number(pins.top.constant), top) &&
      same(Number(pins.width.constant), width) &&
      same(Number(pins.height.constant), height)
    ) {
      return
    }

    pins.leading.constant = x
    pins.top.constant = top
    pins.width.constant = width
    pins.height.constant = height
    // Constant writes inside a layout() pass apply only on the next solve, and
    // a needsLayout mark made now is cleared when that pass ends. Defer the
    // mark so the next layoutSubtreeIfNeeded/display cycle applies the pins —
    // without it, real-window resizes leave children at stale frames. The bare
    // vm slices in tests have no microtask queue, so fall back to a direct
    // mark there.
    const mark = () => {
      parentView.needsLayout = true
    }

    if (typeof queueMicrotask === 'function') {
      queueMicrotask(mark)
    } else {
      mark()
    }
  }

  /** Drop the pins a grid/absolute parent installed — a constraint that keeps
   *  referencing the old parent view is invalid once the child reparents. */
  function releasePlacementPins(node: ElementNode) {
    stickyPlacements.reset(node)
    const pins = node.placementPins
    if (!pins) {
      return
    }

    for (const pin of Object.values(pins) as { active: boolean }[]) {
      pin.active = false
    }

    node.placementPins = null
  }

  // Width/height percentages use the parent's full measured size, not the
  // progressively smaller strip. Explicit lengths are capped by the measure slot
  // (NativeScript ViewHelper.getMeasureSpec); margins consume additional space.
  function dockChildSize(
    child: ElementNode,
    axis: 'width' | 'height',
    available: number,
    basis: number,
  ) {
    const spec = child.sizeConstraintSpecs?.[axis]
    const desired = effectiveStyle(child)[axis]
    const intrinsic = layoutView(child).intrinsicContentSize?.[axis]
    const fitting = layoutView(child).fittingSize?.[axis]
    const natural = Math.max(0, Number(Number(intrinsic) >= 0 ? intrinsic : fitting) || 0)
    const length =
      desired != null
        ? typeof desired === 'string' && desired.endsWith('%') && !Number.isFinite(basis)
          ? natural
          : layoutLength(desired, basis, natural)
        : spec?.kind === 'points'
          ? spec.points
          : spec?.kind === 'percent' && Number.isFinite(basis)
            ? spec.multiplier * basis
            : natural

    const margins = child.marginInsets ?? {}
    const margin =
      axis === 'width'
        ? (margins.left ?? 0) + (margins.right ?? 0)
        : (margins.top ?? 0) + (margins.bottom ?? 0)

    return Math.max(
      0,
      Math.min(desired != null || spec ? available : Math.max(0, available - margin), length),
    )
  }

  function rootNaturalSize(parent: ElementNode | undefined) {
    let width = 0,
      height = 0

    for (const child of parent?.projectedChildren ?? parent?.children ?? []) {
      if (!child.view) {
        continue
      }

      const margins = child.marginInsets ?? {}
      width = Math.max(
        width,
        dockChildSize(child, 'width', Infinity, Infinity) +
          (margins.left ?? 0) +
          (margins.right ?? 0),
      )

      height = Math.max(
        height,
        dockChildSize(child, 'height', Infinity, Infinity) +
          (margins.top ?? 0) +
          (margins.bottom ?? 0),
      )
    }

    const padding = parent?.dockInsets ?? {}
    return {
      width: width + (padding.left ?? 0) + (padding.right ?? 0),
      height: height + (padding.top ?? 0) + (padding.bottom ?? 0),
    }
  }

  function layoutRootChildren(parent: ElementNode | undefined) {
    if (!parent?.view) {
      return
    }

    // Each child receives the whole padded cell.
    for (const child of parent.projectedChildren ?? parent.children) {
      if (!child.view) {
        continue
      }

      layoutContentChild({ ...parent, projectedChildren: [child] })
    }

    // JSX order is also native back-to-front order. Reorder only our own
    // children; window presentation layers and their ownership stay untouched.
    const children = (parent.projectedChildren ?? parent.children).filter((child) => child.view)
    const views = children.map(layoutView)
    const native = parent.view.subviews
    const count = native?.count
    const actual = Array.from({ length: Number(count ?? 0) }, (_, i) =>
      native.objectAtIndex(i),
    ).filter((view) => views.includes(view))

    if (views.some((view, index) => view !== actual[index])) {
      let previous: NSView | null = null
      for (const view of views) {
        parent.view.addSubviewPositionedRelativeTo(view, 1, previous)
        previous = view
      }
    }
  }

  function layoutContentChild(parent: ElementNode | undefined) {
    const child = parent?.projectedChildren ? parent.projectedChildren[0] : parent?.contentChild
    if (!parent?.view || !child?.view) {
      return
    }

    const width = Number(parent.view.bounds.size.width)
    const height = Number(parent.view.bounds.size.height)
    const style = effectiveStyle(child)
    const intrinsic = layoutView(child).intrinsicContentSize ?? { width: 0, height: 0 }
    const alignment = (value: any, start: string, end: string, fallback: string) => {
      if (value == null || value === 'auto' || value === 'normal') {
        return fallback
      }

      if (['start', 'self-start', 'flex-start'].includes(value)) {
        return start
      }

      if (['end', 'self-end', 'flex-end'].includes(value)) {
        return end
      }

      return value
    }
    const horizontal = alignment(
      style.justifySelf,
      'left',
      'right',
      child.props.horizontalAlignment ?? (parent.type === 'actionbar' ? 'center' : 'stretch'),
    )

    const vertical = alignment(
      style.alignSelf,
      'top',
      'bottom',
      child.props.verticalAlignment ?? (parent.type === 'actionbar' ? 'middle' : 'stretch'),
    )

    const margins = child.marginInsets ?? {}
    const axis = (
      available: number,
      desired: any,
      natural: number,
      alignment: string,
      start: number,
      end: number,
    ) => {
      const space = Math.max(0, available - start - end)
      const size =
        desired == null
          ? alignment === 'stretch'
            ? space
            : Math.max(0, Number(natural) || 0)
          : Math.max(0, layoutLength(desired, available, 0))

      const offset =
        alignment === 'right' || alignment === 'bottom'
          ? available - end - size
          : ['stretch', 'center', 'middle'].includes(alignment)
            ? start + (space - size) / 2
            : start

      return [offset, size]
    }

    const pad = parent.dockInsets ?? {}
    const [x, childWidth] = axis(
      width,
      style.width,
      intrinsic.width,
      horizontal,
      (margins.left ?? 0) + (pad.left ?? 0),
      (margins.right ?? 0) + (pad.right ?? 0),
    )

    const [top, childHeight] = axis(
      height,
      style.height,
      intrinsic.height,
      vertical,
      (margins.top ?? 0) + (pad.top ?? 0),
      (margins.bottom ?? 0) + (pad.bottom ?? 0),
    )

    pinLayoutChild(child, parent.view, x, top, childWidth, childHeight)
  }

  /** Mark a parent for one sibling-wide reconcile after the batch's commands.
   *  Insert/remove/update each used to rescan siblings, rebuild distribution,
   *  and recreate every child's cross-axis constraint on the spot — n inserts
   *  into one stack made that quadratic. Structural commands queue their dirty
   *  parents here; `prepareBatch.apply` drains the set once at the end. Outside
   *  a batch (no `layoutDirty` set) the reconcile runs immediately. */
  function queueLayoutReconcile(container: RootContainer, parent: ElementNode | null | undefined) {
    if (!parent) {
      return
    }

    while (parent?.type === 'proxyviewcontainer') {
      if (parent.parent) {
        parent = parent.parent
      } else {
        if (!container.children.includes(parent)) {
          return
        }

        parent = container.projectionRoot ??= {
          type: '#root',
          children: container.children,
          view: container.hostView,
          props: {},
          container,
        } as ElementNode

        break
      }
    }

    const pending = container?.layoutDirty
    if (pending) {
      pending.add(parent)
      return
    }

    reconcileLayoutParent(parent)
  }

  /** Drain a batch's layout parents. Ancestor Mason passes traverse their whole
   *  subtree, so every pending projection attaches before any pass can pin its
   *  views. */
  function drainLayoutDirty(dirty: Set<ElementNode>) {
    for (const parent of dirty) {
      if (
        parent.projectedChildren ||
        parent.children.some((child) => child.type === 'proxyviewcontainer')
      ) {
        deps.projection.syncProxyProjection(parent)
      }
    }
    for (const parent of dirty) {
      reconcileLayoutParent(parent)
    }
  }

  function reconcileLayoutParent(parent: ElementNode) {
    if (
      parent.projectedChildren ||
      parent.children.some((child) => child.type === 'proxyviewcontainer')
    ) {
      deps.projection.syncProxyProjection(parent)
    }

    if (parent.adapter) {
      parent.adapter.layout?.(parent)
      return
    }

    // Registered behaviors own their layout pass — mason-backed containers
    // (masonview, scrollview, liquidglass) never reach the builtin branches.
    const layoutBehavior = deps.registry.behaviorOf(parent.type)?.layout
    if (layoutBehavior) {
      parent.view?.invalidateIntrinsicContentSize()
      layoutBehavior(parent)
      return
    }

    if (parent.type === 'portalroot') {
      const views = (parent.projectedChildren ?? parent.children)
        .filter((child) => child.view)
        .map(layoutView)

      const host = parent.view
      const native = host?.subviews
      if (!host?.addSubviewPositionedRelativeTo || !native) {
        return
      }

      const count = native.count
      const actual = Array.from({ length: Number(count ?? 0) }, (_, index) =>
        native.objectAtIndex(index),
      ).filter((view) => views.includes(view))

      if (views.some((view, index) => view !== actual[index])) {
        let previous: NSView | null = null
        for (const view of views) {
          // NSWindowAbove = 1 (AppKit NSGraphics.h); preserve the portal's
          // logical sibling order without disturbing target-owned siblings.
          host.addSubviewPositionedRelativeTo(view, 1, previous)
          previous = view
        }
      }

      return
    }

    if (parent.type === 'rootlayout') {
      parent.view?.invalidateIntrinsicContentSize()
      layoutRootChildren(parent)
      if (['contentview', 'actionbar', 'rootlayout'].includes(parent.parent?.type ?? '')) {
        queueLayoutReconcile(parent.container, parent.parent)
      }

      return
    }

    if (parent.type === 'actionbar') {
      parent.view?.invalidateIntrinsicContentSize()
      deps.containerElements.syncActionBar(parent)
      queueLayoutReconcile(parent.container, parent.parent)
      return
    }
  }
  return {
    stickyPlacements,
    MARGIN_SIDES,
    layoutView,
    setMarginStyle,
    layoutHandlers,
    setLayoutAction,
    pinLayoutChild,
    releasePlacementPins,
    rootNaturalSize,
    layoutRootChildren,
    layoutContentChild,
    queueLayoutReconcile,
    drainLayoutDirty,
  }
}
