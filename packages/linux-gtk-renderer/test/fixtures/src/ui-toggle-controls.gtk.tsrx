/** @jsxImportSource @octane-xplat/jsx */
import { View } from '@octane-xplat/ui'
import { CheckboxInput as Checkbox, Switch } from '@octane-xplat/ui'
export const changes: Array<[string, boolean]> = []
export function ToggleControls(props: { disabled?: boolean; readOnly?: boolean; loading?: boolean }) @{
	<View style={{ width: 360, height: 300, gap: 16 }}>
		<Checkbox id="toggle-checkbox" label="Keep receipts" defaultValue={false}
			isDisabled={props.disabled} isReadOnly={props.readOnly} isLoading={props.loading}
			onChange={(value) => changes.push(['checkbox', value])} />
		<Checkbox id="toggle-mixed" label="Select page" value="indeterminate"
			onChange={(value) => changes.push(['mixed', value])} />
		<Switch id="toggle-switch" label="Notifications" defaultValue={false}
			isDisabled={props.disabled} isReadOnly={props.readOnly} isLoading={props.loading}
			onChange={(value) => changes.push(['switch', value])} />
		<textfield id="toggle-peer" text="Peer" />
	</View>
}
