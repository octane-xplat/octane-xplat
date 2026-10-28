/** @jsxImportSource @octane-xplat/jsx */
import { View } from '@octane-xplat/ui'
import { TextInput } from '../../../../ui/src/TextInput'
import { FormField } from '../../../../ui/src/FormField'
import type { TextInputHandle, FieldStatusVariant } from '../../../../ui/src/props'

export const inputRef: { current: TextInputHandle | null } = { current: null }
export const actions: string[] = []
export function FieldChrome(props: {
	bareWidth: number | string
	fieldWidth: number | string
	variant: FieldStatusVariant
	message: string
	loading?: boolean
	readOnly?: boolean
	disabled?: boolean
	size?: 'sm' | 'md' | 'lg'
}) @{
	<View id="field-root" style={{ width: 400, height: 500 }}>
		<TextInput id="bare" ref={inputRef} defaultValue="Seed" hasClear width={props.bareWidth}
			onChange={(value) => actions.push('change:' + value)} onClear={() => actions.push('clear')} />
		<TextInput id="field" defaultValue="Account" label="Account" labelTooltip="Work account"
			description="Use your account" status={{ type: 'error', message: props.message }}
			statusVariant={props.variant} width={props.fieldWidth} isLoading={props.loading}
			isReadOnly={props.readOnly} isDisabled={props.disabled} size={props.size} />
		<FormField id="external" label="External" width="80%">
			<TextInput id="inside" defaultValue="Nested" width="50%" />
		</FormField>
		<textfield id="field-peer" text="Peer" style={{ width: 200, height: 32 }} />
	</View>
}
