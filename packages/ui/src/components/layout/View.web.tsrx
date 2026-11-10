/** @jsxImportSource @octane-xplat/jsx/dom */
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import { useInteractionHost } from '../../gestures/host.web.tsrx'
import { InteractionScopeProvider } from '../../gestures/context.tsrx'
import type { ViewProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { layoutChildProps } from './layout-child.web'
import type { JSX } from 'octane/jsx-runtime'

/** Neutral flex-column container with shared gesture ownership and optional input scope. */
export function View(props: ViewProps): JSX.Element @{
  const bindInput = useInteractionHost(props)

  const forwardedRef = useMemo(
    () =>
      refList(
        (e: any) => {
          if (e) {
            applyEscapeProps(e, props)
          }
        },
        bindInput,
        props.ref,
      ),
    [bindInput, props.ref, props.ios, props.android, props.web],
  )

  <div
    id={props.id}
    data-testid={props.testID}
    ref={forwardedRef}
    className={['vx-view', props.className]}
    {...layoutChildProps(props, props.style)}
    role={props.accessibilityRole}
    aria-label={props.accessibilityLabel}
    aria-hidden={props.accessible === false ? true : undefined}
    aria-description={props.accessibilityHint}
    aria-valuetext={props.accessibilityValue}
    aria-disabled={props.accessibilityState?.disabled}
    aria-selected={props.accessibilityState?.selected}
    aria-checked={props.accessibilityState?.checked}
    aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
  >
    <InteractionScopeProvider scope={props.interactionScope}>
      {props.children}
    </InteractionScopeProvider>
  </div>
}
