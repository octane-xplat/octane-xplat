import type { FieldLabelProps } from './props'
import { applyWebProps } from './platformProps.web'
import { Tooltip } from './Tooltip.web.tsrx'

/** `FieldLabel` — standalone field label row (Astryx part): label text,
 *  required/optional marker, optional icon and tooltip, plus the
 *  description line. `inputID` binds the `<label>` to its control. */
export function FieldLabel(props: FieldLabelProps) @{
	const marker = props.isRequired && !props.isOptional
		? <span className="vx-field-marker"><span className="vx-field-dot" aria-hidden="true">{" \u2219 "}</span>Required</span>
		: props.isOptional
			? <span className="vx-field-marker"><span className="vx-field-dot" aria-hidden="true">{" \u2219 "}</span>Optional</span>
			: null

	<div
		ref={(e: any) => applyWebProps(e, props.web)}
		id={props.id}
		className={['vx-fieldlabel', props.isDisabled && 'vx-fieldlabel--disabled', props.className]}
		style={props.style}
	>
		<label htmlFor={props.inputID} className="vx-field-label">
			{props.labelIcon != null ? <span className="vx-field-label-icon" aria-hidden="true">{props.labelIcon}</span> : null}
			{props.label}{marker}
			{props.labelTooltip != null
				? <Tooltip trigger={<span className="vx-field-label-tip" aria-hidden="true">{'?'}</span>} content={props.labelTooltip} placement="top" />
				: null}
		</label>
		{props.description != null ? <span className="vx-field-description">{props.description}</span> : null}
	</div>
}
