import type { PaintPresentation } from '@octane-xplat/nativescript-mason-core/paint-presentation'
import { attachStyles } from './styles'
import { observeOwnedPress } from '@octane-xplat/ui/internal/gesture-input'
import { captureViewportOffset } from './projection/viewport-offset'
import { correctNativePaint, radiusKeys } from './projection/paint'
import type { DelegatedRequest, DelegatedRun, HostAdapter, StyleAdapter } from './host-types'
import type { ResolvedTarget } from './types'
import { attachPan } from './pan'
import { delegatedRun } from './driver'
import { measureNativeBox } from './projection/measure'

// The retained NativeScript View exposes direct transform channels in DIP.
export function attachHost(node: any): HostAdapter {
  const original = {
    opacity: node.opacity ?? 1,
    x: node.translateX ?? 0,
    y: node.translateY ?? 0,
    scaleX: node.scaleX ?? 1,
    scaleY: node.scaleY ?? 1,
    rotate: node.rotate ?? 0,
  }

  if (
    original.x ||
    original.y ||
    original.rotate ||
    original.scaleX !== 1 ||
    original.scaleY !== 1
  ) {
    throw new Error('motion: put existing transforms on an outer container')
  }

  let latestValues: ResolvedTarget = { ...original, scale: 1 }
  const write = (values: any) => {
    latestValues = { ...latestValues, ...values }
    if (values.opacity !== undefined) {
      node.opacity = Math.min(1, Math.max(0, values.opacity))
    }

    if (values.x !== undefined) {
      node.translateX = values.x
    }

    if (values.y !== undefined) {
      node.translateY = values.y
    }

    if (values.rotate !== undefined) {
      node.rotate = values.rotate
    }

    if (values.scale !== undefined || values.scaleX !== undefined) {
      node.scaleX = (values.scale ?? 1) * (values.scaleX ?? 1)
    }

    if (values.scale !== undefined || values.scaleY !== undefined) {
      node.scaleY = (values.scale ?? 1) * (values.scaleY ?? 1)
    }
  }

  const hasPresentation = typeof node.createPaintPresentation === 'function'
  let presentation: PaintPresentation | undefined
  // Ordinary Core views retain the resolved-style adapter; Mason supplies its own lease.
  const paintStyle = hasPresentation ? undefined : node.style
  const paintKeys = [...radiusKeys, 'boxShadow']
  let paintSaved: Record<string, any> | undefined
  let paintApplied: Record<string, any> = {}
  const restorePaint = () => {
    presentation?.clear()
    if (!paintSaved || !paintStyle) {
      return
    }

    for (const key of paintKeys) {
      if (paintStyle[key] === paintApplied[key]) {
        paintStyle[key] = paintSaved[key]
      }
    }

    paintSaved = undefined
  }

  const correctPaint = (projection: import('./projection/types').ProjectionWrite) => {
    restorePaint()
    if (hasPresentation) {
      presentation ??= node.createPaintPresentation()
      if (presentation) {
        presentation.write(correctNativePaint(presentation.read(), projection))
      }

      return
    }

    const native = node.ios ?? node.android

    if (
      native &&
      (typeof native.getStyle === 'function' || typeof native.style?.clipPath === 'string')
    ) {
      throw new Error(
        'motion: Mason layout projection requires createPaintPresentation; update Mason core to 1.0.0-beta.9 or later',
      )
    }

    if (!paintStyle) {
      return
    }

    paintSaved = Object.fromEntries(paintKeys.map((key) => [key, paintStyle[key]]))

    const corrected = correctNativePaint(paintSaved, projection)

    for (const key of Object.keys(corrected)) {
      if (corrected[key] !== undefined) {
        paintStyle[key] = corrected[key]
      }
    }

    paintApplied = Object.fromEntries(paintKeys.map((key) => [key, paintStyle[key]]))
  }

  const styles =
    node.style && typeof node.getActualSize === 'function' ? attachStyles(node) : undefined

  let latestProjection: import('./projection/types').ProjectionWrite | null = null
  const ownedStyles: StyleAdapter | undefined = styles
    ? {
        ...styles,
        write(values) {
          restorePaint()
          styles.write(values)
          if (latestProjection) {
            correctPaint(latestProjection)
          }
        },
        release(key) {
          restorePaint()
          styles.release(key)
        },
      }
    : undefined

  const disposePaint = () => {
    restorePaint()
    presentation?.dispose()
    presentation = undefined
  }

  return {
    dispose: disposePaint,
    styles: ownedStyles,
    pan: (axis, callbacks) => attachPan(node, axis, callbacks),
    measureLayout() {
      const box = measureNativeBox(node)

      return box
        ? {
            layoutBox: box,
            measuredBox: measureNativeBox(node, true)!,
            viewportOffset: captureViewportOffset(node),
          }
        : null
    },
    resetProjection() {
      restorePaint()
      // Native measurement ignores transforms, so nothing needs clearing;
      // render() rewrites every hasProjected node each frame anyway.
    },
    project(projection) {
      latestProjection = projection
      if (projection === null) {
        restorePaint()
        write(latestValues)
        return
      }

      correctPaint(projection)
      // Channel writes reach the node, not this adapter, while projecting.
      latestValues = { ...latestValues, ...projection.latest }
      node.translateX = projection.delta.x.translate / projection.treeScale.x
      node.translateY = projection.delta.y.translate / projection.treeScale.y
      node.scaleX = projection.delta.x.scale
      node.scaleY = projection.delta.y.scale
      node.rotate = projection.latest.rotate ?? 0
    },
    read: () => ({ ...original, scale: 1 }),
    write,
    restore: () => {
      disposePaint()
      write(original)
    },
    delegate: (req: DelegatedRequest): DelegatedRun | null => delegatedRun(node, req, write),
    gesture(kind, callbacks) {
      if (typeof node.on !== 'function' || typeof node.off !== 'function') {
        return null
      }

      if (kind === 'press') {
        return observeOwnedPress(node, callbacks)
      }

      // focus/blur exist only on focusable hosts (editable text, buttons).
      const onFocus = () => callbacks.start()
      const onBlur = () => callbacks.end()

      node.on('focus', onFocus)
      node.on('blur', onBlur)
      return () => {
        node.off('focus', onFocus)
        node.off('blur', onBlur)
      }
    },
  }
}
