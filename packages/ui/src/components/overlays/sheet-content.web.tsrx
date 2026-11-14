/** @jsxImportSource @octane-xplat/jsx/dom */
import type { Renderable } from '../../props'
import type { JSX } from 'octane/jsx-runtime'

/** A keyed identity boundary with neutral flow for one panel's editing state. */
export function SheetContent(props: {
  key?: string | null
  children?: Renderable
}): JSX.Element @{
  <div className="vx-sheet-content">{props.children}</div>
}
