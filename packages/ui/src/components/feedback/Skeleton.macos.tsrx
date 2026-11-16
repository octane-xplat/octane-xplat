/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import type { SkeletonProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'

/** Skeleton — placeholder block while content loads. Sizing via
 *  `width`/`height` or the app's `vx-skeleton` styling. */
export function Skeleton(props: SkeletonProps): unknown @{
  <masonview
    ref={(v: any) => applyEscapeProps(v, props)}
    id={props.id}
    className={['vx-skeleton', props.className]}
    style={mergeStyle(
      { display: 'flex' },
      { ...styleRecord(props.style), width: props.width, height: props.height },
    )}
  />
}
