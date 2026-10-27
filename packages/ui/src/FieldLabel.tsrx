/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import type { FieldLabelProps } from './props'
import { applyEscapeProps } from './escape-props'

/** `FieldLabel` — standalone field label row (Astryx part): label text and
 *  required/optional marker; `labelTooltip` folds into the accessibility
 *  hint on native. */
export function FieldLabel(props: FieldLabelProps) @{
	const text = props.isRequired && !props.isOptional
		? `${props.label} · Required`
		: props.isOptional
			? `${props.label} · Optional`
			: props.label

	<masonview ref={(e: any) => applyEscapeProps(e, props)} id={props.id} className={['vx-fieldlabel', props.className]} style={mergeStyle({display: "flex"}, props.style)} accessibilityHint={props.labelTooltip}>
		{props.labelIcon != null ? <masonview className="vx-field-label-icon" style={{display: "flex"}}>{props.labelIcon}</masonview> : null}
		<label className="vx-field-label" text={text} />
		{props.description != null ? <label className="vx-field-description" text={props.description} /> : null}
	</masonview>
}
