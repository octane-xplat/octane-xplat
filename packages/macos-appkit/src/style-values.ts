import type { ElementNode, PropBag } from './model'

// Stateless reads and normalization shared by CSS, paint, layout and diagnostics.

// number | 'N' | 'V H' | 'T R B L' → NSEdgeInsets (top/left/bottom/right).
export function parseEdgeInsets(value: any) {
  if (typeof value === 'number' || !isNaN(Number(value))) {
    const n = Number(value)

    return { top: n, left: n, bottom: n, right: n }
  }

  const parts = String(value)
    .split(/\s+/)
    .map((p) => parseFloat(p) || 0)

  const top = parts[0] ?? 0
  const right = parts.length > 1 ? parts[1] : top
  const bottom = parts.length > 2 ? parts[2] : top
  const left = parts.length > 3 ? parts[3] : right

  return { top, left, bottom, right }
}

// `className` composes clsx-style on the DOM renderer and the NativeScript
// driver; this mirrors octane's `normalizeClass` (native dist must not import
// bare `octane`, and peers older than 0.11 predate the export) so a
// declarative array or object reaches the tokenizer instead of String(value)'s
// comma-join.
export function normalizeClass(value: any): string {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value !== 'object') {
    return typeof value === 'number' && value ? '' + value : ''
  }

  if (value === null) {
    return ''
  }

  let str = ''

  if (Array.isArray(value)) {
    for (const item of value) {
      if (item) {
        const inner = normalizeClass(item)

        if (inner) {
          str = str ? str + ' ' + inner : inner
        }
      }
    }
  } else {
    for (const key in value) {
      if (value[key]) {
        str = str ? str + ' ' + key : key
      }
    }
  }

  return str
}

/** Read computed CSS when available, falling back to authored inline style. */
export function effectiveStyle(node: ElementNode | null | undefined): PropBag {
  return node?.computedStyle ?? node?.props?.style ?? {}
}

export function isCollapsed(node: any) {
  return node?.props?.visibility === 'collapse' || node?.styleVisibility === 'collapse'
}

export function shallowEqualStyle(a: PropBag, b: PropBag) {
  const keys = Object.keys(a)

  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key])
}

export function nodeClasses(node: ElementNode): string[] {
  return normalizeClass(node.props?.className).split(/\s+/).filter(Boolean)
}
