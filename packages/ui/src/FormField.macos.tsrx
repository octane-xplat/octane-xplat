/** @jsxImportSource @xplat/macos/renderer */
import type { FormFieldProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";

/** Shared field wrapper for labels, descriptions, and validation status. */
export function FormField(props: FormFieldProps) @{
	const isRequired = props.isRequired && !props.isOptional;
	const status = props.status;

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-field', status && `vx-field--${status.type}`, props.className)}
		style={props.style}
	>
		{props.label != null
			? <label className={cx('vx-field-label', props.isLabelHidden && 'vx-field-label--hidden')} text={isRequired ? props.label + ' *' : props.isOptional ? props.label + ' (Optional)' : props.label} />
			: null}
		{props.children}
		{props.description != null
			? <label className="vx-field-description" text={props.description} />
			: null}
		{status?.message != null
			? <label className={cx('vx-field-status', `vx-field-status--${status.type}`)} text={status.message} />
			: null}
	</flexboxlayout>
}
