import { useImperativeHandle, useRef, useState, useId } from 'octane';
import { normStyle } from './layout-child.web';
import type { TextInputProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { cx } from '@octane-xplat/lib';
import { useFieldControl, useFieldControlProps } from './field-context';
import { FormField } from './FormField.web.tsrx';
import { STATUS_ICON_PATHS } from './status-icons';

export function TextInput(props: TextInputProps) @{
	const { inField } = useFieldControl(props);
	const generatedId = useId();
	const controlId = props.id ?? generatedId;
	const needsChrome = !inField && (props.label != null || props.description != null || props.status != null || props.isRequired || props.isOptional);
	// The label element carries the name via `for`/`id` (so `label` is stripped
	// from the resolved control props); description/status get explicit ids
	// the input's aria-describedby links to.
	const bareProps = needsChrome
		? {
				...props,
				label: undefined,
				// description/status live as linked elements — keep status.type
				// for aria-invalid/classes but drop their text from the resolved
				// aria-description so it only carries the disabled reason/hint.
				description: undefined,
				status: props.status ? { type: props.status.type } : undefined,
				web: {
					...props.web,
					'aria-describedby':
						[props.web?.['aria-describedby'], props.description != null ? `${controlId}-description` : undefined, props.status?.message != null ? `${controlId}-status` : undefined].filter(Boolean).join(' ') || undefined,
				},
			}
		: props;
	const fieldProps = useFieldControlProps(bareProps);
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

	// Standalone controls render Astryx's visible field chrome: outside a
	// FormField, wrap the bare input in one (it owns label/description/status
	// and the <label for> → input focus link). Inside a field, render bare.
	const shell = <div className={cx('vx-input-shell', fieldProps.inInputGroup && 'vx-input-shell--ingroup', fieldProps.status && `vx-input-shell--status-${fieldProps.status.type}`, fieldProps.isDisabled && 'vx-input-shell--disabled')}>
		<input
			ref={(el: any) => {
				input.current = el;
				if (!el) return;
				applyEscapeProps(el, fieldProps);
			}}
			id={needsChrome ? controlId : fieldProps.id}
			data-testid={fieldProps.testID}
			className={cx('vx-input', fieldProps.isDisabled && 'vx-input--disabled', fieldProps.isReadOnly && 'vx-input--readonly', fieldProps.isLoading && 'vx-input--loading', fieldProps.status && `vx-input--status-${fieldProps.status.type}`, fieldProps.size && `vx-input--size-${fieldProps.size}`, fieldProps.inInputGroup && 'vx-input--ingroup', fieldProps.className)}
			style={{ ...normStyle(fieldProps.style), ...(fieldProps.placeholderTextColor ? { '--placeholder-color': fieldProps.placeholderTextColor } : {}) }}
			value={value}
			type={fieldProps.secure ? 'password' : fieldProps.keyboardType === 'number' || fieldProps.keyboardType === 'decimal' ? 'number' : keyboardType ?? 'text'}
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
			? <button type="button" className="vx-input-clear" aria-label={fieldProps.fieldLabel ? `Clear ${fieldProps.fieldLabel}` : props.label ? `Clear ${props.label}` : 'Clear input'} onClick={clear}>{'×'}</button>
			: null}
		{fieldProps.status && !fieldProps.inInputGroup && (fieldProps.statusVariant ?? 'attached') === 'attached'
			? <span className="vx-input-status-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" aria-hidden="true"><path fillRule="evenodd" clipRule="evenodd" d={STATUS_ICON_PATHS[fieldProps.status.type as keyof typeof STATUS_ICON_PATHS]} /></svg></span>
			: null}
	</div>;
	if (!needsChrome) return shell;
	return (
		<FormField inputID={controlId} descriptionID={`${controlId}-description`} statusID={`${controlId}-status`} label={props.label} description={props.description} status={props.status} isRequired={props.isRequired} isOptional={props.isOptional} isLabelHidden={props.isLabelHidden} isDisabled={props.isDisabled} labelTooltip={props.labelTooltip} disabledMessage={props.disabledMessage} width={props.width}>
			{shell}
		</FormField>
	);
}
