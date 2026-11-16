/** @jsxImportSource @octane-xplat/jsx */
import type { NSView } from '@octane-xplat/platform/macos'
import type { SelectableCardProps } from '../../props'
import { styleRecord } from '../../internal/layout/style-merge'
import { useCallback, useLayoutEffect, useRef } from 'octane'
import { appKitHost } from '../../internal/platform/host-bridge'
import { TextSlot } from '../forms/text-slot.tsrx'

export function SelectableCard(props: SelectableCardProps): unknown @{
  const view = useRef<NSView | null>(null)
  const release = useRef<(() => void) | null>(null)
  const bind = useCallback((target: NSView | null) => {
    const previous = view.current

    release.current?.()
    release.current = null
    view.current = target
    previous?.window?.recalculateKeyViewLoop()
  }, [])

  useLayoutEffect(() => {
    const target = view.current

    if (!target || !props.isDisabled) {
      return
    }

    const retain = appKitHost()?.retainDisabledFocus

    if (typeof retain !== 'function') {
      return
    }

    const dispose = retain(target)

    if (typeof dispose !== 'function') {
      throw new Error('AppKit disabled focus ownership unavailable')
    }

    release.current = dispose
    target.window?.recalculateKeyViewLoop()
    return () => {
      // A ref detach may already have released this claim.
      if (release.current === dispose) {
        release.current = null
        dispose()
      }

      target.window?.recalculateKeyViewLoop()
    }
  }, [props.isDisabled])

  <masonview
    ref={bind}
    id={props.id}
    className={[
      'vx-pressable',
      'vx-card',
      'vx-selectable-card',
      `vx-card--${props.variant ?? 'default'}`,
      props.elevation && `vx-card--elev-${props.elevation}`,
      props.isSelected && 'vx-selectable-card--selected',
      props.isDisabled && 'vx-card--disabled',
      props.className,
    ]}
    style={{
      ...styleRecord(props.style),
      paddingTop: (props.padding ?? 4) * 4,
      paddingRight: (props.padding ?? 4) * 4,
      paddingBottom: (props.padding ?? 4) * 4,
      paddingLeft: (props.padding ?? 4) * 4,
      width: props.width,
      height: props.height,
      maxWidth: props.maxWidth,
    }}
    disabled={props.isDisabled}
    onTap={
      props.isDisabled
        ? undefined
        : () => {
            if (!props.isDisabled) {
              props.onChange(!props.isSelected)
            }
          }
    }
    accessibilityRole="checkbox"
    accessibilityLabel={props.label}
    accessibilityState={{
      checked: props.isSelected,
      selected: props.isSelected,
      disabled: props.isDisabled,
    }}
  >
    <TextSlot>{props.children}</TextSlot>
  </masonview>
}
