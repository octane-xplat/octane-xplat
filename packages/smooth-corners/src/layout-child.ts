import type { LayoutChildProps } from './props'

// The element's box geometry — parent layouts read the child's own style for
// size and margins, so these keys must land on the outer wrapper. The rest
// of `style` stays on the inner box (it is the clipped, painted surface).
const OUTER_STYLE_KEYS = [
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'position',
  'left',
  'top',
  'right',
  'bottom',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'justifySelf',
  'order',
  'gridRow',
  'gridColumn',
  'transform',
  'opacity',
] as const

/** Content and paint styles exclude geometry owned by the outer wrapper.
 * In particular, percentage sizes and transforms must apply exactly once. */
export function paintedStyle(style: any): any {
  if (!style || typeof style !== 'object') {
    return style
  }

  const next = { ...style }

  for (const key of OUTER_STYLE_KEYS) {
    delete next[key]
  }

  return next
}

/** Parent-layout metadata translated to CSS on the OUTER wrapper — the node
 *  the parent layout reads as its child. Placement sugar compiles to the
 *  same style keys as the shared layout-child helper; the box-geometry
 *  keys (size/margins) mirror out of `style` since parent layouts read the
 *  child's own box. */
export function outerLayoutProps(props: LayoutChildProps & { style?: any }): {
  style: Record<string, any>
} {
  const style: Record<string, any> = {}

  if (props.row !== undefined) {
    style.gridRow = `${props.row + 1} / span ${props.rowSpan ?? 1}`
  } else if (props.rowSpan !== undefined) {
    style.gridRow = `span ${props.rowSpan}`
  }

  if (props.col !== undefined) {
    style.gridColumn = `${props.col + 1} / span ${props.colSpan ?? 1}`
  } else if (props.colSpan !== undefined) {
    style.gridColumn = `span ${props.colSpan}`
  }

  if (props.dock !== undefined) {
    style.position = 'absolute'
    if (props.dock === 'left' || props.dock === 'top' || props.dock === 'bottom') {
      style.left = 0
    }

    if (props.dock === 'right' || props.dock === 'top' || props.dock === 'bottom') {
      style.right = 0
    }

    if (props.dock === 'top' || props.dock === 'left' || props.dock === 'right') {
      style.top = 0
    }

    if (props.dock === 'bottom' || props.dock === 'left' || props.dock === 'right') {
      style.bottom = 0
    }
  }

  if (props.left !== undefined) {
    style.left = props.left
    style.position = style.position ?? 'absolute'
  }

  if (props.top !== undefined) {
    style.top = props.top
    style.position = style.position ?? 'absolute'
  }

  if (props.right !== undefined) {
    style.right = props.right
    style.position ??= 'absolute'
  }

  if (props.bottom !== undefined) {
    style.bottom = props.bottom
    style.position ??= 'absolute'
  }

  const horizontal = {
    left: 'start',
    center: 'center',
    middle: 'center',
    right: 'end',
    stretch: 'stretch',
  }

  const vertical = {
    top: 'start',
    center: 'center',
    middle: 'center',
    bottom: 'end',
    stretch: 'stretch',
  }

  if (props.horizontalAlignment !== undefined) {
    style.justifySelf = horizontal[props.horizontalAlignment]
  }

  if (props.verticalAlignment !== undefined) {
    style.alignSelf = vertical[props.verticalAlignment]
  }

  for (const key of ['flexGrow', 'flexShrink', 'alignSelf', 'order'] as const) {
    if (props[key] !== undefined) {
      style[key] = props[key]
    }
  }

  const source = props.style && typeof props.style === 'object' ? props.style : {}

  for (const key of OUTER_STYLE_KEYS) {
    if (source[key] !== undefined) {
      style[key] = source[key]
    }
  }

  return { style }
}
