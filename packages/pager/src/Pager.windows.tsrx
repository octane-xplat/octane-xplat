/** @jsxImportSource @octane-xplat/jsx */
import { useRef } from 'octane'
import type { PagerProps } from './props'
import { layoutChildProps } from './layout-child'

// Windows leaf — @nativescript-community/ui-pager has no windows target.
// Bounded degrade: pages render in a horizontally scrolling container so all
// content stays reachable; page snapping and onPageChange are not delivered.
export function Pager(props: PagerProps): unknown @{
  const host = useRef<any>(null)

  return (
    <scrollview
      ref={host}
      id={props.id}
      className={props.className}
      style={{ orientation: 'horizontal', ...layoutChildProps(props).style }}
      orientation="horizontal"
    >
      <masonview style={{ display: 'flex', flexDirection: 'row' }}>
        {props.items.length
          ? props.items.map((item: any, index: number) => props.renderItem(item, index))
          : props.renderEmpty?.()}
      </masonview>
    </scrollview>
  )
}
