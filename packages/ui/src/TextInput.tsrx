/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle, styleRecord } from './style-merge'
import { useImperativeHandle, useEffect, useRef, useState } from 'octane';
import type { TextInputProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps, nativeAccessibilityState } from "./escape-props";
import { isWritingText, writeText } from './text-write';
import { blurText } from './text-focus';
import { Pressable } from './Pressable';
import { useFieldControlProps } from './field-context';

/** Controlled single-line input. Imperative writes suppress their synchronous
 *  textChange echo through text-write. `isReadOnly` defaults false: an undefined
 *  write coerces ios.userInteractionEnabled to NO (dead field) — the
 *  driver's skip-undefined patch covers it, the ?? stays as documentation.
 *  `text` isn't a bound prop: the leaf writes it imperatively so the
 *  Android selection survives controlled writes (see text-write). */
export function TextInput(inputProps: TextInputProps) @{
	const props = useFieldControlProps(inputProps);
	const el = useRef<any>(null);
	const [internal, setInternal] = useState(props.defaultValue ?? '');
	const value = props.value ?? internal;
	useEffect(() => writeText(el.current, value), [value]);
	const isBlocked = props.isDisabled || props.isReadOnly;
	const setValue = (next: string) => {
		if (props.value === undefined) setInternal(next);
		props.onChange?.(next);
	};

	const clear = () => {
		if (isBlocked) return;
		setValue('');
		props.onClear?.();
		el.current?.focus();
	};

	useImperativeHandle(props.ref, () => ({ focus: () => el.current.focus(), blur: () => blurText(el.current), native: el.current }), []);

	<masonview className={cx('vx-input-shell', props.inInputGroup && 'vx-input-shell--ingroup')} style={mergeStyle({flexDirection: "row", alignItems: "center"}, {display: "flex"})}>
		<textfield
			ref={(v: any) => {
				el.current = v;
				if (!v) return;
				applyEscapeProps(v, props);
			}}
			id={props.id}
			testID={props.testID ?? ''}
			className={cx('vx-input', props.isDisabled && 'vx-input--disabled', props.isReadOnly && 'vx-input--readonly', props.isLoading && 'vx-input--loading', props.status && `vx-input--status-${props.status.type}`, props.size && `vx-input--size-${props.size}`, props.inInputGroup && 'vx-input--ingroup', props.className)}
			style={mergeStyle(styleRecord(props.style), props.placeholderTextColor ? { placeholderColor: props.placeholderTextColor } : {})}
			hint={props.placeholder}
			accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled })}
			secure={props.secure}
			keyboardType={props.keyboardType === 'default' ? undefined : props.keyboardType}
			returnKeyType={props.returnKeyType}
			isEnabled={!props.isDisabled}
			editable={!isBlocked}
			onTextChange={(e: any) => { if (!isWritingText(e.object)) setValue(e.value); }}
			onReturnPress={props.onSubmit}
			onFocus={props.onFocus}
			onBlur={props.onBlur}
		/>
		{props.hasClear && value !== '' && !isBlocked
			? <Pressable className="vx-input-clear" accessibilityLabel="Clear input" onPress={clear}><label text="×" /></Pressable>
			: null}
	</masonview>
}
