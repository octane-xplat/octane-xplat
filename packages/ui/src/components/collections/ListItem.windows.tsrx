/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import type { View } from '@nativescript/core'
import { Pressable } from '../actions/Pressable.tsrx'
import { TextSlot } from '../forms/text-slot.tsrx'
import { refList } from '../../internal/accessibility/ref-list'
import type { ListItemProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import {
  applyEscapeProps,
  nativeAccessibilityRole,
  nativeAccessibilityState,
} from '../overlays/escape-props'

import { useListContext } from './list-context'
import { followHref } from '../navigation/nav-href'

interface DelegateTarget {
  notify?(event?: any): void
  click?(): void
  focus?(): void
}

/** Windows row content with the existing measured native action peer.
 * List/ListItem structural UIA roles remain a separate qualification gate. */
export function ListItem(props: ListItemProps): unknown @{
  const ctx = useListContext()
  const interactive = props.onPress != null || props.href != null
  const density = ctx.density

  const activate = () => {
    if (props.isDisabled) {
      return
    }

    if (props.onPress != null) {
      props.onPress()
      return
    }

    if (props.delegateRef?.current != null) {
      const target = props.delegateRef.current as DelegateTarget
      target.notify?.({ eventName: 'tap', object: target })
      target.click?.()
      target.focus?.()
      return
    }

    if (props.href != null) {
      followHref(props.href)
    }
  }

  const forwardedRef = useMemo(
    () =>
      refList(
        (v: View | null) => {
          if (v) {
            applyEscapeProps(v, props)
          }
        },
        ...refList(props.ref),
      ),
    [props.ref, props.ios, props.android, props.web],
  )

  const rootProps = {
    id: props.id,
    className: cx(
      'vx-listitem',
      `vx-listitem--density-${density}`,
      interactive && 'vx-listitem--interactive',
      props.isDisabled && 'vx-listitem--disabled',
      props.isSelected && 'vx-listitem--selected',
      props.className,
    ),
    style: mergeStyle({ display: 'flex' }, props.style),
    accessibilityHint: props.accessibilityHint,
    accessibilityValue: props.accessibilityValue,
    accessibilityLiveRegion: props.accessibilityLiveRegion,
  }

  const state = { disabled: props.isDisabled, selected: props.isSelected }
  const content = (
    <>
      @if (props.startContent != null) {
        <masonview className="vx-listitem-start" style={{ display: 'flex' }}>
          <TextSlot>{props.startContent}</TextSlot>
        </masonview>
      }
      <masonview
        className="vx-listitem-body"
        style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}
      >
        <TextSlot className="vx-listitem-label">{props.label}</TextSlot>
        @if (props.description != null) {
          <TextSlot className="vx-listitem-desc">{props.description}</TextSlot>
        }
        <TextSlot>{props.children}</TextSlot>
      </masonview>
      @if (props.endContent != null) {
        <masonview className="vx-listitem-end" style={{ display: 'flex' }}>
          <TextSlot>{props.endContent}</TextSlot>
        </masonview>
      }
    </>
  )

  @if (interactive) {
    <Pressable
      ref={forwardedRef}
      {...rootProps}
      disabled={props.isDisabled}
      onPress={activate}
      accessible={props.accessible ?? true}
      accessibilityLabel={
        props.accessibilityLabel ??
        (typeof props.label === 'string' || typeof props.label === 'number'
          ? String(props.label)
          : undefined)
      }
      accessibilityRole={props.accessibilityRole ?? (props.href != null ? 'link' : 'button')}
      accessibilityState={state}
    >
      {content}
    </Pressable>
  } @else {
    <masonview
      ref={forwardedRef}
      {...rootProps}
      accessible={props.accessible}
      accessibilityLabel={props.accessibilityLabel}
      accessibilityRole={nativeAccessibilityRole(props.accessibilityRole ?? 'text')}
      accessibilityState={nativeAccessibilityState(state)}
    >
      {content}
    </masonview>
  }
}
