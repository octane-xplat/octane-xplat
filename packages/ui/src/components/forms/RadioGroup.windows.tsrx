/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useCallback, useEffect, useRef, useState } from 'octane'
import type { View } from '@nativescript/core'
import { WindowsRadioGroup } from './radio-control.windows'
import { WindowsRadioProvider } from './radio-context.windows'
import { RadioListItem } from './RadioListItem.windows'
import type { RadioGroupProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityState } from '../overlays/escape-props'
import { useFieldControlProps } from './field-context'
import { RadioListProvider } from './option-list-contexts'

/** Self-drawn radio group — dot options in a column (or row with
 *  `horizontal`). Options come from the `options` prop or `RadioListItem`
 *  children (Astryx child part). */
export function RadioGroup(inputProps: RadioGroupProps) @{
	const props = useFieldControlProps(inputProps)
	const [internal, setInternal] = useState(props.defaultValue)
	const current = props.value ?? internal
	const select = (value: string) => {
		if (props.isDisabled || props.isReadOnly || current === value) {
			return
		}

		if (props.value === undefined) {
			setInternal(value)
		}

		props.onValueChange?.(value)
	}

	const groupRef = useRef<WindowsRadioGroup | null>(null)
	if (!groupRef.current) {
		groupRef.current = new WindowsRadioGroup()
	}

	const group = groupRef.current
	const bindRoot = useCallback(
		(view: View | null) => {
			group.root = view
		},
		[group],
	)

	useEffect(() => {
		group.update(current, Boolean(props.isDisabled), Boolean(props.isReadOnly), select)
		applyEscapeProps(group.root, props)
	}, [group, current, props])

	useEffect(() => () => group.cancelFocusReset(), [group])

	const ctx = {
		selected: current as string | undefined,
		select,
		isDisabled: props.isDisabled,
		isReadOnly: props.isReadOnly,
		size: props.size,
	}

	<masonview
		ref={bindRoot}
		id={props.id}
		className={cx(
			'vx-radio-group',
			props.horizontal && 'vx-radio-group--row',
			props.isDisabled && 'vx-radio-group--disabled',
			props.isReadOnly && 'vx-radio-group--readonly',
			props.isLoading && 'vx-radio-group--loading',
			props.status && `vx-radio-group--status-${props.status.type}`,
			props.size && `vx-radio-group--size-${props.size}`,
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
		<WindowsRadioProvider value={group}>
			<RadioListProvider value={ctx}>
				{(props.options ?? []).map((opt) => (
					<RadioListItem key={opt.value} {...opt} />
				))}
				{props.children}
			</RadioListProvider>
		</WindowsRadioProvider>
	</masonview>
}
