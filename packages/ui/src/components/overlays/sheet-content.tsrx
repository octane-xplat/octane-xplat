/** @jsxImportSource @octane-xplat/jsx */
import type { Renderable } from '../../props'

/** A keyed identity boundary with neutral flow for one panel's editing state. */
export function SheetContent(props: {
  key?: string | null
  children?: Renderable
}): unknown @{
  <masonview className="vx-sheet-content">{props.children}</masonview>
}
