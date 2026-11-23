/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useLayoutEffect, useMemo, useRef } from 'octane'
import type { NSView } from '@octane-xplat/platform/macos'
import { openUrl } from '@octane-xplat/platform'
import type { ButtonProps } from '../../props'
import { Pressable } from './Pressable.macos.tsrx'
import { TextSlot } from '../forms/text-slot.tsrx'
import { ActivityIndicator } from '../feedback/ActivityIndicator.macos.tsrx'
import { Icon } from '../media/Icon.macos.tsrx'
import { useInputGroup } from '../forms/input-group-context'
import { useButtonGroup } from './button-group-context'
import { useSize } from '../layout/size-context'
import { sanitizeUrl } from '../../routing/safe-url'
import { useButtonLoading } from './use-button-loading.tsrx'
import { useTranslator } from '../../internal/platform/internationalization'
import { useButtonAction } from './use-button-action.tsrx'
import { refList } from '../../internal/accessibility/ref-list'

export function Button(props: ButtonProps): unknown @{
  const group = useButtonGroup()
  const inputGroup = useInputGroup()
  const groupDisabled = Boolean(group?.isDisabled || inputGroup?.isDisabled)
  const t = useTranslator()
  const size = useSize(props.size ?? group?.size ?? inputGroup?.size, 'md')
  const { pending, press } = useButtonAction(props, groupDisabled, (href) => {
    const url = sanitizeUrl(href)

    if (url != null) {
      openUrl(url)
    }
  })

  const host = useRef<NSView | null>(null)

  const live = useRef({ props, group })

  live.current = { props, group }

  const updateTooltip = useCallback(() => {
    const view = host.current,
      text = live.current.props.tooltip ?? null

    // The generated SDK omits NSView.toolTip's documented nil nullability.
    if (view && Reflect.get(view, 'toolTip') !== text) {
      Reflect.set(view, 'toolTip', text)
    }
  }, [])

  // A caller ref may change during an accepted action; only teardown retires it.
  const bind = useCallback(
    (view: NSView | null) => {
      host.current = view
      updateTooltip()
    },
    [updateTooltip],
  )

  const ref = useMemo(() => refList(bind, props.ref), [bind, props.ref])

  useLayoutEffect(() => {
    const view = host.current

    return () => {
      if (view) {
        Reflect.set(view, 'toolTip', null)
      }
    }
  }, [])

  useLayoutEffect(updateTooltip, [props.tooltip])

  const busy = Boolean(props.isLoading || pending)
  const isDisabled = Boolean(props.isDisabled || groupDisabled)
  const loading = useButtonLoading(pending, props.isLoading, props.isInterruptible)
  const disabled = isDisabled || (busy && !props.isInterruptible)
  const icon =
    typeof props.icon === 'string' ? (
      <Icon name={props.icon} size={size === 'lg' ? 20 : 16} />
    ) : (
      props.icon
    )
  const label =
    props.children != null ? (
      <TextSlot className="vx-button-label">{props.children}</TextSlot>
    ) : props.label != null ? (
      <label className="vx-button-label" text={props.label} />
    ) : null

  const content = props.isIconOnly ? (
    (icon ?? label)
  ) : (
    <>
      {icon}
      {label}
      {props.endContent}
    </>
  )

  <Pressable
    {...props}
    ref={ref}
    disabled={isDisabled}
    onDoublePress={disabled ? undefined : props.onDoublePress}
    onLongPress={disabled ? undefined : props.onLongPress}
    onPressIn={disabled ? undefined : props.onPressIn}
    onPressOut={disabled ? undefined : props.onPressOut}
    gestures={disabled ? undefined : props.gestures}
    onPan={disabled ? undefined : props.onPan}
    onPinch={disabled ? undefined : props.onPinch}
    onPress={press}
    className={[
      'vx-button',
      `vx-button--${props.variant ?? 'secondary'}`,
      `vx-button--size-${size}`,
      group && `vx-button--group-${group.position}`,
      props.isIconOnly && 'vx-button--icon',
      inputGroup && !group && 'vx-button--input-addon',
      !group &&
        !inputGroup &&
        props.elevation &&
        props.elevation !== 'none' &&
        `vx-button--elev-${props.elevation}`,
      loading && 'vx-button--loading',
      isDisabled && 'vx-button--disabled',
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
