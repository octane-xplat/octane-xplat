/** @jsxImportSource @octane-xplat/jsx */
import type { View } from '@nativescript/core'
import type { BadgeProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'
import { TextSlot } from '../forms/text-slot.tsrx'

/** Badge — native text hosts preserve primitive children, including zero. */
export function Badge(props: BadgeProps): unknown @{
  <masonview
    ref={(view: View | null) => void (prepareUIHost(view), applyEscapeProps(view, props), applyUIHostModifiers(view, props))}
    id={props.id}
    className={['vx-badge', `vx-badge--${props.variant ?? 'neutral'}`, props.className]}
    style={props.style}
  >
    <TextSlot>{props.children ?? props.label}</TextSlot>
  </masonview>
}
