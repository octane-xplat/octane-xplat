/** @jsxImportSource @octane-xplat/jsx */
import { createContext, useContext } from 'octane'
import { styleRecord } from '../../internal/layout/style-merge'
import { Application } from '@nativescript/core'
import type { PlatformWidgetProps, TextProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'
import { nativeAccessibilityRole, nativeAccessibilityState } from '../../internal/accessibility/native-accessibility'

import { layoutChildProps } from '../layout/layout-child'
import { useTheme } from '../../theme/use-theme.tsrx'
import { textScaleStyle, type TextScaleStyle } from '../forms/text-scale'

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

const NO_SCALE: TextScaleStyle = {}

/** Whether the type scale reads theme tokens. Ambient (`inherit`) text with no
 *  size, weight, or color override resolves to no scale style. */
function readsThemeTokens(props: TextProps): boolean {
  return Boolean(
    (props.type && props.type !== 'inherit') ||
    props.size ||
    props.weight ||
    (props.color && props.color !== 'inherit'),
  )
}

/** Escape bags and modifiers re-apply after every render because authored
 *  props can overwrite them. Without them only one-time host preparation
 *  remains, so the ref keeps a stable identity across renders. */
function textHostRef(props: PlatformWidgetProps<TextProps>): (view: any) => void {
  return props.ios || props.android || props.modifiers
    ? (view: any) => void (prepareUIHost(view), applyEscapeProps(view, props), applyUIHostModifiers(view, props))
    : prepareUIHost
}

/**
 * Text run — the shared typography leaf. Import from `@octane-xplat/ui`.
 *
 * @see TextProps.
 */
export function Text(props: TextProps): unknown @{
  const inText = useContext(InText)
  let scale = NO_SCALE

  // Ambient text skips the theme read; its color and type come from classes.
  if (readsThemeTokens(props)) {
    scale = textScaleStyle(useTheme().tokens, props)
  }

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

  const hostRef = textHostRef(props)
  // Plain strings and numbers cannot contain nested runs; skip the scope.
  const plainChildren = typeof props.children === 'string' || typeof props.children === 'number'

  @if (inText) {
    <span
      ref={hostRef}
      className={[props.className]}
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
      ref={hostRef}
      {...layoutChildProps(props, textStyle)}
      className={[
        'vx-text',
        props.type && `vx-text--${props.type}`,
        props.size && `vx-text--size-${props.size}`,
        props.color && `vx-text--color-${props.color}`,
        props.className,
      ]}
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
      @if (plainChildren) {
        <>{props.children}</>
      } @else {
        <TextScope>{props.children}</TextScope>
      }
    </label>
  }
}
