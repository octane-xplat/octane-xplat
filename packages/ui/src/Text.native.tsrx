/** @jsxImportSource @nativescript-community/octane */
import { createContext, useContext } from 'octane';
import type { TextProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityState } from "./escape-props";
import { layoutChildProps } from './layout-child.native';

/**
 * Nested <Text> renders a <span> (rich-text run) inside the parent's
 * label/formattedstring. Note: span-under-TextBase parenting needs the
 * driver extension from docs/decisions.md #25 — bare-text-only usage is
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
	// NativeScript Label/Span has no selectable property; selectable is web-only.
	const textStyle = {
		...props.style,
		...(props.ellipsize ? { whiteSpace: 'nowrap', textOverflow: 'ellipsis' } : {}),
	};

	@if (inText) {
		<span ref={(v: any) => applyEscapeProps(v, props)} className={cx(props.className)} style={textStyle} {...layoutChildProps(props)}>
			{props.children}
		</span>
	} @else {
		<label
			id={props.id}
			ref={(v: any) => applyEscapeProps(v, props)}
			{...layoutChildProps(props)}
			className={cx(props.className)}
			style={textStyle}
			maxLines={props.numberOfLines ?? 0}
			// NS Label renders single-line unless whiteSpace asks to wrap;
			// web text wraps freely — 'normal' matches web (0 = unlimited lines).
			whiteSpace={props.ellipsize ? 'nowrap' : 'normal'}
			textOverflow={props.ellipsize ? 'ellipsis' : undefined}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
			accessibilityLiveRegion={props.accessibilityLiveRegion as any}
		>
			<TextScope>{props.children}</TextScope>
		</label>
	}
}
