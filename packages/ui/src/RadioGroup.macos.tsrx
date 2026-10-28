/** @jsxImportSource @octane-xplat/jsx */
import { useId, useState } from 'octane'
import type { RadioGroupProps } from './props'
import { cx } from '@octane-xplat/lib'
import { useFieldControl } from './field-context'
import { FormField } from './FormField.macos.tsrx'
import { RadioListProvider } from './option-list-contexts'
import { RadioListItem } from './RadioListItem.macos.tsrx'

/** Options and child parts share selection and Field ownership on AppKit. */
export function RadioGroup(inputProps: RadioGroupProps) @{
	const { props, inField } = useFieldControl(inputProps)
	const generatedID = useId()
	const controlID = props.id ?? generatedID
	const [internal, setInternal] = useState(props.defaultValue)
	const current = props.value ?? internal
	const select = (value: string) => {
		if (props.isDisabled || props.isReadOnly || value === current) return
		if (props.value === undefined) setInternal(value)
		props.onValueChange?.(value)
	}
	const context = { selected: current, select, isDisabled: props.isDisabled, isReadOnly: props.isReadOnly, size: props.size }
	const group = <RadioListProvider value={context}>
		<masonview id={controlID} className={cx('vx-radio-group', 'vx-radio-group--appkit',
			props.horizontal && 'vx-radio-group--row', props.isDisabled && 'vx-radio-group--disabled',
			props.isReadOnly && 'vx-radio-group--readonly', props.isLoading && 'vx-radio-group--loading',
			props.status && `vx-radio-group--status-${props.status.type}`, props.size && `vx-radio-group--size-${props.size}`, props.className)}
			style={props.style} accessibilityRole="radiogroup"
			accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={{ disabled: props.isDisabled, readonly: props.isReadOnly, busy: props.isLoading,
				required: props.isRequired && !props.isOptional, invalid: props.status?.type === 'error' }}>
			{props.options?.map((option, index) => <RadioListItem key={option.value} {...option} id={`${controlID}-option-${index}`} />)}
			{props.children}
		</masonview>
	</RadioListProvider>
	@if (inField) {
		{group}
	} @else {
		<FormField inputID={controlID} label={props.label} description={props.description} status={props.status}
			statusVariant={props.statusVariant} isDisabled={props.isDisabled} isReadOnly={props.isReadOnly}
			isLoading={props.isLoading} isRequired={props.isRequired} isOptional={props.isOptional}
			isLabelHidden={props.isLabelHidden} disabledMessage={props.disabledMessage} labelTooltip={props.labelTooltip}
			width={props.width} size={props.size}>{group}</FormField>
	}
}
