import type { PropBag, AppKitView, ElementNode } from './model'
import {
  NSNotificationCenter,
  NSView,
  NSViewFrameDidChangeNotification,
  NSVisualEffectBlendingMode,
  NSVisualEffectMaterial,
  NSVisualEffectView,
  NativeClass,
} from '@octane-xplat/platform/macos'

import type { createRegistry } from './registry'
import type { createNativeStyle } from './native-style'
import type { createLayout } from './layout'
import type { createControls } from './controls'
import type { createRoots } from './roots'

interface Dependencies {
  registry: Pick<ReturnType<typeof createRegistry>, 'behaviorOf' | 'nodeContainersByView'>
  nativeStyle: Pick<ReturnType<typeof createNativeStyle>, 'effectiveStyle'>
  layout: Pick<
    ReturnType<typeof createLayout>,
    | 'layoutView'
    | 'layoutContentChild'
    | 'rootNaturalSize'
    | 'layoutRootChildren'
    | 'queueLayoutReconcile'
    | 'releasePlacementPins'
  >
  controls: Pick<ReturnType<typeof createControls>, 'makeLabel'>
  roots: Pick<ReturnType<typeof createRoots>, 'ownedRoots'>
}

export function createContainerElements(deps: Dependencies) {
  const gridLayoutNodesByView = new WeakMap<object, ElementNode>()

  const rootLayoutNodesByView = new WeakMap<object, ElementNode>()

  const contentViewNodesByView = new WeakMap<object, ElementNode>()

  const placeholderNodesByView = new WeakMap<object, ElementNode>()

  const placeholderContentOwners = new WeakMap<object, ElementNode>()

  // NativeScript 9.1.2/9.1.3 (MIT): LiquidGlassCommon extends GridLayout, so
  // children follow grid placement and sizing rules. iOS roots them in a
  // UIVisualEffectView content host; Android ships the plain grid. The AppKit
  // host is a plain NSView laid out like a grid, with the glass material
  // as a backdrop subview pinned behind the children. Keeping children outside
  // the NSVisualEffectView subtree preserves authored text colors — effect-view
  // descendants render vibrantly, which would silently override shared props.
  class LiquidGlassView extends NSView {
    static {
      NativeClass(this)
    }

    layout() {
      super.layout()
      const node = gridLayoutNodesByView.get(this)
      if (node) {
        deps.registry.behaviorOf('liquidglass')?.layout?.(node)
      }
    }
  }

  // NativeScript ActionBar's title slot: a title label until a view is assigned.
  // The host identity remains stable across both forms of content.
  class ActionBarHost extends NSView {
    static {
      NativeClass(this)
    }

    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    get intrinsicContentSize() {
      const node = contentViewNodesByView.get(this)
      const child = node?.projectedChildren
        ? node.projectedChildren[0]
        : (node?.contentChild ?? node?.actionBarDisplay)

      const size = child?.view?.intrinsicContentSize
      const dimension = (axis: 'width' | 'height') =>
        Math.max(
          0,
          Number(
            deps.nativeStyle.effectiveStyle(child)?.[axis] ??
              (Number(size?.[axis]) >= 0 ? size?.[axis] : child?.view?.fittingSize?.[axis]),
          ) || 0,
        )

      return { width: dimension('width'), height: Math.max(44, dimension('height')) }
    }

    layout() {
      super.layout()
      syncActionBar(contentViewNodesByView.get(this))
    }
  }

  // A single native slot, with renderer children retained separately so removing
  // a superseded child cannot clear its replacement (NativeScript ContentView).
  class ContentViewHost extends NSView {
    static {
      NativeClass(this)
    }

    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    get intrinsicContentSize() {
      const node = contentViewNodesByView.get(this)
      const child = node?.projectedChildren ? node.projectedChildren[0] : node?.contentChild
      if (!child?.view) {
        return { width: 0, height: 0 }
      }

      const intrinsic = deps.layout.layoutView(child).intrinsicContentSize
      const fitting = deps.layout.layoutView(child).fittingSize
      const size = (axis: 'width' | 'height') =>
        Math.max(
          0,
          Number(
            deps.nativeStyle.effectiveStyle(child)[axis] ??
              (Number(intrinsic?.[axis]) >= 0 ? intrinsic?.[axis] : fitting?.[axis]) ??
              0,
          ) || 0,
        )

      return { width: size('width'), height: size('height') }
    }

    layout() {
      super.layout()
      deps.layout.layoutContentChild(contentViewNodesByView.get(this))
    }
  }

  // A single consumer-supplied native slot (NativeScript Placeholder). The
  // element keeps its own host NSView — `creatingView` assigns `event.view`,
  // which is pinned to the host's edges so it occupies the whole slot.
  class PlaceholderHostView extends NSView {
    static {
      NativeClass(this)
    }

    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    get intrinsicContentSize() {
      const node = placeholderNodesByView.get(this)
      const view = node?.placeholderContent
      if (!view) {
        return { width: 0, height: 0 }
      }

      const intrinsic = view.intrinsicContentSize
      const fitting = view.fittingSize
      const size = (axis: 'width' | 'height') =>
        Math.max(
          0,
          Number((Number(intrinsic?.[axis]) >= 0 ? intrinsic?.[axis] : fitting?.[axis]) ?? 0) || 0,
        )

      return { width: size('width'), height: size('height') }
    }
  }

  // Mirrors NativeScript 9.1.2 (MIT): ui/layouts/dock-layout/index.ios.ts
  // and ViewHelper's measurement/alignment rules. Ordered strips need NSView,
  // not NSStackView's single layout axis.

  // NativeScript 9.1.2 (MIT), RootLayoutBase extends GridLayout. The shared
  // rootlayout contract exposes no rows/columns: its implicit single cell
  // overlaps all children, including nonzero attached indices clamped to it.
  // Window-owned presentation remains in presentation.ts, outside this tree.
  class RootLayoutView extends NSView {
    static {
      NativeClass(this)
    }

    // @ts-ignore ObjC accessor methods satisfy the generated @property member.
    get intrinsicContentSize() {
      return deps.layout.rootNaturalSize(rootLayoutNodesByView.get(this))
    }

    layout() {
      super.layout()
      deps.layout.layoutRootChildren(rootLayoutNodesByView.get(this))
    }
  }

  function makeRootLayout(node: ElementNode) {
    const view = RootLayoutView.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 0, height: 0 },
    })

    view.translatesAutoresizingMaskIntoConstraints = false
    rootLayoutNodesByView.set(view, node)
    view.postsFrameChangedNotifications = true
    node.rootGeometryObserver =
      NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
        NSViewFrameDidChangeNotification,
        view,
        null,
        () => {
          if (rootLayoutNodesByView.get(view) === node) {
            deps.layout.queueLayoutReconcile(node.container, node)
          }
        },
      )

    return view
  }

  // Wrapping must be allowed to shrink on its flow axis. A 750-point
  // intrinsic compression priority outranks WindowSizeStayPut (500) and forces
  // the window back to the old row/column length before any reflow can occur.

  function makeContentView() {
    const view = ContentViewHost.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 0, height: 0 },
    })

    view.translatesAutoresizingMaskIntoConstraints = false
    return view
  }

  function makeActionBar(node: ElementNode) {
    const view = ActionBarHost.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 0, height: 44 },
    })

    view.translatesAutoresizingMaskIntoConstraints = false
    node.actionBarTitle = deps.controls.makeLabel()
    node.actionBarTitleViewProp = node.props.titleView
    node.actionBarExternal = node.props.titleView ?? null
    return view
  }

  function validateActionBarTitleView(node: ElementNode, view: NSView | null | undefined) {
    if (!view) {
      return
    }

    if (view === node.view || node.view?.isDescendantOf?.(view)) {
      throw new TypeError('AppKit actionbar titleView would cycle the hierarchy')
    }

    if (
      deps.roots.ownedRoots.has(view) ||
      (deps.registry.nodeContainersByView.has(view) && view.superview !== node.view)
    ) {
      throw new TypeError('AppKit actionbar titleView is owned by another Octane host')
    }

    if (view.superview && view.superview !== node.view) {
      throw new TypeError('AppKit actionbar titleView already belongs to another host')
    }
  }

  function setActionBarTitleView(node: ElementNode, view: NSView | null | undefined) {
    validateActionBarTitleView(node, view)
    node.actionBarTitleViewProp = view
    const child = node.projectedChildren ? node.projectedChildren[0] : node.contentChild
    // Assigning the already active JSX title is a no-op in NativeScript.
    if (child && child.view === view) {
      node.actionBarExternal = null
      return
    }

    node.actionBarExternal = view ?? null
    if (node.contentChild) {
      for (const current of node.projectedChildren ?? [node.contentChild]) {
        deps.layout.releasePlacementPins(current)
        current.view?.removeFromSuperview()
      }

      node.contentChild = null
    }
  }

  function syncActionBar(node: ElementNode | undefined) {
    if (!node?.view) {
      return
    }

    const child = node.projectedChildren ? node.projectedChildren[0] : node.contentChild
    const external = node.actionBarExternal
    const view = child?.view ?? external ?? node.actionBarTitle
    if (!child) {
      validateActionBarTitleView(node, view)
    }

    const previous = node.actionBarDisplay
    if (previous?.view !== view) {
      if (previous) {
        deps.layout.releasePlacementPins(previous)
        previous.view.removeFromSuperview()
      }

      node.actionBarDisplay = null
    }

    if (view === node.actionBarTitle) {
      view.stringValue = String(node.props.title ?? '')
    }

    if (!child) {
      if (view.superview !== node.view) {
        node.view.addSubview(view)
      }

      view.translatesAutoresizingMaskIntoConstraints = false
      if (!node.actionBarDisplay) {
        const intrinsic = view.intrinsicContentSize
        const style: PropBag = {}
        for (const axis of ['width', 'height']) {
          if (Number(intrinsic?.[axis]) < 0) {
            style[axis] = Number(view.frame.size[axis]) || Number(view.fittingSize?.[axis]) || 0
          }
        }

        node.actionBarDisplay = { view, props: { style }, container: node.container }
      }

      deps.layout.layoutContentChild({
        ...node,
        contentChild: node.actionBarDisplay,
        projectedChildren: undefined,
      })
    } else {
      deps.layout.layoutContentChild(node)
    }

    node.view.wantsLayer = true
    node.view.layer.shadowOpacity = node.props.flat ? 0 : 0.2
    node.view.layer.shadowRadius = node.props.flat ? 0 : 1
  }

  function makePlaceholder(node: ElementNode) {
    const view = PlaceholderHostView.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 0, height: 0 },
    })

    view.translatesAutoresizingMaskIntoConstraints = false
    placeholderNodesByView.set(view, node)
    return view
  }

  /** NativeScript Placeholder (MIT): createNativeView raises `creatingView`
   *  once when the element attaches and the handler assigns `event.view`.
   *  Upstream the assigned view becomes the element's native view; here the
   *  host keeps its own NSView and pins the assigned view to its edges, so
   *  `event.object`, refs and `getPublicInstance` stay the element's host. */
  function fireCreatingView(node: ElementNode) {
    if (node.type !== 'placeholder' || node.placeholderCreated || !node.view) {
      return
    }

    node.placeholderCreated = true
    const handler = node.props.onCreatingView
    if (typeof handler !== 'function') {
      return
    }

    const event: { eventName: string; object: any; view?: any } = {
      eventName: 'creatingView',
      object: node.view,
    }

    node.container.root!.eventScope('discrete', () => handler(event))
    const view = event.view
    if (view == null) {
      return
    }

    if (!(view instanceof NSView)) {
      throw new TypeError(
        '[macos-host] placeholder creatingView must assign an AppKit NSView to event.view',
      )
    }

    if (view === node.view || node.view.isDescendantOf(view)) {
      throw new TypeError(
        '[macos-host] placeholder creatingView assigned a view that would cycle the hierarchy',
      )
    }

    if (placeholderContentOwners.get(view)) {
      throw new TypeError(
        '[macos-host] placeholder creatingView assigned a host already owned by another placeholder',
      )
    }

    for (const other of node.container.nodes.values()) {
      if (other !== node && (other.view === view || other.placeholderContent === view)) {
        throw new TypeError(
          '[macos-host] placeholder creatingView assigned a host already used by another element',
        )
      }
    }

    const owner = deps.registry.nodeContainersByView.get(view)
    if (owner && owner !== node.container) {
      throw new TypeError(
        '[macos-host] placeholder creatingView assigned a host owned by another Octane root',
      )
    }

    if (node.placeholderContent && node.placeholderContent !== view) {
      node.placeholderContent.removeFromSuperview()
      placeholderContentOwners.delete(node.placeholderContent)
    }

    node.placeholderContent = view
    placeholderContentOwners.set(view, node)
    deps.registry.nodeContainersByView.set(view, node.container)
    view.removeFromSuperview()
    view.translatesAutoresizingMaskIntoConstraints = false
    node.view.addSubview(view)
    const host = node.view as AppKitView
    for (const anchor of ['leading', 'trailing', 'top', 'bottom']) {
      ;(view as AppKitView)[anchor + 'Anchor'].constraintEqualToAnchor(
        host[anchor + 'Anchor'],
      ).active = true
    }

    node.view.invalidateIntrinsicContentSize()
    deps.layout.queueLayoutReconcile(node.container, node.layoutParent ?? node.parent)
  }

  function observeContentGeometry(node: ElementNode) {
    const view = node.view!
    view.postsFrameChangedNotifications = true
    // Auto Layout can resize an NSView after its layout() callback. Observe
    // the resulting frame, so right/bottom alignment and stretch use the
    // new bounds even when AppKit does not schedule another layout pass.
    node.contentGeometryObserver =
      NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
        NSViewFrameDidChangeNotification,
        view,
        null,
        () => {
          if (contentViewNodesByView.get(view) === node) {
            deps.layout.queueLayoutReconcile(node.container, node)
          }
        },
      )
  }

  function makeLiquidGlass(node: ElementNode) {
    const view = LiquidGlassView.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 140, height: 28 },
    })

    view.translatesAutoresizingMaskIntoConstraints = false
    // Grid placement is resolved in layout() from current bounds, so a frame
    // change must queue the same reconcile the other manual hosts perform.
    view.postsFrameChangedNotifications = true
    node.glassGeometryObserver =
      NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
        NSViewFrameDidChangeNotification,
        view,
        null,
        () => {
          if (gridLayoutNodesByView.get(view) === node) {
            deps.layout.queueLayoutReconcile(node.container, node)
          }
        },
      )

    const backdrop = NSVisualEffectView.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 140, height: 28 },
    })

    // UnderWindowBackground is the platform glass material — the reliable,
    // appearance-following analog of iOS's clear glass. Within-window blending
    // needs content behind the view inside the same window and would render no
    // effect in the common empty-window case.
    backdrop.material = NSVisualEffectMaterial.UnderWindowBackground
    backdrop.blendingMode = NSVisualEffectBlendingMode.Behind
    backdrop.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(backdrop)
    backdrop.leadingAnchor.constraintEqualToAnchor(view.leadingAnchor).active = true
    backdrop.trailingAnchor.constraintEqualToAnchor(view.trailingAnchor).active = true
    backdrop.topAnchor.constraintEqualToAnchor(view.topAnchor).active = true
    backdrop.bottomAnchor.constraintEqualToAnchor(view.bottomAnchor).active = true
    node.glassBackdrop = backdrop
    return view
  }
  return {
    gridLayoutNodesByView,
    rootLayoutNodesByView,
    contentViewNodesByView,
    placeholderNodesByView,
    placeholderContentOwners,
    makeRootLayout,
    makeContentView,
    makeActionBar,
    setActionBarTitleView,
    syncActionBar,
    makePlaceholder,
    fireCreatingView,
    observeContentGeometry,
    makeLiquidGlass,
  }
}
