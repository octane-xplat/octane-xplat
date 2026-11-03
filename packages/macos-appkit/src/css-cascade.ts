import type { PropBag, ElementNode, RootContainer } from './model'
import { notifyLayoutCommit } from './layout-observers'
import { NSWorkspace } from '@octane-xplat/platform/macos'
import {
  computeCascade,
  INHERITED_CSS_PROPERTIES,
  type CssHostNode,
  resolveTranslate,
  sampleKeyframeAnimation,
  type KeyframeAnimationInfo,
  type SampledValues,
  stylesheetPseudoClasses,
  stylesheetScope,
  transformToParts,
} from '@octane-xplat/css-engine'

import type { createHostBridge } from './host-bridge'
import type { createLayout } from './layout'
import type { createRoots } from './roots'
import type { createNativeStyle } from './native-style'
import type { createControls } from './controls'
import type { createTextElements } from './text-elements'
import type { createInputElements } from './input-elements'

export // ---- Keyframe animations ----------------------------------------------------
// NS CssState.playKeyframeAnimations over the shared sampler — the GTK
// renderer's model: every matched `animation` plays from its rule's start on
// each selector re-match, later animations override earlier ones per
// property, and the overlay sits above the computed style. One shared ~60 Hz
// timer drives every playing node; Core Animation groups are not used — they
// do not complete through the bridge (.agents/docs/notes/routing-transitions.md).

interface CssAnimationPlayback {
  infos: KeyframeAnimationInfo[]
  startMs: number
  base: Partial<SampledValues>
}

interface Dependencies {
  hostBridge: Pick<ReturnType<typeof createHostBridge>, 'appKitBridge'>
  layout: Pick<ReturnType<typeof createLayout>, 'drainLayoutDirty'>
  roots: Pick<ReturnType<typeof createRoots>, 'appKitContainers'>
  nativeStyle: Pick<
    ReturnType<typeof createNativeStyle>,
    'applyStyle' | 'normalizeClass' | 'effectiveStyle' | 'parseEdgeInsets'
  >
  controls: Pick<ReturnType<typeof createControls>, 'syncActivityIndicator'>
  textElements: Pick<ReturnType<typeof createTextElements>, 'syncHtmlView' | 'syncText'>
  inputElements: Pick<ReturnType<typeof createInputElements>, 'fitTextView'>
}

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

  function cssParentOf(node: ElementNode): ElementNode | null {
    let parent = node.parent
    while (parent && parent.view == null && parent.type !== 'proxyviewcontainer') {
      parent = parent.parent
    }
    return parent
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
    if (!container) {
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
    const ownsLayoutBatch = container.layoutDirty == null
    if (ownsLayoutBatch) {
      container.layoutDirty = new Set()
    }

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

    if (ownsLayoutBatch) {
      const layoutDirty = container.layoutDirty!
      container.layoutDirty = null
      deps.layout.drainLayoutDirty(layoutDirty)
      notifyLayoutCommit(container.hostView)
    }
  }

  function cssDepth(node: ElementNode): number {
    let depth = 0
    for (let p = node.parent; p; p = p.parent) {
      depth++
    }
    return depth
  }

  function shallowEqualStyle(a: PropBag, b: PropBag) {
    const keys = Object.keys(a)
    return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key])
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
    for (const container of deps.roots.appKitContainers) {
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
      node.cssMatchDirty === true || !sameAnimations(node.cssAnimation?.infos ?? [], playable)
    node.cssMatchDirty = false
    const droppedOverlay = replay && cancelKeyframeAnimations(node)

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
      playKeyframeAnimations(node, playable)
    }
    if (customChanged || inheritedChanged) {
      for (const child of cssChildren(node)) {
        restyleNode(child)
      }
    }
  }

  const ANIMATION_FRAME_MS = 16

  /** Nodes holding a playback (playing or forwards-filled). */
  const animatedNodes = new Set<ElementNode>()

  const playingNodes = new Set<ElementNode>()

  let animationTimer: ReturnType<typeof setTimeout> | null = null

  /** Values a property animates from when no earlier keyframe declares it —
   *  the node's current (pre-animation) computed value. */
  function animationBase(node: ElementNode): Partial<SampledValues> {
    const style = node.computedStyle ?? {}
    const frame = node.view?.frame?.size
    const opacity = Number(style.opacity ?? node.props.opacity)
    const parts =
      typeof style.transform === 'string' ? transformToParts(style.transform) : undefined
    return {
      opacity: Number.isFinite(opacity) ? opacity : 1,
      backgroundColor:
        typeof style.backgroundColor === 'string' ? style.backgroundColor : 'rgba(0,0,0,0)',
      translateX: parts?.translateX ?? style.translateX ?? 0,
      translateY: parts?.translateY ?? style.translateY ?? 0,
      scaleX: parts?.scaleX ?? 1,
      scaleY: parts?.scaleY ?? 1,
      rotate: parts?.rotate ?? 0,
      rotateX: parts?.rotateX ?? 0,
      rotateY: parts?.rotateY ?? 0,
      width: typeof style.width === 'number' ? style.width : Number(frame?.width ?? 0),
      height: typeof style.height === 'number' ? style.height : Number(frame?.height ?? 0),
    }
  }

  function sameAnimations(a: KeyframeAnimationInfo[], b: KeyframeAnimationInfo[]): boolean {
    return a.length === b.length && a.every((info, i) => info === b[i])
  }

  function playKeyframeAnimations(node: ElementNode, infos: KeyframeAnimationInfo[]) {
    if (!node.view) {
      return
    }
    node.cssAnimation = { infos, startMs: Date.now(), base: animationBase(node) }
    animatedNodes.add(node)
    // Segment 0 lands synchronously, like NS `animate(view, 0)` at play.
    if (advanceKeyframeAnimation(node, node.cssAnimation.startMs)) {
      playingNodes.add(node)
      animationTimer ??= setTimeout(tickKeyframeAnimations, ANIMATION_FRAME_MS)
    }
  }

  function tickKeyframeAnimations() {
    const now = Date.now()
    for (const node of playingNodes) {
      if (!advanceKeyframeAnimation(node, now)) {
        playingNodes.delete(node)
      }
    }
    animationTimer = playingNodes.size
      ? setTimeout(tickKeyframeAnimations, ANIMATION_FRAME_MS)
      : null
  }

  /** Writes one frame; false once every animation on the node has finished. */
  function advanceKeyframeAnimation(node: ElementNode, now: number): boolean {
    const play = node.cssAnimation
    const view = node.view
    if (!play || !view) {
      return false
    }
    const size = view.frame?.size ?? {}
    const box = { width: Number(size.width) || 0, height: Number(size.height) || 0 }
    const overlay: PropBag = {}
    let done = true
    for (const info of play.infos) {
      const sample = sampleKeyframeAnimation(info, now - play.startMs, { base: play.base, box })
      Object.assign(overlay, sample.values)
      done &&= sample.done
    }
    // % translates arrive as TranslateAxis objects — resolve to points.
    for (const key of ['translateX', 'translateY'] as const) {
      const value = overlay[key]
      if (value !== null && typeof value === 'object') {
        overlay[key] = resolveTranslate(value, key === 'translateX' ? box.width : box.height)
      }
    }
    const prev = node.animatedStyle
    node.animatedStyle = Object.keys(overlay).length > 0 ? overlay : undefined
    if (prev !== undefined || node.animatedStyle !== undefined) {
      applyAnimationFrame(node)
    }
    return !done
  }

  /** Per-frame write through the full style apply — the overlay merges above
   *  the computed style inside applyStyle; a no-op frame skips the write. */
  function applyAnimationFrame(node: ElementNode) {
    const merged = node.animatedStyle
      ? { ...node.computedStyle, ...node.animatedStyle }
      : (node.computedStyle ?? {})
    if (node.appliedStyle && shallowEqualStyle(node.appliedStyle, merged)) {
      return
    }
    deps.nativeStyle.applyStyle(node, node.computedStyle ?? {})
  }

  /** Stops the node's animations and drops the keyframe layer without
   *  re-applying; returns true when an overlay was showing. */
  function cancelKeyframeAnimations(node: ElementNode): boolean {
    if (node.cssAnimation === undefined) {
      return false
    }
    node.cssAnimation = undefined
    animatedNodes.delete(node)
    playingNodes.delete(node)
    const hadOverlay = node.animatedStyle !== undefined
    node.animatedStyle = undefined
    return hadOverlay
  }

  /** NS onUnloaded: removal from the tree stops the subtree's animations and
   *  restores the underlying style. */
  function stopSubtreeAnimations(node: ElementNode) {
    if (animatedNodes.size === 0) {
      return
    }
    if (cancelKeyframeAnimations(node) && node.view) {
      deps.nativeStyle.applyStyle(node, node.computedStyle ?? {})
    }
    for (const child of node.children) {
      stopSubtreeAnimations(child)
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
      deps.nativeStyle.normalizeClass(value).split(/\s+/).filter(Boolean),
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
      const style = deps.nativeStyle.effectiveStyle(node)
      const inset = deps.nativeStyle.parseEdgeInsets(style.padding ?? 0)
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
    cancelKeyframeAnimations,
    stopSubtreeAnimations,
    warnUnsupportedCssProp,
    setNodeInlineStyle,
    applyClassName,
    setNodeId,
    setPseudoClass,
    syncNormalState,
  }
}
