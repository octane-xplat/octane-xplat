/** @jsxImportSource @octane-xplat/jsx */
import type { NSView } from '@octane-xplat/platform/macos'
import { useEffect, useRef, useState } from 'octane'
import type { SegmentedControlProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { mergeStyle } from '../../internal/layout/style-merge'
import { useFieldControlProps } from './field-context'
import { AppKitSegmentedProvider } from '../actions/segmented-control-context.macos'
import { bindSegmentedControlKeys } from '../actions/segmented-control-keys.macos'
import type { AppKitSegment } from '../actions/segmented-control-keys.macos'
import { SegmentedControlItem } from './SegmentedControlItem.macos.tsrx'
import { useDirection } from '../../internal/platform/internationalization'

/** Self-drawn AppKit selection track; options and child items share state. */
export function SegmentedControl(inputProps: SegmentedControlProps): unknown @{
	const props = useFieldControlProps(inputProps)
	const [internal, setInternal] = useState(props.defaultValue)
	const current = props.value ?? internal
	const root = useRef<NSView | null>(null)
	const segments = useRef(new Map<NSView, () => AppKitSegment>())
	const textDirection = useDirection()
	const direction = useRef(textDirection)
	direction.current = textDirection
	const select = (value: string) => {
		if (props.isDisabled || props.isReadOnly) {
			return
		}

		if (props.value === undefined) {
			setInternal(value)
		}

		props.onValueChange?.(value)
	}

	const ctx = {
		selected: current,
		select,
		isDisabled: props.isDisabled,
		isReadOnly: props.isReadOnly,
		size: props.size,
		segments: segments.current,
	}

	useEffect(
		() =>
			bindSegmentedControlKeys(
				() => root.current,
				segments.current,
				() => direction.current,
			),
		[],
	)

	<AppKitSegmentedProvider value={ctx}>
		<masonview
			ref={(view: NSView | null) => {
				root.current = view
			}}
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
			accessibilityRole="radiogroup"
			accessibilityLabel={
				props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
			}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={{ disabled: props.isDisabled }}
		>
			@for (const option of props.options ?? []; key option.value) {
				<SegmentedControlItem
					value={option.value}
					label={option.label}
					isDisabled={option.isDisabled}
				/>
			}
			{props.children}
		</masonview>
	</AppKitSegmentedProvider>
}
