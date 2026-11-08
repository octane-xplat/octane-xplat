import { effectiveStyle } from './style-values.ts'
import {
  NSNotificationCenter,
  NSViewFrameDidChangeNotification,
} from '@octane-xplat/platform/macos'

import type { ElementNode, PropBag } from './model'
import type { BoxPaintState, BoxFrameLease } from './box-paint-state'
import { createBorderPaint } from './border-paint'
import { createShadowPaint } from './shadow-paint'
import { createBackgroundPaint } from './background-paint'
import { createTransformPaint } from './transform-paint'
import { createOutlines } from './outlines'
import { FailureCollector } from './failures.ts'

export type BoxPaint = ReturnType<typeof createBoxPaint>

export function createBoxPaint() {
  const border = createBorderPaint()
  const shadow = createShadowPaint()
  const background = createBackgroundPaint()
  const transform = createTransformPaint()
  const outlines = createOutlines()
  const boxPaintStates = new WeakMap<ElementNode, BoxPaintState>()
  const retiringPaint = new WeakSet<ElementNode>()
  const OUTLINE_PROPS = new Set([
    'outline',
    'outlineWidth',
    'outlineStyle',
    'outlineColor',
    'outlineOffset',
  ])

  function isPaintStyle(name: string): boolean {
    return (
      Object.hasOwn(border.BORDER_RADIUS_KEYS, name) ||
      Object.hasOwn(border.BORDER_WIDTH_KEYS, name) ||
      Object.hasOwn(border.BORDER_COLOR_KEYS, name) ||
      Object.hasOwn(border.BORDER_EDGE_KEYS, name) ||
      border.BORDER_STYLE_KEYS.has(name) ||
      transform.TRANSFORM_KEYS.has(name) ||
      background.BACKGROUND_STYLE_KEYS.has(name) ||
      OUTLINE_PROPS.has(name) ||
      name === 'boxShadow'
    )
  }

  function livePaintNode(node: ElementNode): boolean {
    return (
      node.lifecycle !== 'disposing' && node.lifecycle !== 'disposed' && !retiringPaint.has(node)
    )
  }

  function removeBoxFrameToken(owner: BoxFrameLease, token: NonNullable<BoxFrameLease['token']>) {
    try {
      owner.remove?.call(owner.center, token)
    } catch {
      try {
        console.warn('[macos-css] Box frame cleanup failed')
      } catch {}
    }
  }

  function clearBoxFrameObserver(state: BoxPaintState) {
    const owner = state.frame

    state.frame = undefined
    if (!owner?.active) {
      return
    }

    owner.active = false

    const timer = owner.timer

    owner.timer = undefined
    if (timer !== undefined) {
      clearTimeout(timer)
    }

    const token = owner.token

    owner.token = null
    if (token != null) {
      removeBoxFrameToken(owner, token)
    }
  }

  function observeBoxFrame(node: ElementNode, state: BoxPaintState) {
    const view = state.view
    const owner: BoxFrameLease = { view, active: true, ready: false }

    clearBoxFrameObserver(state)
    state.frame = owner

    const current = () => state.current() && owner.active && state.frame === owner

    try {
      owner.center = NSNotificationCenter.defaultCenter
      owner.remove = owner.center.removeObserver

      const add = owner.center.addObserverForNameObjectQueueUsingBlock

      if (typeof add !== 'function' || typeof owner.remove !== 'function') {
        throw new Error('Box frame observation unavailable')
      }

      if (!current()) {
        clearBoxFrameObserver(state)
        return
      }

      view.postsFrameChangedNotifications = true
      if (!current()) {
        clearBoxFrameObserver(state)
        return
      }

      const token = add.call(owner.center, NSViewFrameDidChangeNotification, view, null, () => {
        if (
          !owner.active ||
          !owner.ready ||
          !state.active ||
          !livePaintNode(node) ||
          state.syncing
        ) {
          return
        }

        if (!current()) {
          clearBoxFrameObserver(state)
          return
        }

        try {
          syncGeometry(node)
        } catch {
          try {
            console.warn('[macos-css] Box geometry update failed')
          } catch {}
        }

        // AppKit can finish synchronizing a backing layer after its frame
        // notification returns, overwriting the synchronous transform. Repaint
        // once on the next event turn under the same lease. Microtasks can
        // drain inside the bridge callback, before AppKit completes its write.
        if (owner.timer === undefined && current()) {
          owner.timer = setTimeout(() => {
            owner.timer = undefined
            if (!current() || !owner.ready) {
              return
            }

            try {
              syncGeometry(node)
            } catch {
              try {
                console.warn('[macos-css] Box geometry update failed')
              } catch {}
            }
          }, 0)
        }
      })

      if (!current()) {
        if (token != null) {
          removeBoxFrameToken(owner, token)
        }

        clearBoxFrameObserver(state)
        return
      }

      if (token == null) {
        throw new Error('Box frame observation unavailable')
      }

      owner.token = token
      owner.ready = true
    } catch {
      clearBoxFrameObserver(state)
      try {
        console.warn('[macos-css] Box frame observation unavailable')
      } catch {}
    }
  }

  function syncFrameLease(node: ElementNode, state: BoxPaintState) {
    if (!state.current()) {
      return
    }

    const needed =
      state.borderNeedsFrame ||
      (state.boxShadowSpec?.length ?? 0) > 0 ||
      state.bgHost != null ||
      state.transformApplied ||
      transform.hasPercentTranslate(node, state) ||
      state.outlineLayer != null

    if (needed && !state.frame) {
      observeBoxFrame(node, state)
    } else if (!needed) {
      clearBoxFrameObserver(state)
    }
  }

  function acquirePaint(node: ElementNode): BoxPaintState | undefined {
    if (!node.view || !livePaintNode(node)) {
      return
    }

    const previous = boxPaintStates.get(node)

    if (previous?.view === node.view && previous.active) {
      return previous
    }

    if (previous) {
      dispose(node)
    }

    const view = node.view

    if (!view || !livePaintNode(node)) {
      return
    }

    const state: BoxPaintState = {
      view,
      active: true,
      current: () =>
        state.active &&
        livePaintNode(node) &&
        boxPaintStates.get(node) === state &&
        node.view === view,
    }

    boxPaintStates.set(node, state)
    view.wantsLayer = true
    if (!state.current()) {
      disposePaintState(node, state)
      return
    }

    const layer = view.layer

    if (layer) {
      state.baseline = {
        layer,
        mask: layer.mask,
        masksToBounds: layer.masksToBounds,
        cornerRadius: layer.cornerRadius,
        borderWidth: layer.borderWidth,
        borderColor: layer.borderColor,
        transform: layer.transform,
        shadowOpacity: layer.shadowOpacity,
        shadowPath: layer.shadowPath,
        shadowColor: layer.shadowColor,
        shadowOffset: layer.shadowOffset,
        shadowRadius: layer.shadowRadius,
      }
    }

    return state
  }

  function syncGeometry(node: ElementNode) {
    const state = boxPaintStates.get(node)

    if (state && state.view !== node.view && livePaintNode(node)) {
      applyBoxStyle(
        node,
        {},
        node.appliedStyle ?? { ...effectiveStyle(node), ...node.animatedStyle },
      )

      return
    }

    if (!state || !state.current() || state.syncing) {
      return
    }

    state.syncing = true
    try {
      border.syncBorderBox(node, state)
      if (!state.current()) {
        return
      }

      shadow.syncBoxShadow(node, state)
      if (!state.current()) {
        return
      }

      transform.syncTransform(node, state)
      if (!state.current()) {
        return
      }

      // Shadow paths are written before authored transforms. Align their
      // sibling hosts only after that transform has reached the backing layer.
      shadow.syncOutsetGeometry(node, state)
      if (!state.current()) {
        return
      }

      background.paintBackgrounds(node, state)
      if (!state.current()) {
        return
      }

      // Outlines use bounds and include origin-only frame deliveries. They do
      // not observe bounds notifications; preserve that narrower contract.
      outlines.syncOutlineGeometry(node, state)
      syncFrameLease(node, state)
    } finally {
      state.syncing = false
    }
  }

  function applyBoxStyle(node: ElementNode, previous: PropBag, next: PropBag) {
    if (!livePaintNode(node) || !node.view) {
      return
    }

    if (!boxPaintStates.has(node) && !Object.keys(next).some(isPaintStyle)) {
      return
    }

    const state = acquirePaint(node)

    if (!state?.current()) {
      return
    }

    for (const name of Object.keys(previous)) {
      if (previous[name] == null || next[name] != null) {
        continue
      }

      if (Object.hasOwn(border.BORDER_RADIUS_KEYS, name)) {
        border.clearBorderSlot(node, state, 'radii', border.BORDER_RADIUS_KEYS[name])
      } else if (Object.hasOwn(border.BORDER_WIDTH_KEYS, name)) {
        border.clearBorderSlot(node, state, 'widths', border.BORDER_WIDTH_KEYS[name])
      } else if (Object.hasOwn(border.BORDER_COLOR_KEYS, name)) {
        border.clearBorderSlot(node, state, 'colors', border.BORDER_COLOR_KEYS[name])
      } else if (Object.hasOwn(border.BORDER_EDGE_KEYS, name)) {
        border.clearBorderEdge(node, state, border.BORDER_EDGE_KEYS[name])
      } else if (name === 'boxShadow') {
        state.boxShadowSpec = undefined
      } else if (transform.TRANSFORM_KEYS.has(name)) {
        delete state.transformSpec?.[transform.TRANSFORM_SLOT[name] ?? name]
      }
    }

    for (const [name, value] of Object.entries(next)) {
      if (value == null) {
        continue
      }

      if (Object.hasOwn(border.BORDER_RADIUS_KEYS, name)) {
        border.setBorderSlot(node, state, 'radii', border.BORDER_RADIUS_KEYS[name], value)
      } else if (Object.hasOwn(border.BORDER_WIDTH_KEYS, name)) {
        border.setBorderSlot(node, state, 'widths', border.BORDER_WIDTH_KEYS[name], value)
      } else if (Object.hasOwn(border.BORDER_COLOR_KEYS, name)) {
        border.setBorderSlot(node, state, 'colors', border.BORDER_COLOR_KEYS[name], value)
      } else if (Object.hasOwn(border.BORDER_EDGE_KEYS, name)) {
        border.setBorderEdge(node, state, border.BORDER_EDGE_KEYS[name], value)
      } else if (name === 'boxShadow') {
        state.boxShadowSpec = shadow.parseBoxShadow(value)
      } else if (transform.TRANSFORM_KEYS.has(name)) {
        const spec = (state.transformSpec ??= {})

        spec[transform.TRANSFORM_SLOT[name] ?? name] =
          name === 'translateX' || name === 'translateY'
            ? transform.translateAxisValue(value)
            : value
      }
    }

    // Reconcile image resources before geometry so border/shadow insertion
    // sees the background host. All frame consumers then share one lease.
    if (
      state.bgHost ||
      [...Object.keys(previous), ...Object.keys(next)].some((key) =>
        background.BACKGROUND_STYLE_KEYS.has(key),
      )
    ) {
      background.syncBackgrounds(node, state)
    }

    if (!state.current()) {
      return
    }

    syncGeometry(node)
    if (!state.current()) {
      return
    }

    outlines.syncOutline(node, state)
    syncFrameLease(node, state)
  }

  function syncProjection(node: ElementNode) {
    const state = boxPaintStates.get(node)

    if (!state?.current() || state.syncing) {
      return
    }

    state.syncing = true
    try {
      // Compensation deliberately does not reapply authored transforms.
      border.syncBorderBox(node, state)
      if (state.current()) {
        shadow.syncBoxShadow(node, state)
      }

      if (state.current()) {
        syncFrameLease(node, state)
      }
    } finally {
      state.syncing = false
    }
  }

  function borderSpecForNode(node: ElementNode) {
    return boxPaintStates.get(node)?.borderSpec
  }

  function disposePaintState(node: ElementNode, state: BoxPaintState) {
    if (!state.active) {
      return
    }

    state.active = false
    if (boxPaintStates.get(node) === state) {
      boxPaintStates.delete(node)
    }

    retiringPaint.add(node)

    const failures = new FailureCollector()

    try {
      failures.run('box frame', () => clearBoxFrameObserver(state))
      failures.run('background paint', () => background.clearBackgrounds(node, state))
      failures.run('outline paint', () => outlines.clearOutline(node, state))
      failures.run('border paint', () => border.disposeBorder(node, state))
      failures.run('shadow paint', () => shadow.disposeShadow(node, state))

      const baseline = state.baseline

      state.baseline = undefined
      if (baseline) {
        const { layer, ...values } = baseline

        for (const key of Object.keys(values) as (keyof typeof values)[]) {
          failures.run('box baseline ' + key, () => {
            Object.assign(layer, { [key]: values[key] })
          })
        }
      }
    } finally {
      retiringPaint.delete(node)
    }

    failures.throwIfFailed()
  }

  function dispose(node: ElementNode) {
    const state = boxPaintStates.get(node)

    if (state) {
      disposePaintState(node, state)
    }
  }

  return { applyBoxStyle, isPaintStyle, syncGeometry, syncProjection, dispose, borderSpecForNode }
}
