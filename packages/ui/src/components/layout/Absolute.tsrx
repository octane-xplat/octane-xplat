/** @jsxImportSource @octane-xplat/jsx */
import type { AbsoluteProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'
import { nativeAccessibilityRole, nativeAccessibilityState } from '../../internal/accessibility/native-accessibility'

/**
 * Positioned/overlap container — the stack-in-absolute-space layer. Import from `@octane-xplat/ui`.
 *
 * @see AbsoluteProps.
 */
export function Absolute(props: AbsoluteProps): unknown @{
  <masonview
    id={props.id}
    ref={(view: any) => void (prepareUIHost(view), applyEscapeProps(view, props), applyUIHostModifiers(view, props))}
    className={['vx-absolute', props.className]}
    style={props.style}
    accessible={props.accessible}
    accessibilityLabel={props.accessibilityLabel}
    accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
    accessibilityHint={props.accessibilityHint}
    accessibilityValue={props.accessibilityValue}
    accessibilityState={nativeAccessibilityState(props.accessibilityState)}
    accessibilityLiveRegion={props.accessibilityLiveRegion}
  >
    {props.children}
  </masonview>
}
