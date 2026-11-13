import type { CornerConfig, CornerOptions, SmoothCornersProps } from './props'

/** Validate public numeric values before they reach native drawing APIs. */
export function finite(name: string, value: number, min = -Infinity, max = Infinity): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`SmoothCorners ${name} must be finite and between ${min} and ${max}`)
  }
}

function corner(value: CornerConfig | number | undefined): void {
  if (value === undefined) {
    return
  }

  if (typeof value === 'number') {
    finite('radius', value, 0)
    return
  }

  finite('radius', value.radius, 0)
  if (
    value.curve !== undefined &&
    !['continuous', 'squircle', 'superellipse', 'clothoid', 'arc'].includes(value.curve)
  ) {
    throw new TypeError(`SmoothCorners unknown curve: ${value.curve}`)
  }

  if (value.smoothing !== undefined) {
    finite('smoothing', value.smoothing, 0, 1)
  }

  if (value.exponent !== undefined) {
    finite('exponent', value.exponent, 2)
  }
}

export function validateCorners(options: CornerOptions): void {
  if (typeof options === 'number' || 'radius' in options) {
    corner(options)
  } else {
    corner(options.topLeft)
    corner(options.topRight)
    corner(options.bottomRight)
    corner(options.bottomLeft)
  }
}

/** Portable border/shadow colors: CSS hex and comma-separated rgb()/rgba(). */
export function colorChannels(value: string): readonly [number, number, number, number] {
  value = value.trim()
  if (value.toLowerCase() === 'transparent') {
    return [0, 0, 0, 0]
  }

  const hex = /^#([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.exec(value)

  if (hex) {
    let digits = hex[1]

    if (digits.length <= 4) {
      digits = [...digits].map((c) => c + c).join('')
    }

    return [
      parseInt(digits.slice(0, 2), 16),
      parseInt(digits.slice(2, 4), 16),
      parseInt(digits.slice(4, 6), 16),
      digits.length === 8 ? parseInt(digits.slice(6, 8), 16) / 255 : 1,
    ]
  }

  const rgb =
    /^(rgb|rgba)\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(value)

  if (rgb && (rgb[1].toLowerCase() === 'rgba') === (rgb[5] !== undefined)) {
    const r = Number(rgb[2]),
      g = Number(rgb[3]),
      b = Number(rgb[4]),
      a = Number(rgb[5] ?? 1)

    finite('red', r, 0, 255)
    finite('green', g, 0, 255)
    finite('blue', b, 0, 255)
    finite('alpha', a, 0, 1)
    return [r, g, b, a]
  }

  throw new TypeError('SmoothCorners colors must use CSS hex, rgb(), rgba(), or transparent')
}

export function validateSurfaceProps(
  props: SmoothCornersProps,
  target: 'web' | 'ios' | 'android' | 'macos',
): void {
  validateCorners(props.corners)
  for (const key of ['row', 'col', 'rowSpan', 'colSpan', 'order'] as const) {
    const value = props[key]

    if (value !== undefined) {
      finite(key, value, key === 'order' ? -Infinity : key.endsWith('Span') ? 1 : 0)
      if (!Number.isInteger(value)) {
        throw new RangeError(`SmoothCorners ${key} must be an integer`)
      }
    }
  }

  for (const key of ['left', 'top', 'right', 'bottom', 'flexGrow', 'flexShrink'] as const) {
    const value = props[key]

    if (value !== undefined) {
      finite(key, value, key.startsWith('flex') ? 0 : -Infinity)
    }
  }

  if (typeof props.style === 'string' || Array.isArray(props.style)) {
    throw new TypeError(
      'SmoothCorners style must be a CSS property object; put static styles in className',
    )
  }

  if (props.border) {
    finite('border.width', props.border.width, 0)
    colorChannels(props.border.color)
  }

  if (props.android?.elevation !== undefined) {
    finite('android.elevation', props.android.elevation, 0)
  }

  if (props.shadow) {
    if (target === 'android') {
      throw new Error(
        'SmoothCorners shadow is unavailable on Android; use android={{ elevation: number }} for a native elevation shadow',
      )
    }

    const s = props.shadow

    if (s.color !== undefined) {
      colorChannels(s.color)
    }

    if (s.opacity !== undefined) {
      finite('shadow.opacity', s.opacity, 0, 1)
    }

    if (s.blur !== undefined) {
      finite('shadow.blur', s.blur, 0)
    }

    if (s.spread !== undefined) {
      finite('shadow.spread', s.spread)
    }

    if (s.offsetX !== undefined) {
      finite('shadow.offsetX', s.offsetX)
    }

    if (s.offsetY !== undefined) {
      finite('shadow.offsetY', s.offsetY)
    }
  }
}
