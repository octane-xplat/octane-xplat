/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { PressableProps } from '../../props'
import { useInteractionHost } from '../../gestures/host.macos.tsrx'
import { pressOptions } from '../../gestures/semantic-press'
import { InteractionScopeProvider } from '../../gestures/context.tsrx'
import { refList } from '../../internal/accessibility/ref-list'
import { cx } from '@octane-xplat/lib'
import { layoutChildProps } from '../layout/layout-child'

const semanticAction = () => {}

export function Pressable(props: PressableProps): unknown @{
  const bindInput = useInteractionHost({
    ...props,
    gestures: props.disabled ? undefined : props.gestures,
    onPan: props.disabled ? undefined : props.onPan,
    onPinch: props.disabled ? undefined : props.onPinch,
    press: pressOptions(props),
  })

  <masonview
    ref={refList(bindInput, props.ref)}
    {...layoutChildProps(
      props,
      mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, props.style)),
    )}
    id={props.id}
    testID={props.testID}
    accessible={props.accessible}
    className={cx('vx-pressable', props.className)}
    disabled={props.disabled}
    onTap={props.disabled ? undefined : semanticAction}
    onDoubleTap={props.disabled || !props.onDoublePress ? undefined : semanticAction}
    accessibilityLabel={props.accessibilityLabel}
    accessibilityHint={props.accessibilityHint}
    accessibilityValue={props.accessibilityValue}
    accessibilityState={{
      ...props.accessibilityState,
      disabled: props.disabled || props.accessibilityState?.disabled,
    }}
    accessibilityRole={props.accessibilityRole ?? (props.onPress ? 'button' : undefined)}
  >
    <InteractionScopeProvider scope={props.interactionScope}>
      {props.children}
    </InteractionScopeProvider>
  </masonview>
}
