import { useImperativeHandle, useRef, useState } from 'octane';
import { normStyle } from './layout-child.web';
import type { TextInputProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { useFieldControlProps } from './field-context';
export function TextInput(props: TextInputProps) @{
	const fieldProps = useFieldControlProps(props);
	const input = useRef<any>(null);
	const [internal, setInternal] = useState(fieldProps.defaultValue ?? '');
	const value = fieldProps.value ?? internal;
	const isBlocked = fieldProps.isDisabled || fieldProps.isReadOnly;
	const keyboardType = fieldProps.keyboardType === 'phone' ? 'tel' : fieldProps.keyboardType === 'default' ? 'text' : fieldProps.keyboardType;
	const inputMode = fieldProps.keyboardType === 'number' ? 'numeric' : fieldProps.keyboardType === 'phone' ? 'tel' : fieldProps.keyboardType === 'default' ? 'text' : fieldProps.keyboardType;
	const setValue = (next: string) => {
		if (fieldProps.value === undefined) setInternal(next);
		fieldProps.onChange?.(next);
	};

	const clear = () => {
		if (isBlocked || !input.current) return;
		setValue('');
		fieldProps.onClear?.();
		input.current.focus({ preventScroll: true });
	};

	useImperativeHandle(fieldProps.ref, () => ({ focus: () => input.current.focus(), blur: () => input.current.blur(), native: input.current }), []);

	<div className={['vx-input-shell', fieldProps.inInputGroup ? 'vx-input-shell--ingroup' : undefined]}>
		<input
			ref={(el: any) => {
				input.current = el;
				if (!el) return;
				applyEscapeProps(el, fieldProps);
			}}
			id={fieldProps.id}
			data-testid={fieldProps.testID}
			className={['vx-input', fieldProps.isDisabled ? 'vx-input--disabled' : undefined, fieldProps.isReadOnly ? 'vx-input--readonly' : undefined, fieldProps.isLoading ? 'vx-input--loading' : undefined, fieldProps.status ? `vx-input--status-${fieldProps.status.type}` : undefined, fieldProps.size ? `vx-input--size-${fieldProps.size}` : undefined, fieldProps.inInputGroup ? 'vx-input--ingroup' : undefined, fieldProps.className]}
			style={{ ...normStyle(fieldProps.style), ...(fieldProps.placeholderTextColor ? { '--placeholder-color': fieldProps.placeholderTextColor } : {}) }}
			value={value}
			type={fieldProps.secure ? 'password' : fieldProps.keyboardType === 'number' || fieldProps.keyboardType === 'decimal' ? 'number' : keyboardType}
			inputMode={inputMode}
			enterKeyHint={fieldProps.returnKeyType}
			aria-label={fieldProps.ariaLabel}
			aria-labelledby={fieldProps.ariaLabelledBy}
			aria-describedby={fieldProps.ariaDescribedBy}
			aria-description={fieldProps.ariaDescription}
			aria-required={fieldProps.isRequired && !fieldProps.isOptional || undefined}
			aria-invalid={fieldProps.status?.type === 'error' || undefined}
			aria-busy={fieldProps.isLoading || undefined}
			disabled={fieldProps.isDisabled || undefined}
			readOnly={fieldProps.isReadOnly || undefined}
			placeholder={fieldProps.placeholder}
			onInput={(e: any) => setValue(e.target.value)}
			onKeyDown={(e: any) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) fieldProps.onSubmit?.(); }}
			onFocus={fieldProps.onFocus}
			onBlur={fieldProps.onBlur}
		/>
		{fieldProps.hasClear && value !== '' && !isBlocked
			? <button type="button" className="vx-input-clear" aria-label={fieldProps.fieldLabel ? `Clear ${fieldProps.fieldLabel}` : props.label ? `Clear ${props.label}` : 'Clear input'} onClick={clear}>×</button>
			: null}
	</div>
}
