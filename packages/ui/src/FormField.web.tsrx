import { useId } from 'octane'
import type { FormFieldProps } from "./props";
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

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-field', status ? `vx-field--${status.type}` : undefined, props.isDisabled ? 'vx-field--disabled' : undefined, props.isReadOnly ? 'vx-field--readonly' : undefined, props.isLoading ? 'vx-field--loading' : undefined, props.size ? `vx-field--size-${props.size}` : undefined, props.className]}
		style={props.style}
		role="group"
	>
		{props.label != null
			? <label id={labelId} htmlFor={controlId} className={['vx-field-label', props.isLabelHidden ? 'vx-field-label--hidden' : undefined]}>{props.label}{isRequired ? <span className="vx-field-required" aria-hidden="true"> *</span> : props.isOptional ? <span className="vx-field-optional"> (Optional)</span> : null}</label>
			: null}
		{props.description != null
			? <span id={descriptionId} className={['vx-field-description', props.isLabelHidden ? 'vx-field-description--hidden' : undefined]}>{props.description}</span>
			: null}
		<FieldProvider value={fieldContext}>{props.children}</FieldProvider>
		{status?.message != null
			? <span id={statusId} className={['vx-field-status', `vx-field-status--${status.type}`]} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</span>
			: null}
	</div>
}
