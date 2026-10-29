/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useState, useContext } from 'octane'
import type { CheckboxProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import {
	applyEscapeProps,
	nativeAccessibilityRole,
	nativeAccessibilityState,
} from '../overlays/escape-props'

import { FieldContext, useFieldControlProps } from './field-context'
import { CheckboxIndicator, indicatorScope } from '../feedback/indicators'
import { useIndicator } from '../feedback/use-indicator'

/** Self-drawn checkbox — box + ✓ glyph, identical layout across targets.
 *  Toggles on tap. */
function CheckboxControl(inputProps: CheckboxProps) @{
	const inField = useContext(FieldContext) != null
	const props = useFieldControlProps(inputProps)
	const [internal, setInternal] = useState(props.defaultValue ?? false)
	const resolved = props.value ?? internal
	const indeterminate = resolved === 'indeterminate'
	const checked = resolved === true
	const isBlocked = props.isDisabled || props.isReadOnly
	const [pending, setPending] = useState(false)
	const Ind = useIndicator('checkbox') ?? CheckboxIndicator
	const indState = indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked'
	const toggle = () => {
		const next = indeterminate ? true : !checked
		if (props.value === undefined) {
			setInternal(next)
		}

		props.onChange?.(next)
		if (!props.changeAction) {
			return
		}

		const previous = checked
		setPending(true)
		Promise.resolve(props.changeAction(next)).then(
			() => setPending(false),
			() => {
				if (props.value === undefined) {
					setInternal(previous)
				}

				props.onChange?.(previous)
				setPending(false)
			},
		)
	}

	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		testID={props.testID ?? ''}
		className={cx(
			'vx-checkbox-row',
			indicatorScope,
			checked && 'vx-checkbox--on',
			props.isDisabled && 'vx-checkbox--disabled',
			props.isReadOnly && 'vx-checkbox--readonly',
			(props.isLoading || pending) && 'vx-checkbox--loading',
			props.status && `vx-checkbox--status-${props.status.type}`,
			props.size && `vx-checkbox--size-${props.size}`,
			props.className,
		)}
		style={mergeStyle({ display: 'flex' }, props.style)}
		accessibilityRole={nativeAccessibilityRole('checkbox')}
		accessibilityLabel={
			props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
		}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={indeterminate ? 'Partially selected' : undefined}
		accessibilityState={nativeAccessibilityState({
			disabled: props.isDisabled,
			checked: indeterminate ? 'mixed' : checked,
		})}
		onTap={isBlocked ? undefined : toggle}
	>
		<Ind state={indState} size={props.size === 'sm' ? 'sm' : 'md'} isDisabled={props.isDisabled} />
		{props.label != null || (!inField && props.description != null) ? (
			<masonview style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
				{props.label != null ? <label className="vx-checkbox-label" text={props.label} /> : null}
				{!inField && props.description != null ? (
					<label className="vx-field-description" text={props.description} />
				) : null}
			</masonview>
		) : null}
	</masonview>
}

/** Standalone Checkbox renders its own field chrome — an inline row plus a
 *  detached status line. Inside a FormField the field owns that chrome. */
export function Checkbox(props: CheckboxProps): unknown @{
	const inField = useContext(FieldContext) != null

	@if (inField || (props.description == null && props.status == null)) {
		<CheckboxControl {...props} />
	} @else {
		<masonview style={{ display: 'flex', flexDirection: 'column' }}>
			<CheckboxControl {...props} />
			{props.status?.message != null ? (
				<masonview
					className={cx(
						'vx-field-status',
						`vx-field-status--${props.status.type}`,
						'vx-field-status--detached',
					)}
				>
					<label text={props.status.message} />
				</masonview>
			) : null}
		</masonview>
	}
}
