/** @jsxImportSource @nativescript-community/octane */
import { useId } from 'octane'
import type { FormFieldProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { FieldProvider } from './field-context'

/** Shared field wrapper for labels, descriptions, and validation status. */
export function FormField(props: FormFieldProps) @{
	const generatedControlId = useId()
	const controlId = props.inputID ?? generatedControlId
	const labelId = props.label == null ? undefined : `${generatedControlId}-label`
	const descriptionId = props.description == null ? undefined : `${generatedControlId}-description`
	const isRequired = props.isRequired && !props.isOptional;
	const status = props.status;
	const statusId = status?.message == null ? undefined : `${generatedControlId}-status`
	const fieldContext = {
		...props,
		controlId,
		labelId,
		descriptionId,
		statusId,
	}

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-field', status && `vx-field--${status.type}`, props.isDisabled && 'vx-field--disabled', props.isReadOnly && 'vx-field--readonly', props.isLoading && 'vx-field--loading', props.size && `vx-field--size-${props.size}`, props.className)}
		style={props.style}
	>
		{props.label != null && !props.isLabelHidden
			? <label id={labelId} className={cx('vx-field-label', props.isLabelHidden && 'vx-field-label--hidden')} text={isRequired ? props.label + ' *' : props.isOptional ? props.label + ' (Optional)' : props.label} />
			: null}
		{props.description != null && !props.isLabelHidden
			? <label id={descriptionId} className={cx('vx-field-description', props.isLabelHidden && 'vx-field-description--hidden')} text={props.description} />
			: null}
		<FieldProvider value={fieldContext}>{props.children}</FieldProvider>
		{status?.message != null
			? <label id={statusId} className={cx('vx-field-status', `vx-field-status--${status.type}`)} text={status.message} />
			: null}
	</flexboxlayout>
}
