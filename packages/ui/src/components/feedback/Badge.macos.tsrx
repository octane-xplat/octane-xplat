/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { BadgeProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'

/** Badge — inline label chip. Pure composition; `vx-badge` supplies only the
 *  inline-flex row so apps own all visual styling. */
export function Badge(props: BadgeProps): unknown @{
  <masonview
    ref={(v: any) => void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))}
    id={props.id}
    className={['vx-badge', props.className]}
    style={mergeStyle({ display: 'flex', flexDirection: 'row' }, props.style)}
  >
    {typeof props.children === 'string' || typeof props.children === 'number' ? (
      <label className="vx-badge-text">{props.children}</label>
    ) : (
      props.children
    )}
  </masonview>
}
