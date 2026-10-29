/** @jsxImportSource @octane-xplat/jsx */
import { FormField } from './FormField'
import type { FieldControlProps, Renderable } from './props'

/** Field owner for native selection controls. Boolean toggles keep inline
 * labels; groups can delegate their heading to FormField. An existing Field
 * bypasses this wrapper. */
export function NativeToggleField(props: FieldControlProps & { id?: string; children?: Renderable; inlineLabel?: boolean; isGroupLabel?: boolean }) @{
	<FormField inputID={props.id} width={props.width} size={props.size}
		label={props.inlineLabel === false ? props.label : undefined}
		description={props.inlineLabel === false ? props.description : undefined}
		labelTooltip={props.inlineLabel === false ? props.labelTooltip : undefined}
		isLabelHidden={props.isLabelHidden} isGroupLabel={props.isGroupLabel}
		isDisabled={props.isDisabled} disabledMessage={props.disabledMessage}
		isReadOnly={props.isReadOnly} isLoading={props.isLoading}
		isRequired={props.isRequired} isOptional={props.isOptional}
		status={props.status} statusVariant={props.statusVariant}>
		{props.children}
	</FormField>
}
