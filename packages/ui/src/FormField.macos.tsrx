/** @jsxImportSource @xplat/macos/renderer */
import type { FormFieldProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";

/** FormField — label + control + hint/error stack. The error replaces the
 *  hint when present; `required` appends a marker to the label. */
export function FormField(props: FormFieldProps) @{
	const message = props.error ?? props.hint;

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-field', props.error && 'vx-field--error', props.className)}
		style={props.style}
	>
		{props.label != null
			? <label className="vx-field-label" text={props.required ? props.label + ' *' : props.label} />
			: null}
		{props.children}
		{message != null
			? <label className={cx('vx-field-msg', props.error && 'vx-field-msg--error')} text={message} />
			: null}
	</flexboxlayout>
}
