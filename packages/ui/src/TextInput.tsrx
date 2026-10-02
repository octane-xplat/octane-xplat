/** @jsxImportSource @nativescript-community/octane */
import { useImperativeHandle, useEffect, useRef } from 'octane';
import type { TextInputProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityState } from "./escape-props";
import { isWritingText, writeText } from './text-write';
import { blurText } from './text-focus';
import { Pressable } from './Pressable.tsrx';
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
	useEffect(() => writeText(el.current, props.value), [props.value]);
	const isBlocked = props.isDisabled || props.isReadOnly;
	const clear = () => {
		if (isBlocked) return;
		writeText(el.current, '');
		props.onChange?.('');
		props.onClear?.();
		el.current?.focus();
	};

	useImperativeHandle(props.ref, () => ({ focus: () => el.current.focus(), blur: () => blurText(el.current), native: el.current }), []);

	<flexboxlayout className={cx('vx-input-shell', props.inInputGroup && 'vx-input-shell--ingroup')} flexDirection="row" alignItems="center">
		<textfield
			ref={(v: any) => {
				el.current = v;
				if (!v) return;
				applyEscapeProps(v, props);
			}}
			id={props.id}
			className={cx('vx-input', props.isDisabled && 'vx-input--disabled', props.isReadOnly && 'vx-input--readonly', props.isLoading && 'vx-input--loading', props.status && `vx-input--status-${props.status.type}`, props.size && `vx-input--size-${props.size}`, props.inInputGroup && 'vx-input--ingroup', props.className)}
			style={{ ...props.style, ...(props.placeholderTextColor ? { placeholderColor: props.placeholderTextColor } : {}) }}
			hint={props.placeholder}
			accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled }) as any}
			secure={props.secure}
			keyboardType={props.keyboardType === 'default' ? undefined : props.keyboardType}
			returnKeyType={props.returnKeyType}
			isEnabled={!props.isDisabled}
			editable={!isBlocked}
			onTextChange={(e: any) => { if (!isWritingText(e.object)) props.onChange?.(e.value); }}
			onReturnPress={props.onSubmit}
			onFocus={props.onFocus}
			onBlur={props.onBlur}
		/>
		{props.hasClear && props.value != null && props.value !== '' && !isBlocked
			? <Pressable className="vx-input-clear" accessibilityLabel="Clear input" onPress={clear}><label text="×" /></Pressable>
			: null}
	</flexboxlayout>
}
