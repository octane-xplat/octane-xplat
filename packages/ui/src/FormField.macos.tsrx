/** @jsxImportSource @xplat/macos/renderer */
import { useId } from 'octane'
import type { FormFieldProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { FieldProvider } from './field-context'
import { Tooltip } from './Tooltip.tsrx'
import { Pressable } from './Pressable.macos.tsrx'

/** Shared field wrapper for labels, descriptions, and validation status. */
export function FormField(props: FormFieldProps) @{
	const generatedControlId = useId()
	const controlId = props.inputID ?? generatedControlId
	const labelId = props.label == null ? undefined : `${generatedControlId}-label`
	const descriptionId = props.description == null ? undefined : `${generatedControlId}-description`
	const isRequired = props.isRequired && !props.isOptional;
	const status = props.status;
	const statusId = status?.message == null ? undefined : `${generatedControlId}-status`
	const label = props.label == null || props.isLabelHidden ? null : <label id={labelId} className="vx-field-label" text={isRequired ? props.label + ' *' : props.isOptional ? props.label + ' (Optional)' : props.label} />
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
		className={cx('vx-field', status && `vx-field--${status.type}`, props.isDisabled && 'vx-field--disabled', props.isReadOnly && 'vx-field--readonly', props.isLoading && 'vx-field--loading', props.statusVariant === 'detached' && 'vx-field--status-detached', props.size && `vx-field--size-${props.size}`, props.className)}
		style={props.style}
	>
		{props.labelTooltip && label
			? <Tooltip trigger={<flexboxlayout className="vx-field-label-row" flexDirection="row" alignItems="center">{label}<Pressable className="vx-field-info" accessibilityLabel={'More about ' + props.label} accessibilityHint={props.labelTooltip}><label text="i" /></Pressable></flexboxlayout>} content={props.labelTooltip} placement="top" />
			: label}
		{props.description != null && !props.isLabelHidden
			? <label id={descriptionId} className="vx-field-description" text={props.description} />
			: null}
		<FieldProvider value={fieldContext}>{props.children}</FieldProvider>
		{status?.message != null
			? <label id={statusId} className={cx('vx-field-status', `vx-field-status--${status.type}`, props.statusVariant === 'detached' && 'vx-field-status--detached')} text={status.message} />
			: null}
	</flexboxlayout>
}
