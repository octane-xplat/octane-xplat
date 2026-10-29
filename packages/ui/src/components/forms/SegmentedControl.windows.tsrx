/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useCallback, useEffect, useRef, useState } from 'octane'
import type { View } from '@nativescript/core'
import { WindowsRadioGroup } from './radio-control.windows'
import { WindowsRadioProvider } from './radio-context.windows'
import { SegmentedControlItem } from './SegmentedControlItem.windows'
import type { SegmentedControlProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityState } from '../overlays/escape-props'
import { useFieldControlProps } from './field-context'
import { SegmentedControlProvider } from './option-list-contexts'

/** Self-drawn segmented control — equal-width segments in a track, one
 *  selected (`--on`). Options come from `options` or `SegmentedControlItem`
 *  children; `layout="fill"` stretches segments to the full width. */
export function SegmentedControl(inputProps: SegmentedControlProps) @{
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
			'vx-segmented',
			props.layout === 'fill' && 'vx-segmented--fill',
			props.isDisabled && 'vx-segmented--disabled',
			props.isReadOnly && 'vx-segmented--readonly',
			props.isLoading && 'vx-segmented--loading',
			props.status && `vx-segmented--status-${props.status.type}`,
			props.size && `vx-segmented--size-${props.size}`,
			props.className,
		)}
		style={mergeStyle({ display: 'flex' }, props.style)}
		accessibilityLabel={
			props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
		}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled })}
	>
		<WindowsRadioProvider value={group}>
			<SegmentedControlProvider value={ctx}>
				{(props.options ?? []).map((opt) => (
					<SegmentedControlItem
						key={opt.value}
						value={opt.value}
						label={opt.label}
						isDisabled={opt.isDisabled}
					/>
				))}
				{props.children}
			</SegmentedControlProvider>
		</WindowsRadioProvider>
	</masonview>
}
