/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane';
import { Utils } from '@nativescript/core';
import type { TextAreaProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";

/** Multiline input — <textview>. TextView measures to content natively, so
 *  `autoGrow` is its default; `rows`/`maxRows` have no NS equivalent, so the
 *  leaf converts them to min/maxHeight in dips using the widget's own line
 *  height (iOS `font.lineHeight`, Android `getLineHeight()` px→dip — measured
 *  on `loaded`, re-fit every commit for prop/style changes). The driver's
 *  text→textChange echo suppression applies here unchanged. */
export function TextArea(props: TextAreaProps) @{
	const el = useRef<any>(null);

	const lineDip = (v: any): number => {
		const ios = v?.ios?.font?.lineHeight;
		if (ios > 0) return ios;
		const px = v?.android?.getLineHeight?.();
		if (px > 0) return Utils.layout.toDeviceIndependentPixels(px);
		return 24; // ≈ default 17pt at 1.4 — only hit before widget load
	};

	const fit = (v: any) => {
		if (!v) return;
		if (props.style?.height != null) return; // explicit height wins
		const line = lineDip(v);
		const rows = props.rows ?? (props.autoGrow ? 1 : 3);
		v.style.minHeight = rows * line;
		if (props.maxRows) v.style.maxHeight = props.maxRows * line;
		else if (!props.autoGrow) v.style.maxHeight = rows * line;
	};

	// Explicit deps — tsrx infers effect deps from closure reads, and `fit`
	//  hides the prop reads one level down.
	useEffect(() => fit(el.current), [props.rows, props.autoGrow, props.maxRows, props.style]);

	<textview
		id={props.id}
		ref={(v: any) => {
			el.current = v;
			if (!v) return;
			applyEscapeProps(v, props);
			props.bind?.({ focus: () => v.focus(), blur: () => v.dismissSoftInput?.() ?? v.blur(), native: v });
		}}
		className={cx(props.className)}
		style={{ ...props.style, ...(props.placeholderTextColor ? { placeholderColor: props.placeholderTextColor } : {}) }}
		text={props.value}
		hint={props.placeholder ?? props.hint}
		keyboardType={props.keyboardType === 'default' ? undefined : props.keyboardType}
		returnKeyType={props.returnKeyType}
		editable={props.editable}
		onLoaded={(e: any) => fit(e.object)}
		onTextChange={(e: any) => props.onChange?.(e.value)}
		onReturnPress={props.onSubmit}
		onFocus={props.onFocus}
		onBlur={props.onBlur}
	/>
}
