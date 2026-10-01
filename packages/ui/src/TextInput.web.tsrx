import { useRef } from 'octane';
import { normStyle } from './layout-child.web';
import type { TextInputProps } from "./props";
import { applyEscapeProps } from "./escape-props";
export function TextInput(props: TextInputProps) @{
	const input = useRef<any>(null);
	const isBlocked = props.isDisabled || props.isReadOnly;
	const keyboardType = props.keyboardType === 'phone' ? 'tel' : props.keyboardType === 'default' ? 'text' : props.keyboardType;
	const inputMode = props.keyboardType === 'number' ? 'numeric' : props.keyboardType === 'phone' ? 'tel' : props.keyboardType === 'default' ? 'text' : props.keyboardType;

	const clear = () => {
		if (isBlocked || !input.current) return;
		if (props.value === undefined) input.current.value = '';
		props.onChange?.('');
		props.onClear?.();
		input.current.focus({ preventScroll: true });
	};

	<div className="vx-input-shell">
		<input
			ref={(el: any) => {
				input.current = el;
				if (!el) return;
				applyEscapeProps(el, props);
				props.bind?.({ focus: () => el.focus(), blur: () => el.blur(), native: el });
			}}
			id={props.id}
			className={['vx-input', props.isDisabled ? 'vx-input--disabled' : undefined, props.isReadOnly ? 'vx-input--readonly' : undefined, props.isLoading ? 'vx-input--loading' : undefined, props.status ? `vx-input--status-${props.status.type}` : undefined, props.size ? `vx-input--size-${props.size}` : undefined, props.className]}
			style={{ ...normStyle(props.style), ...(props.placeholderTextColor ? { '--placeholder-color': props.placeholderTextColor } : {}) }}
			value={props.value}
			type={props.secure ? 'password' : props.keyboardType === 'number' || props.keyboardType === 'decimal' ? 'number' : keyboardType}
			inputMode={inputMode}
			enterKeyHint={props.returnKeyType}
			aria-label={props.accessibilityLabel ?? props.label}
			aria-required={props.isRequired && !props.isOptional || undefined}
			aria-invalid={props.status?.type === 'error' || undefined}
			aria-busy={props.isLoading || undefined}
			disabled={props.isDisabled || undefined}
			readOnly={props.isReadOnly || undefined}
			placeholder={props.placeholder}
			onInput={(e: any) => props.onChange?.(e.target.value)}
			onKeyDown={(e: any) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) props.onSubmit?.(); }}
			onFocus={props.onFocus}
			onBlur={props.onBlur}
		/>
		{props.hasClear && props.value != null && props.value !== '' && !isBlocked
			? <button type="button" className="vx-input-clear" aria-label={props.label ? `Clear ${props.label}` : 'Clear input'} onClick={clear}>×</button>
			: null}
	</div>
}
