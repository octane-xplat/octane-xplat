/** @jsxImportSource @octane-xplat/jsx */
import { Utils } from '@nativescript/core'
import { TextSlot } from '../forms/text-slot.tsrx'
import type { ButtonProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { Pressable } from './Pressable.tsrx'
import { ActivityIndicator } from '../feedback/ActivityIndicator.tsrx'
import { Icon } from '../media/Icon.tsrx'
import { useButtonGroup } from './button-group-context'
import { useSize } from '../layout/size-context'
import { sanitizeUrl } from '../../routing/safe-url'
import { mergeStyle } from '../../internal/layout/style-merge'
import { useButtonAction } from './use-button-action.tsrx'

/** Self-drawn button — Pressable row with optional icon/label/end content
 *  and a loading state that swaps content for the spinner and blocks
 *  presses. Props follow the shared action vocabulary (`label`, `variant`, `size`,
 *  `isDisabled`, `isLoading`, `icon`, `isIconOnly`, `endContent`,
 *  `elevation`, `href`, `pressAction`, `isInterruptible`); `href` opens the
 *  platform browser — touch targets have no link-preview semantics.
 *  Inside a ButtonGroup the group supplies size/disabled and a position
 *  class for the connected edge treatment. */
export function Button(props: ButtonProps): unknown @{
  const group = useButtonGroup()
  const { pending: actionPending, press: runPress } = useButtonAction(
    props,
    Boolean(group?.isDisabled),
    (href) => {
      const url = sanitizeUrl(href)

      if (url != null) {
        Utils.openUrl(url)
      }
    },
  )

  // Mirror the web leaf: busy (isLoading or in-flight action) disables unless
  // interruptible, and reports the busy accessibility state.
  const busy = !!(props.isLoading || actionPending)
  const isDisabled = !!(props.isDisabled || group?.isDisabled)
  const disabled = !!(isDisabled || (busy && !props.isInterruptible))
  const loading = busy
  const size = useSize(props.size ?? group?.size, 'md')
  const icon = typeof props.icon === 'string' ? <Icon name={props.icon} /> : props.icon
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
    disabled={disabled}
    onPress={runPress}
    // Busy stacks content and spinner in one grid cell on native (Mason
    // grid children share cell 1,1); web overlays via vx-button-spinner.
    style={mergeStyle(
      loading ? { display: 'grid', gridTemplateRows: '1fr', gridTemplateColumns: '1fr' } : {},
      props.style,
    )}
    className={cx(
      'vx-button',
      `vx-button--${props.variant ?? 'secondary'}`,
      size && `vx-button--size-${size}`,
      props.elevation && props.elevation !== 'none' && `vx-button--elev-${props.elevation}`,
      props.isIconOnly && 'vx-button--icon',
      loading && 'vx-button--loading',
      isDisabled && 'vx-button--disabled',
      group && `vx-button--group-${group.position}`,
      props.className,
    )}
    accessibilityRole={props.accessibilityRole ?? 'button'}
    accessibilityLabel={
      props.accessibilityLabel ?? (props.isIconOnly || busy ? props.label : undefined)
    }
    accessibilityState={{ ...props.accessibilityState, busy: busy || undefined }}
    accessibilityValue={props.accessibilityValue ?? (busy ? 'Loading' : undefined)}
  >
    <masonview
      className={cx('vx-button-content', loading && 'vx-button-content--hidden')}
      style={
        loading
          ? { gridRow: '1', gridColumn: '1', justifySelf: 'stretch', alignSelf: 'stretch' }
          : undefined
      }
    >
      {content}
    </masonview>
    {loading && (
      <masonview
        className="vx-button-spinner"
        accessible={false}
        style={{ gridRow: '1', gridColumn: '1', justifySelf: 'center', alignSelf: 'center' }}
      >
        <ActivityIndicator />
      </masonview>
    )}
  </Pressable>
}
