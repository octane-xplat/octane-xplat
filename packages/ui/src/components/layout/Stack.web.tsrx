/** @jsxImportSource @octane-xplat/jsx/dom */
import { useMemo } from 'octane'
import { styleRecord } from '../../internal/layout/style-merge'
import { refList } from '../../internal/accessibility/ref-list'
import { useInteractionHost } from '../../gestures/host.web.tsrx'
import { InteractionScopeProvider } from '../../gestures/context.tsrx'
import type { StackProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { applyWebProps } from '../../internal/platform/platformProps.web'
import { resolveStackLayout, stackWebStyle } from './stack-layout'
import type { JSX } from 'octane/jsx-runtime'

/** Astryx flow Stack — flex container in `direction`, `hAlign`/`vAlign`
 *  mapped to main/cross axes, spacing-step gap/padding. Children that need
 *  to overlap belong in `Absolute` instead. */
export function Stack(props: StackProps): JSX.Element @{
  const bindInput = useInteractionHost({ ...props, viewport: Boolean(props.isScrollable) })
  const layout = resolveStackLayout(props)
  const Tag: any = props.as ?? 'div'

  const forwardedRef = useMemo(
    () =>
      refList(
        (e: any) => {
          if (e) {
            applyEscapeProps(e, props)
            applyWebProps(e, props.web)
          }
        },
        bindInput,
        props.ref,
      ),
    [bindInput, props.ref, props.ios, props.android, props.web],
  )

  <Tag
    id={props.id}
    data-testid={props.testID}
    ref={forwardedRef}
    className={['vx-stack', props.isScrollable ? 'vx-stack--scroll' : undefined, props.className]}
    style={{
      flexDirection: layout.flexDirection,
      justifyContent: layout.justifyContent,
      alignItems: layout.alignItems,
      ...stackWebStyle(layout, props),
      ...styleRecord(props.style),
    }}
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
  </Tag>
}
