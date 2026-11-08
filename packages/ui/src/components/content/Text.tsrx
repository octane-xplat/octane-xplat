/** @jsxImportSource @octane-xplat/jsx */
import { createContext, useContext } from 'octane'
import { styleRecord } from '../../internal/layout/style-merge'
import { Application } from '@nativescript/core'
import type { TextProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import {
  applyEscapeProps,
  nativeAccessibilityRole,
  nativeAccessibilityState,
} from '../overlays/escape-props'

import { layoutChildProps } from '../layout/layout-child'
import { useTheme } from '../../theme/use-theme.tsrx'
import { textScaleStyle } from '../forms/text-scale'

import type { JSX } from 'octane/jsx-runtime'

/**
 * Nested <Text> renders a <span> (rich-text run) inside the parent's
 * label/formattedstring. The patched NativeScript driver folds `#text` and
 * span children of a text host into one ordered FormattedString (decisions
 * #25), so sibling text and nested runs compose; a Span still cannot host
 * child views, so keep nested runs text-bearing only.
 */
// The 'octane' import is compiler-retargeted to the universal runtime on
// native; its DOM Context type signature (2-3 args) doesn't match the
// universal 1-arg callable, so type the value loosely for this leaf.
const InText: any = createContext(false)

/** Function-component wrapper: context callables aren't JSX.ElementType under
 *  the nativescript intrinsics, so provide through a component shape. */
function TextScope(props: { children?: any }) {
  return InText({ value: true, children: props.children })
}

/**
 * Text run — the shared typography leaf. Import from `@octane-xplat/ui`.
 *
 * @see TextProps.
 */
export function Text(props: TextProps): unknown @{
  const inText = useContext(InText)
  const theme = useTheme()
  const scale = textScaleStyle(theme.tokens, props)
  const maxLines = props.maxLines ?? 0

  const textStyle: Record<string, any> = {
    ...(scale.fontSizePx != null && { fontSize: scale.fontSizePx }),
    ...(scale.fontWeight && { fontWeight: scale.fontWeight }),
    ...(scale.lineHeightPx != null && { lineHeight: scale.lineHeightPx }),
    ...(scale.fontFamily && { fontFamily: scale.fontFamily }),
    ...(scale.color && { color: scale.color }),
    // Clamped text must be allowed to shrink — the shared shrink:0 default
    // would let the label overflow its row instead of truncating.
    ...(maxLines > 0 && { flexShrink: 1 }),
    ...styleRecord(props.style),
  }

  const lineHeight = textStyle.lineHeight

  // Native controls need an explicit minimum to honor authored line height.
  if (
    (Application.ios || Application.android) &&
    typeof lineHeight === 'number' &&
    Number.isFinite(lineHeight) &&
    lineHeight > 0 &&
    textStyle.height == null &&
    textStyle.minHeight == null
  ) {
    textStyle.minHeight = lineHeight
  }

  @if (inText) {
    <span
      ref={(v: any) => applyEscapeProps(v, props)}
      className={cx(props.className)}
      {...layoutChildProps(props, textStyle)}
    >
      {props.children}
    </span>
  } @else {
    // NS Label renders single-line unless whiteSpace asks to wrap; web text
    // wraps freely — 'normal' matches web (0 unlimited lines).
    <label
      id={props.id}
      testID={props.testID ?? ''}
      ref={(v: any) => applyEscapeProps(v, props)}
      {...layoutChildProps(props, textStyle)}
      className={cx(
        'vx-text',
        props.type && `vx-text--${props.type}`,
        props.size && `vx-text--size-${props.size}`,
        props.color && `vx-text--color-${props.color}`,
        props.className,
      )}
      maxLines={maxLines}
      whiteSpace={maxLines === 1 ? 'nowrap' : 'normal'}
      textOverflow={maxLines > 0 ? 'ellipsis' : undefined}
      accessible={props.accessible}
      accessibilityLabel={props.accessibilityLabel}
      accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
      accessibilityHint={props.accessibilityHint}
      accessibilityValue={props.accessibilityValue}
      accessibilityState={nativeAccessibilityState(props.accessibilityState)}
      accessibilityLiveRegion={props.accessibilityLiveRegion}
    >
      <TextScope>{props.children}</TextScope>
    </label>
  }
}
