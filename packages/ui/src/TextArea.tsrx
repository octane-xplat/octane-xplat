/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane';
import { Utils } from '@nativescript/core';
import type { TextAreaProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityState } from "./escape-props";
import { isWritingText, writeText } from './text-write';
import { blurText } from './text-focus';
import { useFieldControlProps } from './field-context';

/** Multiline input — <textview>. TextView measures to content natively, so
 *  `autoGrow` is its default; `rows`/`maxRows` have no NS equivalent, so the
 *  leaf converts them to min/maxHeight in dips using the widget's own line
 *  height (iOS `font.lineHeight`, Android `getLineHeight()` px→dip — measured
 *  on `loaded`, re-fit every commit for prop/style changes). Imperative
 *  writes suppress their synchronous textChange echo through text-write. */
export function TextArea(inputProps: TextAreaProps) @{
	const props = useFieldControlProps(inputProps);
	const el = useRef<any>(null);
	const submitOnReturn = props.returnKeyType === 'done' || props.returnKeyType === 'send';

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
	// Imperative controlled write — Android setText resets selection to 0.
	useEffect(() => writeText(el.current, props.value), [props.value]);

	<textview
		id={props.id}
		ref={(v: any) => {
			el.current = v;
			if (!v) return;
			applyEscapeProps(v, props);
			props.bind?.({ focus: () => v.focus(), blur: () => blurText(v), native: v });
		}}
		className={cx('vx-textarea', props.isDisabled && 'vx-textarea--disabled', props.isReadOnly && 'vx-textarea--readonly', props.isLoading && 'vx-textarea--loading', props.status && `vx-textarea--status-${props.status.type}`, props.size && `vx-textarea--size-${props.size}`, props.className)}
		style={{ ...props.style, ...(props.placeholderTextColor ? { placeholderColor: props.placeholderTextColor } : {}) }}
		hint={props.placeholder}
	accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled }) as any}
		keyboardType={props.keyboardType === 'default' ? undefined : props.keyboardType}
		returnKeyType={props.returnKeyType}
		isEnabled={!props.isDisabled}
		editable={!props.isDisabled && !props.isReadOnly}
		onLoaded={(e: any) => fit(e.object)}
		onTextChange={(e: any) => { if (!isWritingText(e.object)) props.onChange?.(e.value); }}
		// TextView emits returnPress for every newline. Only an explicit action
		// key opts into the submit semantic; ordinary Return remains a newline.
		onReturnPress={submitOnReturn ? props.onSubmit : undefined}
		onFocus={props.onFocus}
		onBlur={props.onBlur}
	/>
}
