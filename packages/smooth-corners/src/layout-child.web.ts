import type { LayoutChildProps } from './props'

// Grid-cell alignment vocabulary → CSS self-alignment.
const JUSTIFY_SELF: Record<string, string> = {
  left: 'start',
  center: 'center',
  middle: 'center',
  right: 'end',
  stretch: 'stretch',
}

const ALIGN_SELF: Record<string, string> = {
  top: 'start',
  center: 'center',
  middle: 'center',
  bottom: 'end',
  stretch: 'stretch',
}

// The element's box geometry — belongs on the outermost element so parent
// layouts size the whole component, not the clipped box inside it.
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

/** The inner box's `style` — everything except margins, which belong to the
 *  element's border box and move out to the wrapper. */
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

/** Parent-layout metadata folded into CSS on the outermost element — the
 *  shadow wrapper when present, the clipped box otherwise. Native's `dock`
 *  has no CSS equivalent and is ignored on web. Grid indices are zero-based
 *  in the shared API, matching NativeScript. */
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

  for (const key of ['left', 'top', 'right', 'bottom'] as const) {
    if (props[key] !== undefined) {
      style[key] = props[key]
    }
  }

  if (
    props.left !== undefined ||
    props.top !== undefined ||
    props.right !== undefined ||
    props.bottom !== undefined
  ) {
    style.position = 'absolute'
  }

  if (props.flexGrow !== undefined) {
    style.flexGrow = props.flexGrow
  }

  if (props.flexShrink !== undefined) {
    style.flexShrink = props.flexShrink
  }

  if (props.alignSelf !== undefined) {
    style.alignSelf = props.alignSelf
  }

  if (props.order !== undefined) {
    style.order = props.order
  }

  if (props.horizontalAlignment !== undefined) {
    style.justifySelf = JUSTIFY_SELF[props.horizontalAlignment] ?? props.horizontalAlignment
  }

  // CSS align-self is shared by flex and grid children — the grid-specific
  // prop wins when both are set.
  if (props.verticalAlignment !== undefined) {
    style.alignSelf = ALIGN_SELF[props.verticalAlignment] ?? props.verticalAlignment
  }

  if (props.style && typeof props.style === 'object') {
    for (const key of OUTER_STYLE_KEYS) {
      if (props.style[key] !== undefined) {
        style[key] = props.style[key]
      }
    }
  }

  return { style }
}
