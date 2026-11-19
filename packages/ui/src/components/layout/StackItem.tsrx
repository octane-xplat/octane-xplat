/** @jsxImportSource @octane-xplat/jsx */
import { styleRecord } from '../../internal/layout/style-merge'
import { useContext, useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import { useInteractionHost } from '../../gestures/host.tsrx'
import { InteractionScopeContext, interactionScopeOutlet } from '../../gestures/context.tsrx'
import type { StackItemProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'
import {
  nativeAccessibilityRole,
  nativeAccessibilityState,
} from '../../internal/accessibility/native-accessibility'

import { stackItemStyle } from './stack-layout'

/** StackItem — per-child size (`fill` grows into remaining space) and
 *  cross-axis alignment inside a `Stack`. `isScrollable` hosts the content
 *  in a ScrollView on native (NS layouts can't scroll their own overflow). */
export function StackItem(props: StackItemProps): unknown @{
  const scopes = useContext(InteractionScopeContext)
  const bindInput = useInteractionHost({ ...props, viewport: Boolean(props.isScrollable) })
  const itemStyle = stackItemStyle(props)

  const forwardedRef = useMemo(
    () =>
      refList(
        (v: any) => {
          if (v) {
            void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))
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
      className={['vx-stackitem', props.className]}
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
      <masonview className="vx-stackitem-content">
        {interactionScopeOutlet(scopes, props.interactionScope, props.children)}
      </masonview>
    </scrollview>
  } @else {
    <masonview
      id={props.id}
      ref={forwardedRef}
      className={['vx-stackitem', props.className]}
      style={{ ...itemStyle, ...styleRecord(props.style) }}
      accessible={props.accessible}
      accessibilityLabel={props.accessibilityLabel}
      accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
      accessibilityHint={props.accessibilityHint}
      accessibilityValue={props.accessibilityValue}
      accessibilityState={nativeAccessibilityState(props.accessibilityState)}
      accessibilityLiveRegion={props.accessibilityLiveRegion}
    >
      {interactionScopeOutlet(scopes, props.interactionScope, props.children)}
    </masonview>
  }
}
