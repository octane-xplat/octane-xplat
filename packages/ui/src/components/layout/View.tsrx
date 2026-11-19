/** @jsxImportSource @octane-xplat/jsx */
import { useContext, useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import { useInteractionHost } from '../../gestures/host.tsrx'
import { InteractionScopeContext, interactionScopeOutlet } from '../../gestures/context.tsrx'
import type { ViewProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'
import {
  nativeAccessibilityRole,
  nativeAccessibilityState,
} from '../../internal/accessibility/native-accessibility'

import { layoutChildProps } from './layout-child'

/** Neutral block container with shared gesture ownership and optional input scope. */
export function View(props: ViewProps): unknown @{
  const scopes = useContext(InteractionScopeContext)
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
    {...layoutChildProps(props, props.style)}
    ref={forwardedRef}
    className={['vx-view', props.className]}
    accessible={props.accessible}
    accessibilityLabel={props.accessibilityLabel}
    accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
    accessibilityHint={props.accessibilityHint}
    accessibilityValue={props.accessibilityValue}
    accessibilityState={nativeAccessibilityState(props.accessibilityState)}
    accessibilityLiveRegion={props.accessibilityLiveRegion}
  >
    {interactionScopeOutlet(scopes, props.interactionScope, props.children)}
  </masonview>
}
