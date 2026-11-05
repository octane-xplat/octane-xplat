import { withLayoutBatch } from './layout-batch.ts'
import { parseEdgeInsets, normalizeClass, effectiveStyle, shallowEqualStyle } from './style-values.ts'
import type { CssAnimations } from './css-animations'
import type { HostBridge } from './host-bridge'
import type { Layout } from './layout'
import type { RootDirectoryReader } from './root-directory'
import type { NativeStyle } from './native-style'
import type { Controls } from './controls'
import type { TextElements } from './text-elements'
import type { InputElements } from './input-elements'
import type { ElementNode, RootContainer } from './model'
import { notifyLayoutCommit } from './layout-observers'
import { NSWorkspace } from '@octane-xplat/platform/macos'
import {
  computeCascade,
  INHERITED_CSS_PROPERTIES,
  stylesheetPseudoClasses,
  stylesheetScope,
} from '@octane-xplat/css-engine'
import type { CssHostNode } from '@octane-xplat/css-engine'

interface Dependencies {
  cssAnimations: Pick<CssAnimations, 'sameAnimations' | 'playKeyframeAnimations' | 'cancelKeyframeAnimations'>
  hostBridge: Pick<HostBridge, 'appKitBridge'>
  layout: Pick<Layout, 'drainLayoutDirty'>
  directory: Pick<RootDirectoryReader, 'containers'>
  nativeStyle: Pick<NativeStyle, 'applyStyle'>
  controls: Pick<Controls, 'syncActivityIndicator'>
  textElements: Pick<TextElements, 'syncHtmlView' | 'syncText'>
  inputElements: Pick<InputElements, 'fitTextView'>
}

export type CssCascade = ReturnType<typeof createCssCascade>

export function createCssCascade(deps: Dependencies) {
  // ---- CSS cascade ------------------------------------------------------------

  // The vendored NS selector engine matches against `node` directly: cssType is
  // the element type lowercased (NS `cssType` semantics — `stack-layout` ->
  // `stacklayout` happens on the selector side via TypeSelector name mangling),
  // cssClasses come from the className prop, cssPseudoClasses from wired state.

  /** CSS-visible element children — #text/span/format wrappers fold into text. */
  function cssChildren(node: ElementNode): ElementNode[] {
    return node.children.filter(
      (child) => child.view != null || child.type === 'proxyviewcontainer',
    )
  }

  /** Root container top-level nodes (incl. portal/list-cell/sheet roots) carry
   *  the NS ambient classes: ns-root, ns-macos, ns-light|ns-dark. */
  function isCssRootNode(node: ElementNode): boolean {
    return node.parent === null
  }

  function cssSchemeName(_node: ElementNode): string {
    return (deps.hostBridge.appKitBridge as any).getColorScheme?.() === 'dark' ? 'dark' : 'light'
  }

  // Per-container dirty sets — flushed top-down before the layout reconcile pass
  // inside a batch, or coalesced onto one microtask outside a batch.
  function markStyleDirty(node: ElementNode, subtree = false, matchChanged = true) {
    const container = node.container
    if (!container || node.lifecycle === 'disposing' || node.lifecycle === 'disposed') {
      return
    }
    ;(container.cssDirty ??= new Set()).add(node)
    if (matchChanged) {
      node.cssMatchDirty = true
    }
    if (subtree) {
      for (const child of cssChildren(node)) {
        markStyleDirty(child, true, false)
      }
    }
    if (container.layoutDirty == null && !container.cssFlushQueued) {
      // Outside a command batch (appearance change, registerStylesheet) —
      // one microtask flush per container; a batch starting first wins.
      container.cssFlushQueued = true
      queueMicrotask(() => {
        container.cssFlushQueued = false
        if (container.layoutDirty == null) {
          flushStyleDirty(container)
        }
      })
    }
  }

  function flushStyleDirty(container: RootContainer) {
    const dirty = container.cssDirty
    container.cssDirty = undefined
    if (!dirty?.size) {
      return
    }

    // Style applies queue layout work. Inside a command batch the batch drains
    // it; outside one, open a layout batch so each apply doesn't reconcile
    // its parent synchronously.
    withLayoutBatch(container, () => {
      // Top-down: parents must compute before children that inherit from them.
      const nodes = [...dirty].sort((a, b) => cssDepth(a) - cssDepth(b))
      for (const node of nodes) {
        // Dead nodes (destroyed/detached before the flush) skip the restyle.
        if (
          node.container.nodes &&
          !node.container.nodes.has(node.id) &&
          node.type !== 'portalroot'
        ) {
          continue
        }

        restyleNode(node)
      }
    }, (layoutDirty, outcome) => {
      if (outcome === 'failed') {
        return
      }
      deps.layout.drainLayoutDirty(layoutDirty)
      notifyLayoutCommit(container.hostView)
    })
  }

  function cssDepth(node: ElementNode): number {
    let depth = 0
    for (let p = node.parent; p; p = p.parent) {
      depth++
    }
    return depth
  }

  // ---- Per-window media environment -------------------------------------------
  // Media queries resolve against the window a node actually paints into:
  // portal roots carry their target view's window, everything else follows its
  // container's host view. `activeMediaNode` is set for the duration of each
  // cascade (restyleNode) so the injected environment fn stays stateless.

  let activeMediaNode: ElementNode | null = null

  function nodeHostWindow(node: ElementNode): any | null {
    let root: ElementNode = node
    while (root.parent) {
      root = root.parent
    }
    if (root.cssType === 'portalroot' && root.view?.window) {
      return root.view.window
    }
    return node.container?.hostView?.window ?? null
  }

  function mediaSharedEnv(): { colorScheme: 'light' | 'dark'; reducedMotion: boolean } {
    return {
      colorScheme:
        (deps.hostBridge.appKitBridge as any).getColorScheme?.() === 'dark' ? 'dark' : 'light',
      reducedMotion: NSWorkspace.sharedWorkspace?.accessibilityDisplayShouldReduceMotion === true,
    }
  }

  function windowMediaSize(win: any, fallbackRect: any): { width: number; height: number } {
    const rect: any = win?.contentLayoutRect ?? fallbackRect
    return {
      width: Number(rect?.size?.width ?? rect?.width ?? 0) || 0,
      height: Number(rect?.size?.height ?? rect?.height ?? 0) || 0,
    }
  }

  function largestWindowSize(): { width: number; height: number } {
    let width = 0
    let height = 0
    for (const container of deps.directory.containers()) {
      const size = windowMediaSize(container.hostView?.window, container.hostView?.frame)
      if (size.width > width || size.height > height) {
        width = size.width
        height = size.height
      }
    }
    return { width, height }
  }

  function envForNode(node: ElementNode) {
    const size = windowMediaSize(nodeHostWindow(node), node.container?.hostView?.frame)
    const { width, height } = size.width || size.height ? size : largestWindowSize()
    return { width, height, ...mediaSharedEnv() }
  }

  /** Recompute one node's effective style and apply it. Caller guarantees the
   *  parent is already styled (top-down flush order). */
  function restyleNode(node: ElementNode) {
    refreshCssClasses(node)
    const prevMediaNode = activeMediaNode
    activeMediaNode = node
    let cascade: ReturnType<typeof computeCascade>
    try {
      cascade = computeCascade(node as unknown as CssHostNode, stylesheetScope(), {
        borderLonghands: true,
      })
    } finally {
      activeMediaNode = prevMediaNode
    }
    const { style, customProps, cssKeys, inheritedKeys, animations } = cascade
    node.cssOriginKeys = cssKeys
    node.inheritedOnlyKeys = inheritedKeys
    const prevStyle = node.computedStyle ?? {}
    const prevCustom = node.computedCustomProps ?? new Map()
    node.computedStyle = style
    node.computedCustomProps = customProps

    const customChanged =
      prevCustom.size !== customProps.size ||
      [...customProps].some(([k, v]) => prevCustom.get(k) !== v)
    let inheritedChanged = false
    for (const prop of INHERITED_CSS_PROPERTIES) {
      const camel = prop.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase())
      if (prevStyle[camel] !== style[camel]) {
        inheritedChanged = true
        break
      }
    }

    // NS updateDynamicState: stop the node's keyframe animations (dropping
    // the keyframe layer), apply the new values, then play what now matches.
    const playable = (animations ?? []).filter((info) => info.keyframes?.length)
    const replay =
      node.cssMatchDirty === true ||
      !deps.cssAnimations.sameAnimations(node.cssAnimation?.infos ?? [], playable)
    node.cssMatchDirty = false
    const droppedOverlay = replay && deps.cssAnimations.cancelKeyframeAnimations(node)

    // Unchanged effective styles skip the native apply: most restyles (class or
    // sibling marks, ancestor cascades) resolve to the same bag.
    if (droppedOverlay || !shallowEqualStyle(prevStyle, style) || !node.appliedStyle) {
      deps.nativeStyle.applyStyle(node, style)
      syncInputChrome(node)
      // Stopped spinners hold alphaValue=0 so they keep their layout slot;
      // re-assert it after an opacity apply/reset overwrote alphaValue.
      if (node.type === 'activityindicator') {
        deps.controls.syncActivityIndicator(node)
      }

      // Text attributes (font, line height) bake into the attributed string,
      // which applyProps built before this restyle resolved the font.
      if (node.type === 'htmlview') {
        deps.textElements.syncHtmlView(node)
      } else {
        deps.textElements.syncText(node)
      }
    }

    // Only cascade to children when values they could inherit moved.
    if (replay && playable.length > 0) {
      deps.cssAnimations.playKeyframeAnimations(node, playable)
    }
    if (customChanged || inheritedChanged) {
      for (const child of cssChildren(node)) {
        restyleNode(child)
      }
    }
  }

  let cssWarnedProps = new Set<string>()

  function warnUnsupportedCssProp(node: ElementNode, name: string) {
    if (cssWarnedProps.has(name)) {
      return
    }
    cssWarnedProps.add(name)
    console.warn('[macos-css] ignored unsupported property ' + name + ' (on <' + node.type + '>)')
  }

  function setNodeInlineStyle(node: ElementNode, value: any) {
    const prev = node.cascadeInline
    node.props.style = value
    node.cascadeInline = value
    // Subtree restyle only when an inherited or custom-property input changed.
    const inheritedOrCustom = (bag: any): boolean =>
      !!bag &&
      Object.keys(bag).some(
        (k) =>
          k.startsWith('--') ||
          INHERITED_CSS_PROPERTIES.has(k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())),
      )
    const subtree = Boolean(inheritedOrCustom(prev)) || Boolean(inheritedOrCustom(value))
    markStyleDirty(node, subtree)
  }

  function applyClassName(node: ElementNode, value: any) {
    node.cssBaseClasses = new Set(
      normalizeClass(value).split(/\s+/).filter(Boolean),
    )
    refreshCssClasses(node)
    markStyleDirty(node, true)
  }

  /** cssClasses = className tokens ∪ ambient root classes (ns-root, ns-macos,
   *  ns-light|ns-dark) on every parent-less node — including owned roots from
   *  createMacOSRoot (list cells, sheets, windows) and portal content, whose
   *  chain reaches the portalroot node. Recomputed on insert/remove/appearance
   *  via markStyleDirty → restyleNode → refreshCssClasses. */
  function refreshCssClasses(node: ElementNode) {
    const set = new Set(node.cssBaseClasses ?? [])
    if (isCssRootNode(node)) {
      set.add('ns-root')
      set.add('ns-macos')
      set.add(cssSchemeName(node) === 'dark' ? 'ns-dark' : 'ns-light')
    }
    node.cssClasses = set
  }

  function setNodeId(node: ElementNode, value: any) {
    node.cssId = value == null ? undefined : String(value)
    markStyleDirty(node, true)
  }

  function setPseudoClass(node: ElementNode, name: string, on: boolean) {
    const had = node.cssPseudoClasses.has(name)
    if (on === had) {
      return
    }
    if (on) {
      node.cssPseudoClasses.add(name)
    } else {
      node.cssPseudoClasses.delete(name)
    }
    // Only pseudo-classes some registered selector actually uses can
    // restyle — an unused state change must not flush a subtree.
    if (stylesheetPseudoClasses().has(name)) {
      markStyleDirty(node, true)
    }
  }

  // Pseudo-classes that count as "another visual state" for :normal — NS's
  // visual states only (view-common.js): highlighted/active/pressed, focus,
  // checked, disabled. The desktop extras (hover, focus-visible, focus-within)
  // do NOT cancel :normal.
  const NORMAL_OFF = new Set(['highlighted', 'active', 'pressed', 'focus', 'checked', 'disabled'])

  function syncNormalState(node: ElementNode) {
    setPseudoClass(node, 'normal', ![...NORMAL_OFF].some((name) => node.cssPseudoClasses.has(name)))
  }

  // textfield/textview drop native chrome when the effective style overrides
  // background/border (the old vx-input class behavior, now CSS-driven).
  function syncInputChrome(node: ElementNode) {
    if (node.type !== 'textfield' && node.type !== 'textview') {
      return
    }
    const view = node.view
    if (!view) {
      return
    }
    // CSS paints the layer; it must not change the control's native bezel or
    // background configuration. Shared controls reset those at construction.
    if (node.type === 'textview') {
      const style = effectiveStyle(node)
      const inset = parseEdgeInsets(style.padding ?? 0)
      view.textContainerInset = {
        width: Number(style.paddingLeft ?? inset.left) || 0,
        height: Number(style.paddingTop ?? inset.top) || 0,
      }

      if (node.placeholderLeading) {
        node.placeholderLeading.constant = view.textContainerInset.width
      }

      if (node.placeholderTop) {
        node.placeholderTop.constant = view.textContainerInset.height
      }

      if (node.placeholderHeight && Number(style.lineHeight) > 0) {
        node.placeholderHeight.constant = Number(style.lineHeight)
      }

      deps.inputElements.fitTextView(node)
    } else {
      view.invalidateIntrinsicContentSize?.()
    }
  }
  return {
    cssChildren,
    cssSchemeName,
    markStyleDirty,
    flushStyleDirty,
    get activeMediaNode() {
      return activeMediaNode
    },
    set activeMediaNode(value: typeof activeMediaNode) {
      activeMediaNode = value
    },
    mediaSharedEnv,
    windowMediaSize,
    largestWindowSize,
    envForNode,
    warnUnsupportedCssProp,
    setNodeInlineStyle,
    applyClassName,
    setNodeId,
    setPseudoClass,
    syncNormalState,
  }
}
