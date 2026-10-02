/** @jsxImportSource @nativescript-community/octane */
import { useMemo, useId } from 'octane';
import type { InputGroupProps, InputGroupTextProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { FormField } from './FormField';
import { InputGroupProvider } from './input-group-context';

/** InputGroup — a labeled, visually joined input surface: the `Field`
 *  carries label/description/status; members read `useInputGroup()` and
 *  drop their own borders into the shared skin. NS has no group role —
 *  the row is a plain flexbox; label/description/status ids still flow to
 *  members through the FieldContext. */
export function InputGroup(props: InputGroupProps) @{
	const groupId = useId();
	const group = { isDisabled: props.isDisabled, size: props.size };

	const forwardedRef = useMemo(() => [(v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref], [props.ref, props.ios, props.android, props.web]);

	<FormField
		label={props.label}
		isLabelHidden={props.isLabelHidden}
		isGroupLabel={true}
		labelID={`${groupId}-label`}
		description={props.description}
		descriptionID={props.description != null ? `${groupId}-description` : undefined}
		status={props.status}
		statusID={props.status?.message != null ? `${groupId}-status` : undefined}
		isDisabled={props.isDisabled}
		isRequired={props.isRequired}
		isOptional={props.isOptional}
		size={props.size}
		labelTooltip={props.labelTooltip}
		id={props.id}
		className={props.className}
		style={props.style}
	>
		<InputGroupProvider value={group}>
			<flexboxlayout
				ref={forwardedRef}
				flexDirection="row"
				alignItems="stretch"
				className={cx('vx-inputgroup', props.isDisabled && 'vx-inputgroup--disabled', props.status && `vx-inputgroup--status-${props.status.type}`, props.size && `vx-inputgroup--size-${props.size}`)}
				accessibilityState={{ disabled: props.isDisabled } as any}
			>
				{props.children}
			</flexboxlayout>
		</InputGroupProvider>
	</FormField>
}

/** InputGroupText — a prefix/suffix segment inside an InputGroup. String
 *  children render as a label; components render as-is. */
export function InputGroupText(props: InputGroupTextProps) @{
	const forwardedRef = useMemo(() => [(v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref], [props.ref, props.ios, props.android, props.web]);

	<flexboxlayout
		id={props.id}
		ref={forwardedRef}
		className={cx('vx-inputgroup-text', props.className)}
		style={props.style}
		justifyContent="center"
		alignItems="center"
	>
		{typeof props.children === 'string' ? <label text={props.children} /> : props.children}
	</flexboxlayout>
}
