/** @jsxImportSource @octane-xplat/jsx */
import { useId, useRef, useState } from 'octane'
import type { CheckboxGroupProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { useFieldControl } from './field-context'
import { FormField } from './FormField.macos.tsrx'
import { CheckboxListProvider } from './option-list-contexts'
import { CheckboxListItem } from './CheckboxListItem.macos.tsrx'

/** Multi-choice options and child parts share one checked-set owner. */
export function CheckboxGroup(inputProps: CheckboxGroupProps): unknown @{
	const { props, inField } = useFieldControl(inputProps)
	const generatedID = useId()
	const controlID = props.id ?? generatedID
	const [internal, setInternal] = useState<string[]>(props.defaultValue ?? [])
	const controlled = props.value !== undefined
	const selected = controlled ? props.value! : internal
	const liveSelected = useRef(selected)
	liveSelected.current = selected
	const select = (value: string, on = true) => {
		if (props.isDisabled || props.isReadOnly) return
		const current = liveSelected.current
		if (current.includes(value) === on) return
		const next = on ? [...current, value] : current.filter((key) => key !== value)
		if (!controlled) { liveSelected.current = next; setInternal(next) }
		props.onValueChange?.(next)
	}
	const context = { selected, select, isDisabled: props.isDisabled, isReadOnly: props.isReadOnly, size: props.size }
	const group = <CheckboxListProvider value={context}>
		<masonview id={controlID} className={cx('vx-checkbox-group', 'vx-checkbox-group--appkit',
			props.horizontal && 'vx-checkbox-group--row', props.hasDividers && 'vx-checkbox-group--divided',
			props.isDisabled && 'vx-checkbox-group--disabled', props.isReadOnly && 'vx-checkbox-group--readonly',
			props.isLoading && 'vx-checkbox-group--loading', props.status && `vx-checkbox-group--status-${props.status.type}`,
			props.size && `vx-checkbox-group--size-${props.size}`, props.className)} style={props.style}
			accessibilityRole="group" accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
			accessibilityHint={props.accessibilityHint} accessibilityState={{ disabled: props.isDisabled, readonly: props.isReadOnly,
				busy: props.isLoading, required: props.isRequired && !props.isOptional, invalid: props.status?.type === 'error' }}>
			{props.options?.map((option, index) => <CheckboxListItem key={option.value} {...option} id={`${controlID}-option-${index}`} />)}
			{props.children}
		</masonview>
	</CheckboxListProvider>
	@if (inField) {
		{group}
	} @else {
		<FormField inputID={controlID} label={props.label} description={props.description} status={props.status}
			statusVariant={props.statusVariant} isRequired={props.isRequired} isOptional={props.isOptional}
			isDisabled={props.isDisabled} isReadOnly={props.isReadOnly} isLoading={props.isLoading}
			isLabelHidden={props.isLabelHidden} disabledMessage={props.disabledMessage} labelTooltip={props.labelTooltip}
			width={props.width} size={props.size}>{group}</FormField>
	}
}
