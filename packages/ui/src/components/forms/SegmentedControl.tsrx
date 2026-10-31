/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useContext, useState } from 'octane'
import type { SegmentedControlProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from '../overlays/escape-props'
import { FieldContext, useFieldControlProps } from './field-context'
import { NativeToggleField } from './NativeToggleField'
import { SegmentedControlItem } from './SegmentedControlItem.tsrx'
import { SegmentedControlProvider } from './option-list-contexts'

/** Self-drawn segmented control — equal-width segments in a track, one
 *  selected (`--on`); single-choice segments share one field and selection
 *  owner. Options come from `options` or `SegmentedControlItem` children;
 *  `layout="fill"` stretches segments to the full width. */
function SegmentedControlBody(inputProps: SegmentedControlProps) @{
	const props = useFieldControlProps(inputProps)
	const [internal, setInternal] = useState(props.defaultValue)
	const current = props.value ?? internal
	const isBlocked = props.isDisabled || props.isReadOnly
	const select = (value: string) => {
		if (isBlocked || value === current) return
		if (props.value === undefined) setInternal(value)
		props.onValueChange?.(value)
	}
	const ctx = {
		selected: current,
		select,
		isDisabled: props.isDisabled,
		isReadOnly: props.isReadOnly,
		size: props.size,
	}

	<masonview
		ref={(view: any) => applyEscapeProps(view, props)}
		id={props.id}
		className={cx('vx-segmented', 'vx-segmented--native',
			props.layout === 'fill' && 'vx-segmented--fill',
			props.isDisabled && 'vx-segmented--disabled',
			props.isReadOnly && 'vx-segmented--readonly',
			props.isLoading && 'vx-segmented--loading',
			props.status && `vx-segmented--status-${props.status.type}`,
			props.size && `vx-segmented--size-${props.size}`,
			props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
		isEnabled={!props.isDisabled}
		accessibilityRole={nativeAccessibilityRole('radiogroup')}
		accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled,
			readOnly: props.isReadOnly, required: props.isRequired, busy: props.isLoading,
			invalid: props.status?.type === 'error' })}
	>
		<SegmentedControlProvider value={ctx}>
			@for (const option of props.options ?? []; key option.value) {
				<SegmentedControlItem value={option.value} label={option.label ?? option.value}
					isDisabled={option.isDisabled} />
			}
			{props.children}
		</SegmentedControlProvider>
	</masonview>
}

export function SegmentedControl(props: SegmentedControlProps) @{
	const inField = useContext(FieldContext) != null
	@if (inField) {
		<SegmentedControlBody {...props} />
	} @else {
		<NativeToggleField {...props} inlineLabel={false} isGroupLabel>
			<SegmentedControlBody {...props} />
		</NativeToggleField>
	}
}
