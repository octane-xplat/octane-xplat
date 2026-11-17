/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import type { SkeletonProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'

/** Skeleton — placeholder block while content loads. Sizing via
 *  `width`/`height` or the app's `vx-skeleton` styling. */
export function Skeleton(props: SkeletonProps): unknown @{
  <masonview
    ref={(v: any) => void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))}
    id={props.id}
    className={['vx-skeleton', props.className]}
    style={mergeStyle(
      { display: 'flex' },
      { ...styleRecord(props.style), width: props.width, height: props.height },
    )}
  />
}
