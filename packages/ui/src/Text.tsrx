/** @jsxImportSource @nativescript-community/octane */
import { createContext, useContext } from 'octane';
import { Application } from '@nativescript/core';
import type { TextProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from "./escape-props";
import { layoutChildProps } from './layout-child';

/**
 * Nested <Text> renders a <span> (rich-text run) inside the parent's
 * label/formattedstring. Note: span-under-TextBase parenting needs the
 * driver extension from docs/notes/decisions.md #25 — bare-text-only usage is
 * safe today.
 */
// The 'octane' import is compiler-retargeted to the universal runtime on
// native; its DOM Context type signature (2-3 args) doesn't match the
// universal 1-arg callable, so type the value loosely for this leaf.
const InText: any = createContext(false);

/** Function-component wrapper: context callables aren't JSX.ElementType under
 *  the nativescript intrinsics, so provide through a component shape. */
function TextScope(props: { children?: any }) {
	return InText({ value: true, children: props.children });
}

export function Text(props: TextProps) @{
	const inText = useContext(InText);
	const fontWeightValue = String(props.style?.fontWeight ?? '').toLowerCase();
	const namedWeights: Record<string, number> = {
		normal: 400,
		bold: 700,
		thin: 100,
		'extra-light': 200,
		light: 300,
		medium: 500,
		'semi-bold': 600,
		'extra-bold': 800,
		black: 900,
	};

	const fontWeight = /^\d+$/.test(fontWeightValue)
		? Number(fontWeightValue)
		: namedWeights[fontWeightValue];

	const lineHeight = props.style?.lineHeight;
	// UIFontDescriptor resolves variable fonts to the regular axis default on
	// iOS. Set wght explicitly so CSS fontWeight selects the matching instance.
	const textStyle = {
		...props.style,
		...((Application.ios || Application.android) &&
		typeof lineHeight === 'number' &&
		Number.isFinite(lineHeight) &&
		lineHeight > 0 &&
		props.style?.height == null &&
		props.style?.minHeight == null
			? { minHeight: lineHeight }
			: {}),
		...(Application.ios &&
		props.style?.fontVariationSettings == null &&
		fontWeight !== undefined &&
		fontWeight >= 100 &&
		fontWeight <= 900
			? { fontVariationSettings: `'wght' ${fontWeight}` }
			: {}),
		// Clamped text must be allowed to shrink — the shared shrink:0 default
		// would let the label overflow its row instead of truncating.
		...(props.ellipsize || props.numberOfLines ? { flexShrink: 1 } : {}),
		...(props.ellipsize ? { whiteSpace: 'nowrap', textOverflow: 'ellipsis' } : {}),
	};

	@if (inText) {
		<span ref={(v: any) => applyEscapeProps(v, props)} className={cx(props.className)} style={textStyle} {...layoutChildProps(props)}>
			{props.children}
		</span>
	} @else {
		<label
			id={props.id}
			testID={props.testID ?? ''}
			ref={(v: any) => applyEscapeProps(v, props)}
			{...layoutChildProps(props)}
			className={cx(props.className)}
			style={textStyle}
			maxLines={props.numberOfLines ?? 0}
			// NS Label renders single-line unless whiteSpace asks to wrap;
			// web text wraps freely — 'normal' matches web (0 = unlimited lines).
			whiteSpace={props.ellipsize ? 'nowrap' : 'normal'}
			textOverflow={props.ellipsize ? 'ellipsis' : undefined}
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
			accessibilityLiveRegion={props.accessibilityLiveRegion as any}
		>
			<TextScope>{props.children}</TextScope>
		</label>
	}
}
