/** @jsxImportSource @octane-xplat/jsx */
import { FormField } from './FormField'
import type { FieldControlProps, Renderable } from './props'

/** Field width/state/status owner for toggles. Their row keeps its inline
 * label and description; external Field owners bypass this wrapper. */
export function NativeToggleField(props: FieldControlProps & { id?: string; children?: Renderable }) @{
	<FormField inputID={props.id} width={props.width} size={props.size}
		isDisabled={props.isDisabled} disabledMessage={props.disabledMessage}
		isReadOnly={props.isReadOnly} isLoading={props.isLoading}
		isRequired={props.isRequired} isOptional={props.isOptional}
		status={props.status} statusVariant={props.statusVariant}>
		{props.children}
	</FormField>
}
