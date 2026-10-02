import { useContext, useId } from 'octane'
import type { FormFieldProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { FieldProvider } from './field-context'
import { FormLayoutContext } from './form-layout-context'
import { Tooltip } from './Tooltip.web.tsrx'

/** Shared field wrapper for labels, descriptions, and validation status.
 *  Under a `FormLayout`, horizontal labels flatten the root so the grid can
 *  place labels and controls in shared columns. Form-wide optionality hides
 *  redundant markers while controls retain their required accessibility state. */
export function FormField(props: FormFieldProps) @{
	const generatedControlId = useId()
	const form = useContext(FormLayoutContext)
	const isHorizontalLabels = form.direction === 'horizontal-labels'
	const controlId = props.inputID ?? generatedControlId
	const labelId = props.label == null ? undefined : (props.labelID ?? `${generatedControlId}-label`)
	const descriptionId = props.description == null ? undefined : (props.descriptionID ?? `${generatedControlId}-description`)
	const isRequired = props.isRequired && !props.isOptional
	const status = props.status
	const statusVariant = props.statusVariant ?? 'attached'
	const statusId = status?.message == null ? undefined : (props.statusID ?? `${generatedControlId}-status`)
	const fieldContext = {
		...props,
		controlId,
		labelId,
		descriptionId,
		statusId,
	}

	const showRequired = isRequired && form.defaultOptionality !== 'required'
	const showOptional = Boolean(props.isOptional) && form.defaultOptionality !== 'optional'
	const labelAffordance = props.labelTooltip != null
		? <Tooltip trigger={<span className="vx-field-label-tip" aria-hidden="true">{'?'}</span>} content={props.labelTooltip} placement="top" />
		: null

	const labelText = props.label != null
		? <span className="vx-field-label-text">{props.label}{showRequired ? <span className="vx-field-required" aria-hidden="true"> *</span> : null}{showOptional ? <span className="vx-field-optional"> (Optional)</span> : null}{labelAffordance}</span>
		: null

	const labelNode = props.label != null
		? (props.isGroupLabel
			? <span id={labelId} className={['vx-field-label', props.isLabelHidden ? 'vx-field-label--hidden' : undefined]}>{labelText}</span>
			: <label id={labelId} htmlFor={controlId} className={['vx-field-label', props.isLabelHidden ? 'vx-field-label--hidden' : undefined]}>{labelText}</label>)
		: null

	const descriptionNode = props.description != null
		? <span id={descriptionId} className={['vx-field-description', props.isLabelHidden ? 'vx-field-description--hidden' : undefined]}>{props.description}</span>
		: null

	const statusNode = status?.message != null
		? <span id={statusId} className={['vx-field-status', `vx-field-status--${status.type}`, `vx-field-status--${statusVariant}`]} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</span>
		: null

	const rootClass = ['vx-field', status ? `vx-field--${status.type}` : undefined, `vx-field--status-${statusVariant}`, props.isDisabled ? 'vx-field--disabled' : undefined, props.isReadOnly ? 'vx-field--readonly' : undefined, props.isLoading ? 'vx-field--loading' : undefined, props.size ? `vx-field--size-${props.size}` : undefined, props.className]
	const fieldStyle = { ...(props.width != null ? { width: props.width } : {}), ...props.style }

	@if (isHorizontalLabels) {
		<div ref={(e: any) => applyEscapeProps(e, props)} id={props.id} className={[...rootClass, 'vx-field--hl']} style={fieldStyle}>
			<div className="vx-field-hl-label">{labelNode}</div>
			<div className="vx-field-hl-body">
				{descriptionNode}
				<FieldProvider value={fieldContext}>{props.children}</FieldProvider>
				{statusNode}
			</div>
		</div>
	} @else {
		<div ref={(e: any) => applyEscapeProps(e, props)} id={props.id} className={rootClass} style={fieldStyle} role="group">
			{labelNode}
			{descriptionNode}
			<FieldProvider value={fieldContext}>{props.children}</FieldProvider>
			{statusNode}
		</div>
	}
}
