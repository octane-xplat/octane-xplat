/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { SpacerProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'

/**
 * Flexible empty region that grows to fill spare space in a `Stack`/`HStack`/`VStack`. Import from `@octane-xplat/ui`.
 *
 * @see StackProps.
 */
export function Spacer(props: SpacerProps): unknown @{
  <masonview
    id={props.id}
    ref={(view: any) => void (prepareUIHost(view), applyEscapeProps(view, props), applyUIHostModifiers(view, props))}
    className={['vx-spacer', props.className]}
    style={mergeStyle({ display: 'flex' }, props.style)}
  />
}
