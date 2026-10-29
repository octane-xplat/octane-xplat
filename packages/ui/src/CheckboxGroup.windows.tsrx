/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useState } from 'octane'
import type { View } from '@nativescript/core'
import type { CheckboxGroupProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityState } from './escape-props'
import { Checkbox } from './Checkbox'
import { useFieldControlProps } from './field-context'
import { CheckboxListProvider } from './option-list-contexts'

/** CheckboxGroup — multi-select list of self-drawn checkboxes. Options
 *  come from the `options` prop or `CheckboxListItem` children;
 *  `hasDividers` adds the divided class. */
export function CheckboxGroup(inputProps: CheckboxGroupProps) @{
	const props = useFieldControlProps(inputProps)
	const [internal, setInternal] = useState<string[]>(props.defaultValue ?? [])
	const controlled = props.value !== undefined
	const selected = controlled ? props.value! : internal
	const size = props.density === 'compact' ? 'sm' : props.size

	const setSelected = (next: string[]) => {
		if (!controlled) {
			setInternal(next)
		}

		props.onValueChange?.(next)
	}

	const toggle = (v: string, on: boolean) => {
		if (props.isDisabled || props.isReadOnly || selected.includes(v) === on) {
			return
		}

		setSelected(on ? [...selected, v] : selected.filter((x) => x !== v))
	}

	const isReadOnly = props.isReadOnly
	const ctx = {
		selected,
		select: (v: string, on?: boolean) => toggle(v, on ?? true),
		isDisabled: props.isDisabled,
		isReadOnly: props.isReadOnly,
		size,
	}

	<masonview
		ref={(view: View | null) => applyEscapeProps(view, props)}
		id={props.id}
		className={cx(
			'vx-checkbox-group',
			props.horizontal && 'vx-checkbox-group--row',
			props.hasDividers && 'vx-checkbox-group--divided',
			props.isDisabled && 'vx-checkbox-group--disabled',
			isReadOnly && 'vx-checkbox-group--readonly',
			props.isLoading && 'vx-checkbox-group--loading',
			props.status && `vx-checkbox-group--status-${props.status.type}`,
			size && `vx-checkbox-group--size-${size}`,
			props.className,
		)}
		style={mergeStyle(
			{ flexDirection: props.horizontal ? 'row' : 'column' },
			mergeStyle({ display: 'flex' }, props.style),
		)}
		accessibilityLabel={
			props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
		}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled })}
	>
		@for (const opt of props.options ?? []; key opt.value) {
			<Checkbox
				value={selected.includes(opt.value)}
				isDisabled={props.isDisabled || opt.isDisabled}
				isReadOnly={isReadOnly}
				label={opt.label}
				accessibilityLabel={opt.label ?? opt.value}
				size={size}
				description={opt.description}
				onChange={(on: boolean) => toggle(opt.value, on)}
			/>
		}
		{props.children != null ? (
			<CheckboxListProvider value={ctx}>{props.children}</CheckboxListProvider>
		) : null}
	</masonview>
}
