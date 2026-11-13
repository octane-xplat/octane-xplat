/** Android uses Mason's CSS path clip for painting and descendants on every
 * supported API. A foreground Drawable adds the inside border without
 * replacing Mason's background. Outlines belong only to native elevation.
 * Native globals are resolved lazily so this module is import-safe on iOS. */
import { Color, Utils } from '@nativescript/core'
import { commandsToD, generateCommands } from './path'
import { colorChannels } from './validation.ts'
import type { PathCommand } from './path'
import type { SmoothCornersProps } from './props'

declare const android: any

const ownedClips = new WeakMap<object, string>()
const ownedBorders = new WeakMap<
  object,
  { drawable: any; foreground: any; previous: any; props: SmoothCornersProps; path: any }
>()

function toAndroidPath(cmds: PathCommand[]): any {
  const p = new android.graphics.Path()

  for (const c of cmds) {
    switch (c.c) {
      case 'M':
        p.moveTo(c.x, c.y)
        break
      case 'L':
        p.lineTo(c.x, c.y)
        break
      case 'C':
        p.cubicTo(c.x1, c.y1, c.x2, c.y2, c.x, c.y)
        break
      case 'A': {
        // Canvas is y-down like SVG — degrees map directly.
        const rect = new android.graphics.RectF(c.cx - c.r, c.cy - c.r, c.cx + c.r, c.cy + c.r)

        p.arcTo(rect, c.startDeg, c.sweepDeg, false)
        break
      }
      case 'Z':
        p.close()
        break
    }
  }

  // Generate in DIPs, then scale the entire path once (including every radius).
  const scale = Utils.layout.toDevicePixels(1)
  const matrix = new android.graphics.Matrix()

  matrix.setScale(scale, scale)
  p.transform(matrix)
  return p
}

function makeDrawable(state: { props: SmoothCornersProps; path: any }): any {
  const Drawable = (android.graphics.drawable.Drawable as any).extend({
    draw(canvas: any) {
      const path = state.path

      if (!path) {
        return
      }

      const border = state.props.border

      if (border && border.width > 0 && border.color) {
        const paint = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG)

        paint.setStyle(android.graphics.Paint.Style.STROKE)

        // Clip the paint operation itself: visible child overflow must not
        // expose the outer half of the doubled inside border.
        const checkpoint = canvas.save()

        canvas.clipPath(path)
        paint.setStrokeWidth(Utils.layout.toDevicePixels(border.width) * 2)

        const [r, g, b, a] = colorChannels(border.color)

        paint.setColor(new Color(Math.round(a * 255), r, g, b).android)
        canvas.drawPath(path, paint)
        canvas.restoreToCount(checkpoint)
      }
    },
    getOpacity() {
      return android.graphics.PixelFormat.TRANSLUCENT
    },
    setAlpha(_a: number) {},
    setColorFilter(_f: any) {},
  })

  return new Drawable()
}

/** Mason owns the clip lifecycle, antialiasing and clipped-region touch exclusion. */
export function applySmoothClip(view: any, props: SmoothCornersProps, clip = true): void {
  const native = view?.android
  const style = view?.style

  if (!native || !style) {
    return
  }

  if (!clip) {
    const owned = ownedClips.get(view)

    if (owned !== undefined && style.clipPath === owned) {
      style.clipPath = 'none'
    }

    ownedClips.delete(view)
  }

  const size = view.getActualSize?.()

  if (!size || size.width <= 0 || size.height <= 0) {
    return
  }

  const commands = generateCommands(size.width, size.height, props.corners)

  if (clip) {
    const value = `path("${commandsToD(commands)}")`

    if (style.clipPath !== value) {
      style.clipPath = value
    }

    ownedClips.set(view, value)
  }

  // Overflow is resolved by Mason; never replace its background/outline owner.
  if (props.border && props.border.width > 0) {
    let state = ownedBorders.get(view)

    if (!state) {
      state = {
        drawable: null,
        foreground: null,
        previous: native.getForeground(),
        props,
        path: null,
      }

      state.drawable = makeDrawable(state)
      state.foreground = state.previous
        ? new android.graphics.drawable.LayerDrawable([state.previous, state.drawable])
        : state.drawable

      ownedBorders.set(view, state)
      native.setForeground(state.foreground)
    }

    state.props = props
    state.path = toAndroidPath(commands)
    state.drawable.setBounds(0, 0, native.getWidth(), native.getHeight())
  } else {
    clearBorder(view)
  }

  native.invalidate()
}

function clearBorder(view: any): void {
  const state = ownedBorders.get(view)
  const native = view?.android

  if (state && native?.getForeground() === state.foreground) {
    native.setForeground(state.previous)
  }

  ownedBorders.delete(view)
}

/** Release only the CSS value and foreground this adapter still owns. */
export function disposeSmoothClip(view: any): void {
  const owned = ownedClips.get(view)

  if (owned !== undefined && view?.style?.clipPath === owned) {
    view.style.clipPath = 'none'
  }

  ownedClips.delete(view)
  clearBorder(view)
}

interface ElevationState {
  provider: any
  previousProvider: any
  previousElevation: number
  elevation: number
  clipChildren: boolean
  clipPadding: boolean
  clipOutline: boolean
  path: any
  d: string
}

const ownedElevations = new WeakMap<object, ElevationState>()

/** Restore the previous native owner only while our outline is still installed. */
export function disposeSmoothShadow(view: any): void {
  const state = ownedElevations.get(view)
  const native = view?.android

  if (state && native?.getOutlineProvider() === state.provider) {
    native.setOutlineProvider(state.previousProvider)
    if (native.getElevation() === state.elevation) {
      native.setElevation(state.previousElevation)
    }

    native.setClipToOutline(state.clipOutline)
    native.setClipChildren(state.clipChildren)
    native.setClipToPadding(state.clipPadding)
    native.invalidateOutline()
  }

  ownedElevations.delete(view)
}

/** Native elevation is explicitly Android-specific, outside the content clip. */
export function applySmoothShadow(view: any, props: SmoothCornersProps): void {
  const native = view?.android
  const size = view?.getActualSize?.()

  if (!native) {
    return
  }

  if (!props.android?.elevation) {
    disposeSmoothShadow(view)
    return
  }

  if (!size || size.width <= 0 || size.height <= 0) {
    return
  }

  const commands = generateCommands(size.width, size.height, props.corners)
  const d = commandsToD(commands)
  let state = ownedElevations.get(view)

  if (!state) {
    state = {
      provider: null,
      previousProvider: native.getOutlineProvider(),
      previousElevation: native.getElevation(),
      elevation: 0,
      clipChildren: native.getClipChildren(),
      clipPadding: native.getClipToPadding(),
      clipOutline: native.getClipToOutline(),
      path: toAndroidPath(commands),
      d,
    }

    const current = state
    const Provider = android.view.ViewOutlineProvider.extend({
      getOutline(_target: any, outline: any) {
        if (android.os.Build.VERSION.SDK_INT >= 30) {
          outline.setPath(current.path)
        } else {
          outline.setConvexPath(current.path)
        }
      },
    })

    state.provider = new Provider()
    ownedElevations.set(view, state)
    native.setOutlineProvider(state.provider)
    native.setClipToOutline(false)
    native.setClipChildren(false)
    native.setClipToPadding(false)
  }

  if (state.d !== d) {
    state.d = d
    state.path = toAndroidPath(commands)
    native.invalidateOutline()
  }

  state.elevation = Utils.layout.toDevicePixels(props.android.elevation)
  native.setElevation(state.elevation)
}
