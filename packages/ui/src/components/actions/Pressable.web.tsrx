/** @jsxImportSource @octane-xplat/jsx/dom */
import { useMemo } from 'octane'
import { styleRecord } from '../../internal/layout/style-merge'
import { refList } from '../../internal/accessibility/ref-list'
import type { PressableProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { layoutChildProps } from '../layout/layout-child.web'
import { useInteractionHost } from '../../gestures/host.web.tsrx'
import { pressOptions } from '../../gestures/press-options'
import { InteractionScopeProvider } from '../../gestures/context.tsrx'
import type { JSX } from 'octane/jsx-runtime'

/** Internal contract shared with Button — `_nativeButton` renders a real
 *  `<button type="button">` instead of `div[role=button]` so the control gets
 *  native focus/activation/disabled semantics. Not part of the public props;
 *  Button is the only producer. */
export interface PressableInternalProps extends PressableProps {
  _nativeButton?: boolean
  _nativeAnchor?: boolean
  href?: string
  target?: string
}

export function Pressable(props: PressableProps): JSX.Element @{
  const internal = props as PressableInternalProps
  const asButton = internal._nativeButton === true
  const asAnchor = internal._nativeAnchor === true
  const Tag: 'button' | 'a' | 'div' = asButton ? 'button' : asAnchor ? 'a' : 'div'
  const bindInput = useInteractionHost({
    ...props,
    gestures: props.disabled ? undefined : props.gestures,
    onPan: props.disabled ? undefined : props.onPan,
    onPinch: props.disabled ? undefined : props.onPinch,
    press: pressOptions(props),
  })

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

  <Tag
    ref={forwardedRef}
    type={asButton ? 'button' : undefined}
    href={asAnchor ? internal.href : undefined}
    target={asAnchor ? internal.target : undefined}
    rel={asAnchor && internal.target === '_blank' ? 'noreferrer' : undefined}
    disabled={asButton && props.disabled ? true : undefined}
    id={props.id}
    data-testid={props.testID}
    className={['vx-pressable', props.className]}
    {...layoutChildProps(props, {
      ...styleRecord(props.style),
      ...(props.hitSlop ? { margin: -props.hitSlop, padding: props.hitSlop } : {}),
    })}
    role={asButton || asAnchor ? undefined : (props.accessibilityRole ?? 'button')}
    aria-label={props.accessibilityLabel}
    aria-description={props.accessibilityHint}
    aria-valuetext={props.accessibilityValue}
    aria-busy={props.accessibilityState?.busy || undefined}
    aria-disabled={props.accessibilityState?.disabled || (!asButton && props.disabled) || undefined}
    aria-selected={props.accessibilityState?.selected}
    aria-checked={props.accessibilityState?.checked}
    aria-pressed={props.accessibilityState?.pressed}
    aria-expanded={props.accessibilityState?.expanded}
    aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
    aria-hidden={props.accessible === false ? true : undefined}
    tabIndex={
      asAnchor
        ? props.disabled
          ? -1
          : undefined
        : asButton
          ? undefined
          : props.onPress && !props.disabled && props.accessible !== false
            ? 0
            : -1
    }
  >
    <InteractionScopeProvider scope={props.interactionScope}>
      {props.children}
    </InteractionScopeProvider>
  </Tag>
}
