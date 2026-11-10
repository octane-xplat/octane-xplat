/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import { useInteractionHost } from '../../gestures/host.tsrx'
import { InteractionScopeProvider } from '../../gestures/context.tsrx'
import type { ViewProps } from '../../props'
import {
  applyEscapeProps,
  nativeAccessibilityRole,
  nativeAccessibilityState,
} from '../overlays/escape-props'

import { layoutChildProps } from './layout-child'

/** Neutral flex-column container with shared gesture ownership and optional input scope. */
export function View(props: ViewProps): unknown @{
  const bindInput = useInteractionHost(props)
  const forwardedRef = useMemo(
    () =>
      refList(
        (v: any) => {
          if (v) {
            applyEscapeProps(v, props)
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
    {...layoutChildProps(props, mergeStyle({ display: 'flex' }, props.style))}
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
    <InteractionScopeProvider scope={props.interactionScope}>
      {props.children}
    </InteractionScopeProvider>
  </masonview>
}
