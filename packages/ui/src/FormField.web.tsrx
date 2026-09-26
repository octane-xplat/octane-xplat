import type { FormFieldProps } from "./props";
import { applyEscapeProps } from "./escape-props";

/** FormField — label + control + hint/error stack. The error replaces the
 *  hint when present; `required` appends a marker to the label. */
export function FormField(props: FormFieldProps) @{
	const message = props.error ?? props.hint;

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-field', props.error ? 'vx-field--error' : undefined, props.className]}
		style={props.style}
		role="group"
	>
		{props.label != null
			? <span className="vx-field-label">{props.label}{props.required ? <span className="vx-field-required" aria-hidden="true"> *</span> : null}</span>
			: null}
		{props.children}
		{message != null
			? <span className={['vx-field-msg', props.error ? 'vx-field-msg--error' : undefined]} role={props.error ? 'alert' : undefined}>{message}</span>
			: null}
	</div>
}
