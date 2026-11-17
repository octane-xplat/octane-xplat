/** @jsxImportSource @octane-xplat/jsx */
import { styleRecord } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { SectionProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'
import { nativeAccessibilityRole, nativeAccessibilityState } from '../../internal/accessibility/native-accessibility'

import { spacingPx } from '../layout/stack-layout'

/** Section — banded container with surface/transparent/muted background.
 *  The web leaf's container-padding escape has no native analog (no CSS
 *  var propagation into layout), so this leaf is a single wrapper. */
export function Section(props: SectionProps): unknown @{
  const variant = props.variant ?? 'section'
  const dividers = new Set(props.dividers ?? [])
  const padding = spacingPx(props.padding) ?? 16
  const pInlineStart = spacingPx(props.paddingInlineStart ?? props.paddingInline) ?? padding
  const pInlineEnd = spacingPx(props.paddingInlineEnd ?? props.paddingInline) ?? padding
  const pBlockStart = spacingPx(props.paddingBlockStart ?? props.paddingBlock) ?? padding
  const pBlockEnd = spacingPx(props.paddingBlockEnd ?? props.paddingBlock) ?? padding

  const forwardedRef = useMemo(
    () =>
      refList((v: any) => {
        if (v) {
          void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))
        }
      }, props.ref),
    [props.ref, props.ios, props.android, props.web],
  )

  <masonview
    id={props.id}
    ref={forwardedRef}
    className={[
      'vx-section',
      `vx-section--${variant}`,
      dividers.has('top') && 'vx-section--divider-top',
      dividers.has('bottom') && 'vx-section--divider-bottom',
      dividers.has('start') && 'vx-section--divider-start',
      dividers.has('end') && 'vx-section--divider-end',
      props.className,
    ]}
    style={{
      paddingLeft: pInlineStart,
      paddingRight: pInlineEnd,
      paddingTop: pBlockStart,
      paddingBottom: pBlockEnd,
      ...(props.width != null ? { width: props.width } : {}),
      ...(props.height != null ? { height: props.height } : {}),
      ...(props.maxWidth != null ? { maxWidth: props.maxWidth } : {}),
      ...(props.minHeight != null ? { minHeight: props.minHeight } : {}),
      ...styleRecord(props.style),
    }}
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
