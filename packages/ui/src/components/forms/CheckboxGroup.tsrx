/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useContext, useState } from 'octane'
import type { CheckboxGroupProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from '../overlays/escape-props'
import { FieldContext, useFieldControlProps } from './field-context'
import { NativeToggleField } from './NativeToggleField'
import { CheckboxListItem } from './CheckboxListItem.tsrx'
import { CheckboxListProvider } from './option-list-contexts'

/** CheckboxGroup — multi-select list of self-drawn checkboxes. Options and
 *  child parts share one checked-set and field owner; `hasDividers` adds
 *  the divided class. */
function CheckboxGroupControl(inputProps: CheckboxGroupProps): unknown @{
	const props = useFieldControlProps(inputProps)
	const [internal, setInternal] = useState<string[]>(props.defaultValue ?? [])
	const controlled = props.value !== undefined
	const selected = controlled ? props.value! : internal
	const blocked = props.isDisabled || props.isReadOnly
	const toggle = (value: string, on: boolean) => {
		if (blocked || selected.includes(value) === on) return
		const next = on ? [...selected, value] : selected.filter(item => item !== value)
		if (!controlled) setInternal(next)
		props.onValueChange?.(next)
	}
	const ctx = {
		selected,
		select: (value: string, on?: boolean) => toggle(value, on ?? true),
		isDisabled: props.isDisabled,
		isReadOnly: props.isReadOnly,
		size: props.density === 'compact' ? 'sm' as const : props.size,
	}

	<masonview
		ref={(view: any) => applyEscapeProps(view, props)}
		id={props.id}
		className={cx('vx-checkbox-group', 'vx-checkbox-group--native',
			props.horizontal && 'vx-checkbox-group--row',
			props.hasDividers && 'vx-checkbox-group--divided',
			props.isDisabled && 'vx-checkbox-group--disabled',
			props.isReadOnly && 'vx-checkbox-group--readonly',
			props.isLoading && 'vx-checkbox-group--loading',
			props.status && `vx-checkbox-group--status-${props.status.type}`,
			props.size && `vx-checkbox-group--size-${props.size}`,
			props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
		isEnabled={!props.isDisabled}
		accessibilityRole={nativeAccessibilityRole('group')}
		accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled,
			readOnly: props.isReadOnly, required: props.isRequired, busy: props.isLoading,
			invalid: props.status?.type === 'error' })}
	>
		<CheckboxListProvider value={ctx}>
			@for (const option of props.options ?? []; key option.value) {
				<CheckboxListItem value={option.value} label={option.label}
					description={option.description} endContent={option.endContent}
					isDisabled={option.isDisabled} />
			}
			{props.children}
		</CheckboxListProvider>
	</masonview>
}

export function CheckboxGroup(props: CheckboxGroupProps): unknown @{
	const inField = useContext(FieldContext) != null
	@if (inField) {
		<CheckboxGroupControl {...props} />
	} @else {
		<NativeToggleField {...props} inlineLabel={false} isGroupLabel>
			<CheckboxGroupControl {...props} />
		</NativeToggleField>
	}
}
