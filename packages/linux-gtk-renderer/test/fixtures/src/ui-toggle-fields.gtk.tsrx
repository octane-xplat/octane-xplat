/** @jsxImportSource @octane-xplat/jsx */
import { FormLayout, Field, SizeProvider } from '@octane-xplat/ui'
import type { FieldControlSize } from '@octane-xplat/ui'
import type { SwitchProps } from '@octane-xplat/ui'
import { CheckboxInput as Checkbox, Switch } from '@octane-xplat/ui'
export const changes: Array<[string, boolean]> = []
export const actions: Array<[string, boolean]> = []
const pending = new Map<string, { resolve: () => void; reject: (error: Error) => void }>()
const changeAction = (name: string, value: boolean, throws = false) => {
	if (throws) { actions.push([name, value]); throw new Error('Fixture synchronous action error') }
	actions.push([name, value])
	return new Promise<void>((resolve, reject) => pending.set(name, { resolve, reject }))
}
export const hasPending = (name: string) => pending.has(name)
export function settle(name: string, okay: boolean) {
	const action = pending.get(name)
	if (!action) throw new Error('No pending action: ' + name)
	pending.delete(name)
	if (okay) action.resolve()
	else action.reject(new Error('Fixture action rejected'))
}
export function ToggleFields(props: {
	width: number | string; required?: boolean; loading?: boolean; readOnly?: boolean;
	hidden?: boolean; disabled?: boolean; optional?: boolean;
	size?: FieldControlSize; checkboxValue?: boolean | 'indeterminate'; switchValue?: boolean;
	labelPosition?: SwitchProps['labelPosition']; labelSpacing?: SwitchProps['labelSpacing'];
	status?: boolean; throws?: boolean; opacity?: number; hint?: string;
}) @{
	<SizeProvider value={props.size}>
	<FormLayout id="toggle-fields" defaultOptionality={props.required ? 'required' : undefined}
		style={{ width: 360, gap: 16 }}>
		<Checkbox value={props.checkboxValue} id="field-checkbox" testID="checkbox-automation" label="Keep receipts" description="Checkbox help"
			status={props.status === false ? undefined : { type: 'error', message: 'Checkbox issue' }} disabledMessage="Checkbox locked"
			labelTooltip="Checkbox tip" className="fixture-toggle" style={{ opacity: props.opacity }}
			accessibilityHint={props.hint} width={props.width} defaultValue={false} isOptional={props.optional}
			isLoading={props.loading} isReadOnly={props.readOnly} isDisabled={props.disabled}
			isLabelHidden={props.hidden}
			onChange={(value) => changes.push(['checkbox', value])}
			changeAction={(value) => changeAction('checkbox', value, props.throws)} />
		<Switch value={props.switchValue} labelPosition={props.labelPosition} labelSpacing={props.labelSpacing}
			id="field-switch" testID="switch-automation" label="Notifications" description="Switch help"
			status={props.status === false ? undefined : { type: 'error', message: 'Switch issue' }} disabledMessage="Switch locked"
			labelTooltip="Switch tip" className="fixture-toggle" style={{ opacity: props.opacity }}
			width={props.width} defaultValue={false} isOptional={props.optional}
			isLoading={props.loading} isReadOnly={props.readOnly} isDisabled={props.disabled}
			isLabelHidden={props.hidden}
			onChange={(value) => changes.push(['switch', value])}
			changeAction={(value) => changeAction('switch', value, props.throws)} />
	</FormLayout>
	</SizeProvider>
}


export function ToggleContexts(props: { active?: boolean; overrideSize?: boolean }) @{
	<SizeProvider value="sm">
		<FormLayout id="toggle-contexts" defaultOptionality="required" style={{ width: 360, gap: 16 }}>
			<Field id="context-checkbox-field" inputID="context-checkbox" label="Context checkbox"
				description="Inherited checkbox help" status={props.active ? { type: 'error', message: 'Inherited issue' } : undefined}
				width={240} isOptional={props.active} isDisabled={props.active} isReadOnly={props.active}
				isLoading={props.active} disabledMessage="Inherited lock">
				<Checkbox accessibilityLabel="Custom context name" size={props.overrideSize ? 'lg' : undefined}
					defaultValue="indeterminate" onChange={(value) => changes.push(['context-checkbox', value])}
					changeAction={(value) => changeAction('context-checkbox', value)} />
			</Field>
			<Field id="context-switch-field" inputID="context-switch" label="Context switch"
				description="Inherited switch help" width={240} isOptional={props.active}
				isDisabled={props.active} isReadOnly={props.active} isLoading={props.active}>
				<Switch defaultValue size={props.overrideSize ? 'lg' : undefined}
					onChange={(value) => changes.push(['context-switch', value])}
					changeAction={(value) => changeAction('context-switch', value)} />
			</Field>
		</FormLayout>
	</SizeProvider>
}
