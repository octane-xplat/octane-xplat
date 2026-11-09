/** @jsxImportSource @octane-xplat/jsx */
import type { View } from '@nativescript/core'
import './List.windows.css'
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { ListProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import {
  applyEscapeProps,
  nativeAccessibilityRole,
  nativeAccessibilityState,
} from '../overlays/escape-props'

import { toChildArray, mapChildren } from '../../internal/rendering/child-array'
import { ListProvider } from './list-context'

/** A nonvirtualized Windows list with marker/divider rows and shared density
 * context. The row content stretches automatic-width children across the
 * available width, matching a block list item's layout behavior.
 * @example
 * import { List, ListItem } from '@octane-xplat/ui'
 * <List><ListItem label="Inbox" /></List>
 */
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
      <label
        className={cx('vx-listmarker', 'vx-list-marker--number')}
        text={`${start + index}.`}
      />
    ) : listStyle === 'disc' ? (
      <masonview
        className="vx-listmarker"
        style={{ display: 'flex' }}
      >
        <masonview className="vx-listmarker-dot" style={{ display: 'flex' }} />
      </masonview>
    ) : listStyle === 'circle' ? (
      <masonview
        className="vx-listmarker"
        style={{ display: 'flex' }}
      >
        <masonview className="vx-listmarker-circle" style={{ display: 'flex' }} />
      </masonview>
    ) : null

  const forwardedRef = useMemo(
    () =>
      refList((v: View | null) => {
        if (v) {
          applyEscapeProps(v, props)
        }
      }, props.ref),
    [props.ref, props.ios, props.android, props.web],
  )

  <ListProvider value={contextValue}>
    <masonview
      id={props.id}
      ref={forwardedRef}
      className={cx(
        'vx-list',
        `vx-list--density-${density}`,
        props.hasDividers && 'vx-list--dividers',
        props.className,
      )}
      style={mergeStyle({ display: 'flex' }, props.style)}
      accessible={props.accessible}
      accessibilityLabel={props.accessibilityLabel}
      accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
      accessibilityHint={props.accessibilityHint}
      accessibilityValue={props.accessibilityValue}
      accessibilityState={nativeAccessibilityState(props.accessibilityState)}
      accessibilityLiveRegion={props.accessibilityLiveRegion}
    >
      {props.header != null ? (
        <masonview className="vx-list-header" style={{ display: 'flex' }}>
          {props.header}
        </masonview>
      ) : null}
      {mapChildren(items, (child: any, index: number) => (
        <masonview
          className={cx(
            'vx-list-row',
            props.hasDividers && index < items.length - 1 && 'vx-list-row--divider',
          )}
          style={mergeStyle({ flexDirection: 'row', alignItems: 'stretch' }, { display: 'flex' })}
        >
          {markerFor(index)}
          <masonview
            className="vx-list-row-content--windows"
            style={mergeStyle({ flexGrow: 1 }, mergeStyle({ display: 'flex' }, { minWidth: 0 }))}
          >
            {child}
          </masonview>
        </masonview>
      ))}
    </masonview>
  </ListProvider>
}
