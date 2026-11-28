/** @jsxImportSource @octane-xplat/jsx */
import { Color, Utils, View } from '@nativescript/core'
import type { BorderBeamProps } from '../../props'
import { useBorderBeamFrame, type BorderBeamPainter } from './useBorderBeamFrame.tsrx'
import { beamDuration, beamInset, beamStrokes, beamTrack } from './border-beam'

interface BeamDrawable extends android.graphics.drawable.Drawable {
  draw(canvas: android.graphics.Canvas): void
}

interface BeamDrawableClass {
  extend(methods: {
    draw(canvas: android.graphics.Canvas): void
    getOpacity(): number
    setAlpha(alpha: number): void
    setColorFilter(filter: android.graphics.ColorFilter | null): void
  }): new () => BeamDrawable
}

function createPainter(): BorderBeamPainter {
  let view: android.view.View | null = null
  let drawable: BeamDrawable | null = null
  let animator: android.animation.ValueAnimator | null = null
  let last = ''

  function clear() {
    animator?.cancel()
    animator?.removeAllUpdateListeners()
    animator = null

    if (drawable) {
      view?.getOverlay().remove(drawable)
      drawable = null
    }

    view = null
    last = ''
  }

  return {
    update(host, radius, reducedMotion) {
      const native = host instanceof View ? host.android : undefined

      if (!native?.isAttachedToWindow()) {
        clear()
        return
      }

      const scale = Utils.layout.toDevicePixels(1)
      const width = native.getWidth()
      const height = native.getHeight()
      const track = beamTrack(width / scale, height / scale, radius)

      if (!track) {
        clear()
        return
      }

      const next = `${width}:${height}:${track.radius}:${reducedMotion}`

      if (view === native && last === next) {
        return
      }

      clear()

      const { Paint, Path, PathMeasure, PixelFormat } = android.graphics
      const path = new Path()
      const segment = new Path()
      const inset = beamInset * scale
      const corner = track.radius * scale

      path.addRoundRect(
        inset,
        inset,
        width - inset,
        height - inset,
        corner,
        corner,
        Path.Direction.CW,
      )

      const measure = new PathMeasure(path, true)
      const perimeter = measure.getLength()
      let phase = 0

      const strokes = beamStrokes.map((stroke) => {
        const paint = new Paint(Paint.ANTI_ALIAS_FLAG)

        paint.setStyle(Paint.Style.STROKE)
        paint.setStrokeCap(Paint.Cap.ROUND)
        paint.setStrokeWidth(stroke.width * scale)
        paint.setColor(new Color(stroke.color).android)
        paint.setAlpha(Math.round(255 * stroke.opacity))
        return { paint, length: stroke.length * perimeter }
      })

      // NativeScript supports subclassing Java drawables through extend.
      // Android's SDK declarations describe the Java class alone.
      const Drawable = android.graphics.drawable.Drawable as unknown as BeamDrawableClass
      const Stroke = Drawable.extend({
        draw(canvas: android.graphics.Canvas) {
          const head = phase * perimeter

          for (const { paint, length } of strokes) {
            segment.rewind()

            const start = head - length

            if (start < 0) {
              measure.getSegment(perimeter + start, perimeter, segment, true)
            }

            measure.getSegment(Math.max(0, start), head, segment, start >= 0)
            canvas.drawPath(segment, paint)
          }
        },
        getOpacity: () => PixelFormat.TRANSLUCENT,
        setAlpha() {},
        setColorFilter() {},
      })

      drawable = new Stroke()
      drawable.setBounds(0, 0, width, height)
      view = native
      native.getOverlay().add(drawable)
      last = next

      if (!reducedMotion) {
        const values = Array.create('float', 2)

        values[1] = 1
        animator = android.animation.ValueAnimator.ofFloat(values)
        animator.setDuration(beamDuration)
        animator.setRepeatCount(android.animation.ValueAnimator.INFINITE)
        animator.setInterpolator(new android.view.animation.LinearInterpolator())
        animator.addUpdateListener(
          new android.animation.ValueAnimator.AnimatorUpdateListener({
            onAnimationUpdate(animation) {
              phase = animation.getAnimatedFraction()
              drawable?.invalidateSelf()
            },
          }),
        )

        animator.start()
      }
    },
    clear,
  }
}

export type { BorderBeamProps } from '../../props'

export function BorderBeam(props: BorderBeamProps): unknown @{
  const frame = useBorderBeamFrame(props, createPainter)

  <masonview {...frame}>{props.children}</masonview>
}
