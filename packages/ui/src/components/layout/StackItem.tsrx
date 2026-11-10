/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import { useInteractionHost } from '../../gestures/host.tsrx'
import { InteractionScopeProvider } from '../../gestures/context.tsrx'
import type { StackItemProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import {
  applyEscapeProps,
  nativeAccessibilityRole,
  nativeAccessibilityState,
} from '../overlays/escape-props'

import { stackItemStyle } from './stack-layout'

/** StackItem — per-child size (`fill` grows into remaining space) and
 *  cross-axis alignment inside a `Stack`. `isScrollable` hosts the content
 *  in a ScrollView on native (NS layouts can't scroll their own overflow). */
export function StackItem(props: StackItemProps): unknown @{
  const bindInput = useInteractionHost({ ...props, viewport: Boolean(props.isScrollable) })
  const itemStyle = stackItemStyle(props)

  const forwardedRef = useMemo(
    () =>
      refList(
        (v: any) => {
          if (v) {
            applyEscapeProps(v, props)
          }
        },
        bindInput,
        props.ref,
      ),
    [bindInput, props.ref, props.ios, props.android, props.web],
  )

  @if (props.isScrollable) {
    <scrollview
      id={props.id}
      ref={forwardedRef}
      className={cx('vx-stackitem', props.className)}
      style={{ ...itemStyle, ...styleRecord(props.style) }}
      orientation="vertical"
      accessible={props.accessible}
      accessibilityLabel={props.accessibilityLabel}
      accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
      accessibilityHint={props.accessibilityHint}
      accessibilityValue={props.accessibilityValue}
      accessibilityState={nativeAccessibilityState(props.accessibilityState)}
      accessibilityLiveRegion={props.accessibilityLiveRegion}
    >
      <masonview style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}>
        <InteractionScopeProvider scope={props.interactionScope}>
          {props.children}
        </InteractionScopeProvider>
      </masonview>
    </scrollview>
  } @else {
    <masonview
      id={props.id}
      ref={forwardedRef}
      className={cx('vx-stackitem', props.className)}
      style={mergeStyle({ display: 'flex' }, { ...itemStyle, ...styleRecord(props.style) })}
      accessible={props.accessible}
      accessibilityLabel={props.accessibilityLabel}
      accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
      accessibilityHint={props.accessibilityHint}
      accessibilityValue={props.accessibilityValue}
      accessibilityState={nativeAccessibilityState(props.accessibilityState)}
      accessibilityLiveRegion={props.accessibilityLiveRegion}
    >
      <InteractionScopeProvider scope={props.interactionScope}>
        {props.children}
      </InteractionScopeProvider>
    </masonview>
  }
}
