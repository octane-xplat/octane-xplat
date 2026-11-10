/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useInteractionHost } from '../../gestures/host.macos.tsrx'
import { InteractionScopeProvider } from '../../gestures/context.tsrx'
import type { RowProps } from '../../props'
import { refList } from '../../internal/accessibility/ref-list'
import { cx } from '@octane-xplat/lib'
import { layoutChildProps } from './layout-child'

export function Row(props: RowProps): unknown @{
  const bindInput = useInteractionHost(props)

  <masonview
    id={props.id}
    ref={refList(bindInput, props.ref)}
    {...layoutChildProps(
      props,
      mergeStyle(
        {
          flexDirection: 'row',
          alignItems: props.alignItems,
          justifyContent: props.justifyContent,
          flexWrap: props.flexWrap,
          gap: props.gap,
        },
        mergeStyle({ display: 'flex' }, props.style),
      ),
    )}
    className={cx(props.className)}
    accessible={props.accessible}
    accessibilityLabel={props.accessibilityLabel}
    accessibilityRole={props.accessibilityRole}
    accessibilityHint={props.accessibilityHint}
    accessibilityValue={props.accessibilityValue}
    accessibilityState={props.accessibilityState}
  >
    <InteractionScopeProvider scope={props.interactionScope}>
      {props.children}
    </InteractionScopeProvider>
  </masonview>
}
