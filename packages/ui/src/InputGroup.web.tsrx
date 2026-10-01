import { useId } from 'octane';
import type { InputGroupProps, InputGroupTextProps } from './props';
import { applyEscapeProps } from './escape-props';
import { applyWebProps } from './platformProps.web';
import { FormField } from './FormField.web.tsrx';
import { InputGroupProvider } from './input-group-context';

/** InputGroup — a labeled, visually joined input surface: the `Field`
 *  carries label/description/status with `isGroupLabel` so the label ids
 *  feed the inner `role="group"` element's aria-labelledby; members read
 *  `useInputGroup()` and drop their own borders into the shared skin. */
export function InputGroup(props: InputGroupProps) @{
	const groupId = useId();
	const labelId = `${groupId}-label`;
	const descriptionId = props.description != null ? `${groupId}-description` : undefined;
	const statusId = props.status?.message != null ? `${groupId}-status` : undefined;
	const group = { isDisabled: props.isDisabled, size: props.size };

	<FormField
		label={props.label}
		isLabelHidden={props.isLabelHidden}
		isGroupLabel={true}
		labelID={labelId}
		description={props.description}
		descriptionID={descriptionId}
		status={props.status}
		statusID={statusId}
		isDisabled={props.isDisabled}
		isRequired={props.isRequired}
		isOptional={props.isOptional}
		size={props.size}
		labelTooltip={props.labelTooltip}
		id={props.id}
		className={props.className}
		style={props.style}
		web={props.web}
	>
		<InputGroupProvider value={group}>
			<div
				ref={(e: any) => { if (e) { applyEscapeProps(e, props); applyWebProps(e, props.web); props.bind?.(e); } }}
				className={['vx-inputgroup', props.isDisabled ? 'vx-inputgroup--disabled' : undefined, props.status ? `vx-inputgroup--status-${props.status.type}` : undefined, props.size ? `vx-inputgroup--size-${props.size}` : undefined]}
				role="group"
				aria-labelledby={labelId}
				aria-describedby={[descriptionId, statusId].filter(Boolean).join(' ') || undefined}
				aria-disabled={props.isDisabled || undefined}
				aria-invalid={props.status?.type === 'error' || undefined}
			>
				{props.children}
			</div>
		</InputGroupProvider>
	</FormField>
}

/** InputGroupText — a prefix/suffix segment ('$', 'https://', units) inside
 *  an InputGroup. Non-interactive chrome; keeps the group's shared surface
 *  but only draws its own edge borders. */
export function InputGroupText(props: InputGroupTextProps) @{
	<span
		id={props.id}
		ref={(e: any) => { if (e) { applyEscapeProps(e, props); applyWebProps(e, props.web); props.bind?.(e); } }}
		className={['vx-inputgroup-text', props.className]}
		style={props.style}
	>
		{props.children}
	</span>
}
