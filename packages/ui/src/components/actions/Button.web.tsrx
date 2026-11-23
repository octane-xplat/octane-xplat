/** @jsxImportSource @octane-xplat/jsx/dom */
import type { ButtonProps } from '../../props'
import { Pressable, type PressableInternalProps } from './Pressable.web.tsrx'
import { VisuallyHidden } from '../content/VisuallyHidden.web.tsrx'
import { Icon } from '../media/Icon.web.tsrx'
import { useInputGroup } from '../forms/input-group-context'
import { useButtonGroup } from './button-group-context'
import { useSize } from '../layout/size-context'
import { sanitizeUrl } from '../../routing/safe-url'
import { useButtonLoading } from './use-button-loading.tsrx'
import { useTranslator } from '../../internal/platform/internationalization'
import { useButtonAction } from './use-button-action.tsrx'
import { useEffect, useLayoutEffect, useMemo, useState } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import { useTooltip } from '../overlays/Tooltip.web.tsrx'
import type { JSX } from 'octane/jsx-runtime'

/** Self-drawn button — Pressable row with optional icon/label/end content
 *  and a loading state that preserves focus and blocks repeat presses. Props follow the shared action vocabulary (`label`, `variant`, `size`,
 *  `isDisabled`, `isLoading`, `icon`, `isIconOnly`, `endContent`,
 *  `elevation`, `tooltip`, `href`, `pressAction`, `isInterruptible`);
 *  `href` renders a real anchor so link semantics (new tab, copy link)
 *  stay intact. Inside a ButtonGroup the group supplies size/disabled and a
 *  position class for the connected edge treatment. */
export function Button(props: ButtonProps): JSX.Element @{
  const group = useButtonGroup()
  const inputGroup = useInputGroup()
  const groupDisabled = Boolean(group?.isDisabled || inputGroup?.isDisabled)
  const t = useTranslator()
  // Server markup has no press guard yet. Avoid native submit/reset until
  // hydration attaches the guard, then keep the type stable through actions.
  const [mounted, setMounted] = useState(false)
  useLayoutEffect(() => {
    if (props.web?.type === 'submit' || props.web?.type === 'reset') {
      setMounted(true)
    }
  }, [props.web?.type])

  const [statusReady, setStatusReady] = useState(() => !props.isLoading)

  useEffect(() => {
    if (statusReady) {
      return
    }

    const frame = requestAnimationFrame(() => setStatusReady(true))

    return () => cancelAnimationFrame(frame)
  }, [statusReady])
  const { pending: actionPending, press: runPress } = useButtonAction(props, groupDisabled)

  const busy = !!(props.isLoading || actionPending)
  const isDisabled = !!(props.isDisabled || groupDisabled)
  const disabled = !!(isDisabled || (busy && !props.isInterruptible))
  // Busy controls keep keyboard focus. Disabled controls with a tooltip stay
  // focusable so the keyboard can still reach the tooltip.
  const useAriaDisabled = disabled && (!isDisabled || props.tooltip != null)
  const loading = useButtonLoading(actionPending, props.isLoading, props.isInterruptible)
  const size = useSize(props.size ?? group?.size ?? inputGroup?.size, 'md')
  const icon =
    typeof props.icon === 'string' ? (
      <Icon name={props.icon} size={size === 'lg' ? 20 : 16} />
    ) : (
      props.icon
    )

  const accessibleName =
    props.accessibilityLabel ??
    (props.isIconOnly || loading || (props.children != null && props.children !== props.label)
      ? props.label
      : undefined)
  const tooltip = useTooltip({ content: props.tooltip, disabled: props.tooltip == null }, true)
  const ref = useMemo(
    () => refList(props.ref, props.tooltip == null ? undefined : tooltip.bindAnchor),
    [props.ref, props.tooltip, tooltip.bindAnchor],
  )

  const content = (
    <>
      @if (loading) {
        <span className="vx-button-spinner" aria-hidden="true">
          <svg width="14" height="14" className="vx-button-spinner-svg">
            <circle
              cx="50%"
              cy="50%"
              r="5"
              strokeWidth="2"
              className="vx-button-spinner-track"
            />
            <circle
              cx="50%"
              cy="50%"
              r="5"
              strokeWidth="2"
              strokeDasharray="11.78 19.63"
              className="vx-button-spinner-arc"
            />
          </svg>
        </span>
      }
      <span
        className={['vx-button-content', loading && 'vx-button-content--hidden']}
        aria-hidden={loading && accessibleName != null ? true : undefined}
      >
        @if (icon != null) {
          <span className="vx-button-leading">{icon}</span>
        } @else if (props.isIconOnly) {
          <span className="vx-button-label">{props.children ?? props.label}</span>
        }
        @if (!props.isIconOnly) {
          <span className="vx-button-label">{props.children ?? props.label}</span>
        }
        @if (!props.isIconOnly && props.endContent != null) {
          <span className="vx-button-trailing">{props.endContent}</span>
        }
      </span>
    </>
  )

  const cls = [
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
  ]

  const href = props.href != null ? sanitizeUrl(props.href) : null
  const asLink = href != null && !isDisabled
  const { type, name, value, form, rel, describedBy, web } = useMemo(() => {
    const {
      type,
      name,
      value,
      form,
      rel,
      'aria-describedby': describedBy,
      ...web
    } = props.web ?? {}

    return { type, name, value, form, rel, describedBy, web }
  }, [props.web])
  const descriptionIds = [
    typeof describedBy === 'string' ? describedBy : undefined,
    props.tooltip?.trim() !== (accessibleName ?? props.label)?.trim()
      ? tooltip.descriptionId
      : undefined,
  ]
    .filter(Boolean)
    .join(' ')
  const pressableProps: PressableInternalProps = {
    ...props,
    _nativeButton: !asLink,
    _nativeAnchor: asLink,
    href: asLink ? href : undefined,
    _describedBy: descriptionIds || undefined,
    _buttonType: mounted || !disabled ? type : undefined,
    _buttonName: !isDisabled ? name : undefined,
    _buttonValue: value,
    _buttonForm: form,
    _anchorRel: rel,
    web,
  }

  <>
    <Pressable
      {...pressableProps}
      ref={ref}
      disabled={useAriaDisabled ? false : disabled}
      onPress={runPress}
      gestures={disabled ? undefined : props.gestures}
      onPan={disabled ? undefined : props.onPan}
      onPinch={disabled ? undefined : props.onPinch}
      className={cls}
      accessibilityRole={props.accessibilityRole ?? (asLink ? 'link' : 'button')}
      accessibilityLabel={accessibleName}
      accessibilityState={{
        ...props.accessibilityState,
        busy: busy || props.accessibilityState?.busy,
        disabled: useAriaDisabled || props.accessibilityState?.disabled,
      }}
    >
      {content}
    </Pressable>
    <VisuallyHidden accessibilityRole="status" accessibilityLiveRegion="polite">
      {busy && statusReady ? t('@astryx.button.loading') : null}
    </VisuallyHidden>
    {tooltip.panel}
  </>
}
