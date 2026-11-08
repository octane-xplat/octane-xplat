import { shallowEqualStyle } from './style-values.ts'
import type { ElementNode, PropBag } from './model'
import type { NativeStyle } from './native-style'
import {
  sampleKeyframeAnimation,
  resolveTranslate,
  transformToParts,
  type KeyframeAnimationInfo,
  type SampledValues,
} from '@octane-xplat/css-engine'

// ---- Keyframe animations ----------------------------------------------------
// NS CssState.playKeyframeAnimations over the shared sampler — the GTK
// renderer's model: every matched `animation` plays from its rule's start on
// each selector re-match, later animations override earlier ones per
// property, and the overlay sits above the computed style. One shared ~60 Hz
// timer drives every playing node; Core Animation groups are not used — they
// do not complete through the bridge (.agents/docs/notes/routing-transitions.md).

export interface CssAnimationPlayback {
  infos: KeyframeAnimationInfo[]
  startMs: number
  base: Partial<SampledValues>
}

interface Dependencies {
  nativeStyle: Pick<NativeStyle, 'applyStyle'>
}

export type CssAnimations = ReturnType<typeof createCssAnimations>

export function createCssAnimations(deps: Dependencies) {
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

  return { sameAnimations, playKeyframeAnimations, cancelKeyframeAnimations, stopSubtreeAnimations }
}
