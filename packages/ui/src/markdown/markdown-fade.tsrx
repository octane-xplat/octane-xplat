import { useEffect, useMemo, useState } from 'octane'
import { useMediaQuery } from '../internal/platform/use-media-query.tsrx'
import { hostGlobal } from '../internal/platform/host-bridge'
import { useTheme } from '../theme/use-theme.tsrx'
import { parseCssDuration } from '../components/content/use-streaming-text.tsrx'

// ---------------------------------------------------------------------------
// Native streaming fade driver — the reveal mechanism for text runs on hosts
// without CSS. The reference fades opacity on web; native spans have no
// opacity channel, so the driver animates the run's foreground alpha from 0
// to its resolved color over --duration-medium with the --ease-standard
// cubic-bezier, under the same reduced-motion rule (Astryx Markdown 0.7.4).
// ---------------------------------------------------------------------------

interface FrameHost {
  request(callback: (time: number) => void): number
  cancel(id: number): void
}

/** rAF where the host provides it, a ~16ms timer elsewhere. */
function frameHost(): FrameHost {
  const request = hostGlobal<(cb: (time: number) => void) => number>('requestAnimationFrame')
  const cancel = hostGlobal<(id: number) => void>('cancelAnimationFrame')

  if (typeof request === 'function' && typeof cancel === 'function') {
    return { request, cancel }
  }

  return {
    request: (callback) => setTimeout(() => callback(Date.now()), 16) as unknown as number,
    cancel: (id) => clearTimeout(id as unknown as ReturnType<typeof setTimeout>),
  }
}

/** `t → y` for a CSS cubic-bezier(x1, y1, x2, y2) timing function. */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx

  return (x: number): number => {
    if (x <= 0) {
      return 0
    }

    if (x >= 1) {
      return 1
    }

    let t = x

    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x

      if (Math.abs(err) < 1e-6) {
        return sampleY(t)
      }

      const d = sampleDX(t)

      if (Math.abs(d) < 1e-6) {
        break
      }

      t -= err / d
    }

    let lo = 0
    let hi = 1

    while (lo < hi) {
      const v = sampleX(t)

      if (Math.abs(v - x) < 1e-6) {
        return sampleY(t)
      }

      if (v < x) {
        lo = t
      } else {
        hi = t
      }

      t = (lo + hi) / 2
    }

    return sampleY(t)
  }
}

/** Parse `cubic-bezier(a, b, c, d)` into a sampler; anything else → linear. */
function parseEasing(value: string): (x: number) => number {
  const m = value.match(
    /^cubic-bezier\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)$/,
  )

  if (m) {
    return cubicBezier(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]))
  }

  if (value === 'ease-in') {
    return cubicBezier(0.42, 0, 1, 1)
  }

  if (value === 'ease-out') {
    return cubicBezier(0, 0, 0.58, 1)
  }

  if (value === 'ease-in-out' || value === 'ease') {
    return cubicBezier(0.25, 0.1, 0.25, 1)
  }

  return (x) => x
}

/** Apply an alpha channel to a concrete color string; null when the color
 *  is not a shape the renderer can carry an alpha on (var(), named, lab…). */
function withAlpha(color: string, alpha: number): string | null {
  const hex = color.trim()
  const short = /^#([0-9a-f]{3})$/i.exec(hex)

  if (short) {
    const [r, g, b] = short[1].split('').map((c) => parseInt(c + c, 16))

    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const long = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex)

  if (long) {
    const n = parseInt(long[1], 16)

    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
  }

  const rgba = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*[\d.]+\s*)?\)$/i.exec(
    hex,
  )

  if (rgba) {
    return `rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${alpha})`
  }

  return null
}

const DEFAULT_RUN_COLOR = '--color-text-primary'

/**
 * Resolve the fading run's animated `color` — null when the fade cannot run
 * (unresolvable color), in which case the caller renders an ordinary span.
 * The alpha animates 0→1 over `--duration-medium` on the `--ease-standard`
 * curve; under `prefers-reduced-motion` the run mounts settled.
 */
export function useFadeRunColor(runColor?: string): string | null {
  const { token } = useTheme()
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const durationMs = parseCssDuration(token('--duration-medium')) ?? 410
  const easing = useMemo(() => parseEasing(token('--ease-standard')), [token])
  const base = token(runColor ?? DEFAULT_RUN_COLOR)
  const baseColor = withAlpha(base, 1) == null ? null : base
  const [alpha, setAlpha] = useState(() => (reducedMotion || baseColor == null ? 1 : 0))

  useEffect(() => {
    if (reducedMotion || baseColor == null) {
      return
    }

    const host = frameHost()
    const start = { at: -1 }
    let frame = 0
    const tick = (now: number) => {
      if (start.at < 0) {
        start.at = now
      }

      const t = Math.min(1, (now - start.at) / Math.max(1, durationMs))

      setAlpha(easing(t))
      if (t < 1) {
        frame = host.request(tick)
      }
    }

    frame = host.request(tick)
    return () => host.cancel(frame)
  }, [reducedMotion, baseColor, durationMs, easing])

  if (baseColor == null) {
    return null
  }

  if (alpha >= 1) {
    return baseColor
  }

  return withAlpha(baseColor, alpha) ?? baseColor
}
