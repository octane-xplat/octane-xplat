/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { ListProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'
import { toChildArray, mapChildren } from '../../internal/rendering/child-array'
import { ListProvider } from './list-context'

/** List — column of rows; markers/dividers are drawn on the per-child
 *  wrapper row (no CSS counters on this target). */
export function List(props: ListProps): unknown @{
  const listStyle = props.listStyle ?? 'none'
  const density = props.density ?? 'balanced'
  const items = toChildArray(props.children)
  const start = props.start ?? 1
  const contextValue = {
    density,
    hasDividers: props.hasDividers === true,
    listStyle,
    edgeCompensation: props.edgeCompensation,
    start,
  }

  const markerFor = (index: number) =>
    listStyle === 'decimal' ? (
      <label className={['vx-listmarker', 'vx-list-marker--number']} text={`${start + index}.`} />
    ) : listStyle === 'disc' ? (
      <masonview className="vx-listmarker" style={{ display: 'flex' }}>
        <masonview className="vx-listmarker-dot" style={{ display: 'flex' }} />
      </masonview>
    ) : listStyle === 'circle' ? (
      <masonview className="vx-listmarker" style={{ display: 'flex' }}>
        <masonview className="vx-listmarker-circle" style={{ display: 'flex' }} />
      </masonview>
    ) : null

  const forwardedRef = useMemo(
    () =>
      refList((v: any) => {
        if (v) {
          void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))
        }
      }, props.ref),
    [props.ref, props.ios, props.android, props.web],
  )

  <ListProvider value={contextValue}>
    <masonview
      id={props.id}
      ref={forwardedRef}
      className={[
        'vx-list',
        `vx-list--density-${density}`,
        props.hasDividers && 'vx-list--dividers',
        props.className,
      ]}
      style={mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, props.style))}
      accessibilityLabel={props.accessibilityLabel}
    >
      @if (props.header != null) {
        <masonview className="vx-list-header">
          {props.header}
        </masonview>
      }
      {mapChildren(items, (child: any, index: number) => (
        <masonview
          className={[
            'vx-list-row',
            props.hasDividers && index < items.length - 1 && 'vx-list-row--divider',
          ]}
          style={mergeStyle({ flexDirection: 'row', alignItems: 'stretch' }, { display: 'flex' })}
        >
          {markerFor(index)}
          <masonview className="vx-list-content" style={{ flexGrow: 1, minWidth: 0 }}>
            {child}
          </masonview>
        </masonview>
      ))}
    </masonview>
  </ListProvider>
}
