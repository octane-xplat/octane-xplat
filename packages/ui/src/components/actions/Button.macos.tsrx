/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useLayoutEffect, useMemo, useRef } from 'octane'
import type { NSView } from '@octane-xplat/platform/macos'
import { openUrl } from '@octane-xplat/platform'
import { cx } from '@octane-xplat/lib'
import type { ButtonProps } from '../../props'
import { Pressable } from './Pressable.macos.tsrx'
import { TextSlot } from '../forms/text-slot.tsrx'
import { ActivityIndicator } from '../feedback/ActivityIndicator.macos.tsrx'
import { Icon } from '../media/Icon.macos.tsrx'
import { useButtonGroup } from './button-group-context'
import { useSize } from '../layout/size-context'
import { mergeStyle } from '../../internal/layout/style-merge'
import { sanitizeUrl } from '../../routing/safe-url'
import { useButtonAction } from './use-button-action.tsrx'
import { refList } from '../../internal/accessibility/ref-list'

export function Button(props: ButtonProps): unknown @{
  const group = useButtonGroup()
  const size = useSize(props.size ?? group?.size, 'md')
  const { pending, press } = useButtonAction(props, Boolean(group?.isDisabled), (href) => {
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
  const isDisabled = Boolean(props.isDisabled || group?.isDisabled)
  const disabled = isDisabled || (busy && !props.isInterruptible)
  const icon = typeof props.icon === 'string' ? <Icon name={props.icon} /> : props.icon
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
    disabled={disabled}
    onPress={press}
    className={cx(
      'vx-button',
      `vx-button--${props.variant ?? 'secondary'}`,
      `vx-button--size-${size}`,
      group && `vx-button--group-${group.position}`,
      props.isIconOnly && 'vx-button--icon',
      props.elevation && props.elevation !== 'none' && `vx-button--elev-${props.elevation}`,
      busy && 'vx-button--loading',
      isDisabled && 'vx-button--disabled',
      props.className,
    )}
    style={mergeStyle(
      busy ? { display: 'grid', gridTemplateRows: '1fr', gridTemplateColumns: '1fr' } : {},
      props.style,
    )}
    accessibilityRole={props.accessibilityRole ?? 'button'}
    accessibilityLabel={
      props.accessibilityLabel ?? (props.isIconOnly || busy ? props.label : undefined)
    }
    accessibilityState={{ ...props.accessibilityState, busy: busy || undefined }}
    accessibilityValue={props.accessibilityValue ?? (busy ? 'Loading' : undefined)}
  >
    <masonview
      className={cx('vx-button-content', busy && 'vx-button-content--hidden')}
      style={
        busy
          ? { gridRow: '1', gridColumn: '1', justifySelf: 'stretch', alignSelf: 'stretch' }
          : undefined
      }
    >
      {content}
    </masonview>
    {busy ? (
      <masonview
        className="vx-button-spinner"
        accessible={false}
        style={{ gridRow: '1', gridColumn: '1', justifySelf: 'center', alignSelf: 'center' }}
      >
        <ActivityIndicator />
      </masonview>
    ) : null}
  </Pressable>
}
