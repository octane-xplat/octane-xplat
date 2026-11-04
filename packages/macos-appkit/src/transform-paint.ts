import type { BoxPaintState } from './box-paint-state'
import type { ElementNode } from './model'
import {
  CATransform3DIdentity,
  CATransform3DRotate,
  CATransform3DScale,
  CATransform3DTranslate,
} from '@octane-xplat/platform/macos'
import { composeTransform, transformToParts, type TranslateAxis } from '@octane-xplat/css-engine'

export type TransformPaint = ReturnType<typeof createTransformPaint>

export function createTransformPaint() {
  // ---- transforms --------------------------------------------------------------

  // Style keys that feed the transform — NS vocabulary: the `transform`
  // shorthand plus longhands (rotatex/rotatey arrive lowercase from CSS
  // pending-substitution, rotateX/rotateY from inline styles).
  const TRANSFORM_KEYS = new Set([
    'transform',
    'translateX',
    'translateY',
    'scaleX',
    'scaleY',
    'rotate',
    'rotateX',
    'rotatex',
    'rotateY',
    'rotatey',
    'perspective',
  ])

  const TRANSFORM_SLOT: Record<string, string> = {
    rotatex: 'rotateX',
    rotatey: 'rotateY',
  }

  // A translate axis is points or 'N%' resolved against the element's own size.
  function translateAxisValue(value: unknown): TranslateAxis {
    // The CSS engine and keyframe sampler already normalize percent axes.
    if (
      typeof value === 'object' &&
      value != null &&
      'unit' in value &&
      value.unit === '%' &&
      'value' in value &&
      typeof value.value === 'number' &&
      Number.isFinite(value.value)
    ) {
      return { value: value.value, unit: '%' }
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0
    }
    const text = String(value ?? '').trim()
    const pct = /^([+-]?(?:\d+\.?\d*|\.\d+))%$/.exec(text)
    if (pct) {
      return { value: Number(pct[1]) / 100, unit: '%' }
    }
    const n = parseFloat(text)
    return Number.isFinite(n) ? n : 0
  }

  // '45deg'|'0.5turn'|'1.57rad'|45|'400grad' → degrees.
  function transformAngleValue(value: any): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0
    }
    const text = String(value ?? '')
      .trim()
      .toLowerCase()
    const n = parseFloat(text)
    if (!Number.isFinite(n)) {
      return 0
    }
    if (text.endsWith('turn')) {
      return n * 360
    }
    if (text.endsWith('grad')) {
      return n * 0.9
    }
    if (text.endsWith('rad')) {
      return (n * 180) / Math.PI
    }
    return n
  }

  // '150%'|1.5|'1.5' → multiplier.
  function transformScaleValue(value: any): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0
    }
    const n = parseFloat(String(value ?? '').trim())
    if (!Number.isFinite(n)) {
      return 0
    }
    return String(value).trim().endsWith('%') ? n / 100 : n
  }

  const DEFAULT_PERSPECTIVE = 300

  // Compose the node's transform spec into a CATransform3D — NS composition
  // order (translate → rotate z → rotate x/y with perspective → scale) around
  // the layer's centre anchor. Y-down CSS semantics map to y-up layer space by
  // negating every y translate and every angle.
  function syncTransform(node: ElementNode, state: BoxPaintState) {
    const view = node.view
    if (!view || typeof CATransform3DTranslate !== 'function') {
      return
    }
    const spec = state.transformSpec
    let parts: any = {}
    if (spec?.transform != null) {
      try {
        parts = transformToParts(String(spec.transform))
      } catch {
        parts = {}
      }
    }
    if (spec?.translateX !== undefined) {
      parts.translateX = spec.translateX
    }
    if (spec?.translateY !== undefined) {
      parts.translateY = spec.translateY
    }
    if (spec?.scaleX !== undefined) {
      parts.scaleX = transformScaleValue(spec.scaleX)
    }
    if (spec?.scaleY !== undefined) {
      parts.scaleY = transformScaleValue(spec.scaleY)
    }
    if (spec?.rotate !== undefined) {
      parts.rotate = transformAngleValue(spec.rotate)
    }
    if (spec?.rotateX !== undefined) {
      parts.rotateX = transformAngleValue(spec.rotateX)
    }
    if (spec?.rotateY !== undefined) {
      parts.rotateY = transformAngleValue(spec.rotateY)
    }

    const size = view.frame?.size ?? { width: 0, height: 0 }
    const steps = composeTransform(
      parts,
      Math.max(0, Number(size.width) || 0),
      Math.max(0, Number(size.height) || 0),
    )
    if (!steps.length) {
      if (state.transformApplied && view.layer) {
        view.layer.transform = CATransform3DIdentity
        state.transformApplied = false
      }

      return
    }

    view.wantsLayer = true
    const layer = view.layer
    if (!layer) {
      return
    }
    let t = CATransform3DIdentity
    for (const step of steps) {
      if (step.kind === 'translate') {
        t = CATransform3DTranslate(t, step.args[0] || 0, -step.args[1] || 0, 0)
      } else if (step.kind === 'rotate') {
        t = CATransform3DRotate(t, (-step.args[0] * Math.PI) / 180, 0, 0, 1)
      } else if (step.kind === 'rotate3d') {
        const depth = parseFloat(String(spec?.perspective)) || DEFAULT_PERSPECTIVE
        if (depth > 0) {
          try {
            ;(t as any).m34 = -1 / depth
          } catch {
            // Structs that reject member writes still get the rotation.
          }
        }

        t = CATransform3DRotate(t, (-step.args[0] * Math.PI) / 180, 1, 0, 0)
        t = CATransform3DRotate(t, (-step.args[1] * Math.PI) / 180, 0, 1, 0)
      } else if (step.kind === 'scale') {
        t = CATransform3DScale(t, step.args[0], step.args[1], 1)
      }
    }
    layer.transform = t
    state.transformApplied = true
  }

  function hasPercentTranslate(node: ElementNode, state: BoxPaintState): boolean {
    const spec = state.transformSpec
    return (
      spec != null &&
      ((typeof spec.transform === 'string' && spec.transform.includes('%')) ||
        spec.translateX?.unit === '%' ||
        spec.translateY?.unit === '%' ||
        String(spec.translateX ?? '').includes('%') ||
        String(spec.translateY ?? '').includes('%'))
    )
  }

  return {
    TRANSFORM_KEYS,
    TRANSFORM_SLOT,
    translateAxisValue,
    hasPercentTranslate,
    syncTransform,
  }
}
