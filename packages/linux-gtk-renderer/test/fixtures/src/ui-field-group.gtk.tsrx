/** @jsxImportSource @octane-xplat/jsx */
import { View, TextInput, Field, FormLayout, SizeProvider, FieldGroup, useFieldControl } from '@octane-xplat/ui'
import type { FieldControlProps, FieldControlSize, TextInputHandle } from '@octane-xplat/ui'
export const memberRefs: Array<TextInputHandle | null> = []
export const changes: string[] = []
export const readings: Record<string, ReturnType<typeof useFieldControl>> = {}
function ReadControl(props: FieldControlProps & { slot: string; id?: string; accessibilityLabel?: string; accessibilityHint?: string }) @{
	const result = useFieldControl(props)
	readings[props.slot] = result
	<label id={'probe-' + props.slot} text={result.props.accessibilityHint ?? 'No hint'} />
}
export function FieldGroupScene(props: {
	groupLabel?: string; width: number; disabled?: boolean; optional?: boolean;
	requiredDefault?: boolean; override?: string; ownSize?: FieldControlSize;
}) @{
	<SizeProvider value="sm">
		<View style={{ width: 400, height: 600 }}>
			<FieldGroup id="address-group" label={props.groupLabel} className="group-custom"
				style={{ width: props.width, height: 170 }}>
				<TextInput id="street" label="Street" defaultValue="Main"
					ref={(handle) => { memberRefs[0] = handle }} onChange={(value) => changes.push(value)} />
				<TextInput id="city" label="City" defaultValue="London"
					ref={(handle) => { memberRefs[1] = handle }} />
			</FieldGroup>
			<FormLayout defaultOptionality={props.requiredDefault ? 'required' : undefined}
				style={{ width: 350, gap: 8 }}>
				<Field label="Custom control" inputID="owned-control" labelID="owner-label"
					description="Shared help" descriptionID="owner-description"
					status={{ type: 'error', message: 'Fix value' }} statusID="owner-status"
					disabledMessage="Locked" isDisabled={props.disabled}
					isReadOnly isLoading isOptional={props.optional} size="lg">
					<ReadControl slot="inner" size={props.ownSize} accessibilityLabel={props.override}
						accessibilityHint="Local tip" isReadOnly={false} isLoading={false} />
				</Field>
				<ReadControl slot="outer" id="outside-control" label="Outside"
					description="Own help" isDisabled={props.disabled} />
			</FormLayout>
		</View>
	</SizeProvider>
}
