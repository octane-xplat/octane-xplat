/** @jsxImportSource @octane-xplat/jsx */
import { FormLayout, Text, Field, SizeProvider, View } from '@octane-xplat/ui'
import type { FieldControlSize } from '@octane-xplat/ui'
import type { RadioOption } from '@octane-xplat/ui'
import { RadioList as RadioGroup, RadioListItem } from '@octane-xplat/ui'
export const changes: Array<[string, string]> = []
export interface RadioSceneProps {
	readOnly?: boolean; loading?: boolean; disabled?: boolean; optional?: boolean;
	value?: string; childValue?: string; defaultValue?: string; childDefaultValue?: string;
	empty?: boolean; reverse?: boolean; enableMiddle?: boolean; horizontal?: boolean;
	rtl?: boolean; hidden?: boolean; width?: number | string; size?: FieldControlSize;
	opacity?: number; longDescription?: boolean;
}
export function RadioScene(props: RadioSceneProps) @{
	const options: RadioOption[] = [
		{ value: 'alpha', label: 'Alpha', description: props.longDescription ? 'Delivery details '.repeat(12) : 'First delivery', endContent: <Text>Free</Text> },
		{ value: 'beta', label: 'Beta', isDisabled: !props.enableMiddle },
		{ value: 'gamma', label: 'Gamma' },
	]
	const childOptions: RadioOption[] = [
		{ value: 'card', label: 'Card', description: 'Pay by card' },
		{ value: 'cash', label: 'Cash', isDisabled: !props.enableMiddle },
		{ value: 'wallet', label: 'Wallet' },
	]
	const ordered = props.empty ? [] : props.reverse ? [...options].reverse() : options
	const orderedChildren = props.empty ? [] : props.reverse ? [...childOptions].reverse() : childOptions
	<SizeProvider value={props.size}>
	<FormLayout id="radio-form" defaultOptionality="required"
		style={{ width: 360, gap: 16, direction: props.rtl ? 'rtl' : 'ltr' }}>
		<textfield id="radio-before" text="Before" />
		<RadioGroup id="radio-options" label="Delivery" description="Choose delivery"
			status={{ type: 'error', message: 'Delivery issue' }} width={props.width ?? 220}
			className="fixture-radio" style={{ opacity: props.opacity }}
			isReadOnly={props.readOnly} isLoading={props.loading} isDisabled={props.disabled}
			isOptional={props.optional} isLabelHidden={props.hidden} horizontal={props.horizontal}
			value={props.value} defaultValue={props.defaultValue ?? 'alpha'}
			onValueChange={(value) => changes.push(['options', value])} options={ordered} />
		<RadioGroup id="radio-children" label="Payment" width={props.width ?? 220}
			isReadOnly={props.readOnly} isLoading={props.loading} isDisabled={props.disabled}
			isOptional={props.optional} isLabelHidden={props.hidden} horizontal={props.horizontal}
			value={props.childValue} defaultValue={props.childDefaultValue ?? 'card'}
			onValueChange={(value) => changes.push(['children', value])}>
			{orderedChildren.map((option) => (
				<RadioListItem key={option.value} id={'radio-' + option.value}
					value={option.value} label={option.label} description={option.description}
					isDisabled={option.isDisabled} />
			))}
		</RadioGroup>
		<textfield id="radio-after" text="After" />
	</FormLayout>
	</SizeProvider>
}
export function RadioContextScene(props: { active?: boolean; override?: boolean }) @{
	<SizeProvider value="sm">
		<FormLayout style={{ width: 360 }}>
			<Field label="Shipping" isGroupLabel width={280} isRequired={!props.active}
				isOptional={props.active} isDisabled={props.active} isReadOnly={props.active}
				isLoading={props.active} description="Shared field help"
				status={props.active ? { type: 'error', message: 'Shared issue' } : undefined}
				disabledMessage="Field lock">
				<RadioGroup id="radio-context" defaultValue="one" size={props.override ? 'lg' : undefined}
					accessibilityLabel={props.override ? 'Custom shipping' : undefined}
					options={[{ value: 'one', label: 'One' }, { value: 'two', label: 'Two' }]}
					onValueChange={(value) => changes.push(['context', value])} />
			</Field>
		</FormLayout>
	</SizeProvider>
}
export function RadioStandaloneScene() @{
	<View style={{ width: 300 }}>
		<textfield id="standalone-before" text="Before" />
		<RadioListItem id="radio-presentational" value="plain" label="Presentational" />
		<textfield id="standalone-after" text="After" />
	</View>
}
