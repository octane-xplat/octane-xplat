import type { FormFieldProps } from "./props";
import { applyEscapeProps } from "./escape-props";

/** Shared field wrapper for labels, descriptions, and validation status. */
export function FormField(props: FormFieldProps) @{
	const isRequired = props.isRequired && !props.isOptional;
	const status = props.status;

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-field', status ? `vx-field--${status.type}` : undefined, props.className]}
		style={props.style}
		role="group"
	>
		{props.label != null
			? <span className={['vx-field-label', props.isLabelHidden ? 'vx-field-label--hidden' : undefined]}>{props.label}{isRequired ? <span className="vx-field-required" aria-hidden="true"> *</span> : props.isOptional ? <span className="vx-field-optional"> (Optional)</span> : null}</span>
			: null}
		{props.children}
		{props.description != null
			? <span className="vx-field-description">{props.description}</span>
			: null}
		{status?.message != null
			? <span className={['vx-field-status', `vx-field-status--${status.type}`]} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</span>
			: null}
	</div>
}
