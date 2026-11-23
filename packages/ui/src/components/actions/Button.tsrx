/** @jsxImportSource @octane-xplat/jsx */
import { Utils } from '@nativescript/core'
import { TextSlot } from '../forms/text-slot.tsrx'
import type { ButtonProps } from '../../props'
import { Pressable } from './Pressable.tsrx'
import { ActivityIndicator } from '../feedback/ActivityIndicator.tsrx'
import { Icon } from '../media/Icon.tsrx'
import { useInputGroup } from '../forms/input-group-context'
import { useButtonGroup } from './button-group-context'
import { useSize } from '../layout/size-context'
import { sanitizeUrl } from '../../routing/safe-url'
import { useButtonLoading } from './use-button-loading.tsrx'
import { useTranslator } from '../../internal/platform/internationalization'
import { useButtonAction } from './use-button-action.tsrx'

/** Self-drawn button — Pressable row with optional icon/label/end content
 *  and a loading state that preserves focus and blocks repeat presses. Props follow the shared action vocabulary (`label`, `variant`, `size`,
 *  `isDisabled`, `isLoading`, `icon`, `isIconOnly`, `endContent`,
 *  `elevation`, `href`, `pressAction`, `isInterruptible`); `href` opens the
 *  platform browser — touch targets have no link-preview semantics.
 *  Inside a ButtonGroup the group supplies size/disabled and a position
 *  class for the connected edge treatment. */
export function Button(props: ButtonProps): unknown @{
  const group = useButtonGroup()
  const inputGroup = useInputGroup()
  const groupDisabled = Boolean(group?.isDisabled || inputGroup?.isDisabled)
  const t = useTranslator()
  const { pending: actionPending, press: runPress } = useButtonAction(
    props,
    groupDisabled,
    (href) => {
      const url = sanitizeUrl(href)

      if (url != null) {
        Utils.openUrl(url)
      }
    },
  )

  const busy = !!(props.isLoading || actionPending)
  const isDisabled = !!(props.isDisabled || groupDisabled)
  const disabled = !!(isDisabled || (busy && !props.isInterruptible))
  const loading = useButtonLoading(actionPending, props.isLoading, props.isInterruptible)
  const size = useSize(props.size ?? group?.size ?? inputGroup?.size, 'md')
  const icon =
    typeof props.icon === 'string' ? (
      <Icon name={props.icon} size={size === 'lg' ? 20 : 16} />
    ) : (
      props.icon
    )
  const children =
    props.children == null ? null : (
      <TextSlot className="vx-button-label">{props.children}</TextSlot>
    )

  const labelEl =
    props.label != null ? <label className="vx-button-label" text={props.label} /> : null

  // Mirror the web leaf: busy keeps the content laid out but hidden under a
  // centred spinner overlay (vx-button-content--hidden + vx-button-spinner),
  // so size and accessible name are preserved.
  const content = props.isIconOnly ? (
    (icon ?? children ?? labelEl)
  ) : (
    <>
      {icon}
      {children ?? labelEl}
      {props.endContent}
    </>
  )

  <Pressable
    {...props}
    disabled={isDisabled}
    onDoublePress={disabled ? undefined : props.onDoublePress}
    onLongPress={disabled ? undefined : props.onLongPress}
    onPressIn={disabled ? undefined : props.onPressIn}
    onPressOut={disabled ? undefined : props.onPressOut}
    gestures={disabled ? undefined : props.gestures}
    onPan={disabled ? undefined : props.onPan}
    onPinch={disabled ? undefined : props.onPinch}
    onPress={runPress}
    className={[
      'vx-button',
      `vx-button--${props.variant ?? 'secondary'}`,
      size && `vx-button--size-${size}`,
      !group &&
        !inputGroup &&
        props.elevation &&
        props.elevation !== 'none' &&
        `vx-button--elev-${props.elevation}`,
      props.isIconOnly && 'vx-button--icon',
      inputGroup && !group && 'vx-button--input-addon',
      loading && 'vx-button--loading',
      isDisabled && 'vx-button--disabled',
      group && `vx-button--group-${group.position}`,
      props.className,
    ]}
    accessibilityRole={props.accessibilityRole ?? 'button'}
    accessibilityLabel={
      props.accessibilityLabel ??
      (props.isIconOnly || busy || props.children != null ? props.label : undefined) ??
      (loading && (typeof props.children === 'string' || typeof props.children === 'number')
        ? String(props.children)
        : undefined)
    }
    accessibilityState={{
      ...props.accessibilityState,
      busy: busy || props.accessibilityState?.busy,
    }}
    accessibilityValue={
      props.accessibilityValue ?? (busy ? t('@astryx.button.loading') : undefined)
    }
  >
    @if (loading) {
      <masonview className="vx-button-spinner" accessible={false}>
        <ActivityIndicator style={{ width: 14, height: 14 }} />
      </masonview>
    }
    <masonview className={['vx-button-content', loading && 'vx-button-content--hidden']}>
      {content}
    </masonview>
  </Pressable>
}
