/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import { useInteractionHost } from '../../gestures/host.tsrx'
import { InteractionScopeProvider } from '../../gestures/context.tsrx'
import type { RowProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'
import { nativeAccessibilityRole, nativeAccessibilityState } from '../../internal/accessibility/native-accessibility'

import { layoutChildProps } from './layout-child'

export function Row(props: RowProps): unknown @{
  const bindInput = useInteractionHost(props)
  const forwardedRef = useMemo(
    () =>
      refList(
        (v: any) => {
          if (v) {
            void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))
          }
        },
        bindInput,
        props.ref,
      ),
    [bindInput, props.ref, props.ios, props.android, props.web],
  )

  <masonview
    id={props.id}
    testID={props.testID ?? ''}
    ref={forwardedRef}
    className={['vx-row', props.className]}
    {...layoutChildProps(props, mergeStyle({ display: 'flex' }, props.style))}
    accessible={props.accessible}
    accessibilityLabel={props.accessibilityLabel}
    accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
    accessibilityHint={props.accessibilityHint}
    accessibilityValue={props.accessibilityValue}
    accessibilityState={nativeAccessibilityState(props.accessibilityState)}
    accessibilityLiveRegion={props.accessibilityLiveRegion}
  >
    <InteractionScopeProvider scope={props.interactionScope}>
      {props.children}
    </InteractionScopeProvider>
  </masonview>
}
