/** @jsxImportSource @octane-xplat/jsx */
import type { Renderable } from '../props'

/**
 * Source-line provenance wrapper — the `markdownSourceLinesPlugin` payload.
 * On native leaves there is no DOM to stamp `data-source-line` attributes
 * on, so this is a passthrough; the web leaf stamps the attributes on a
 * `display:contents` wrapper so geometry matches the block exactly.
 */
export function MdSourceLines(props: {
  lines?: { readonly start: number; readonly end: number }
  children?: Renderable
}): unknown @{
  return props.children
}
