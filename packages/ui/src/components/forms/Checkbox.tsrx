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
import { FormLayoutContext } from './form-layout-context'
import { CheckboxIndicator, indicatorScope } from '../feedback/indicators'
import { useIndicator } from '../feedback/use-indicator'
import { NativeToggleField } from '../../NativeToggleField'

function CheckboxControl(inputProps: CheckboxProps & { standalone?: boolean }) @{
	const props = useFieldControlProps(inputProps)
	const form = useContext(FormLayoutContext)
	const [internal, setInternal] = useState(props.defaultValue ?? false)
	const resolved = props.value ?? internal
	const indeterminate = resolved === 'indeterminate'
	const checked = resolved === true
	const isBlocked = props.isDisabled || props.isReadOnly
	const [pending, setPending] = useState(false)
	const loading = props.isLoading || pending
	const Ind = useIndicator('checkbox') ?? CheckboxIndicator
	const indState = indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked'
	const toggle = () => {
		if (isBlocked) return
		const next = indeterminate ? true : !checked
		if (props.value === undefined) setInternal(next)
		props.onChange?.(next)
		if (!props.changeAction) return
		const previous = resolved
		setPending(true)
		Promise.resolve().then(() => props.changeAction!(next)).then(
			() => setPending(false),
			() => {
				if (props.value === undefined) setInternal(previous)
				props.onChange?.(previous === true)
				setPending(false)
			},
		)
	}
	const showLabel = props.label != null && !props.isLabelHidden
	const showDescription = props.standalone && props.description != null && !props.isLabelHidden
	const marker = props.isRequired && form.defaultOptionality !== 'required'
		? ' *' : props.isOptional && form.defaultOptionality !== 'optional' ? ' (Optional)' : ''
	<masonview ref={(v: any) => applyEscapeProps(v, props)} id={props.id} testID={props.testID ?? ''}
		className={cx('vx-checkbox-row', indicatorScope, checked && 'vx-checkbox--on',
			props.isDisabled && 'vx-checkbox--disabled', props.isReadOnly && 'vx-checkbox--readonly',
			loading && 'vx-checkbox--loading', props.status && `vx-checkbox--status-${props.status.type}`,
			props.size && `vx-checkbox--size-${props.size}`, props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
		isEnabled={!props.isDisabled}
		accessibilityRole={nativeAccessibilityRole('checkbox')}
		accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={indeterminate ? 'Partially selected' : undefined}
		accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled,
			checked: indeterminate ? 'mixed' : checked, readOnly: props.isReadOnly,
			required: props.isRequired, busy: loading, invalid: props.status?.type === 'error' })}
		onTap={isBlocked ? undefined : toggle}>
		<Ind state={indState} size={props.size === 'sm' ? 'sm' : 'md'} isDisabled={props.isDisabled} />
		<masonview style={{ display: showLabel || showDescription ? 'flex' : 'none',
			flexDirection: 'column', flexGrow: 1 }}>
			<label className="vx-checkbox-label" text={(props.label ?? '') + marker}
				accessibilityHint={props.labelTooltip}
				style={{ display: showLabel ? 'flex' : 'none' }} textWrap />
			<label className="vx-field-description" text={props.description ?? ''}
				style={{ display: showDescription ? 'flex' : 'none' }} textWrap />
		</masonview>
	</masonview>
}

/** Standalone Checkbox renders its own field chrome — an inline row plus a
 *  detached status line. Inside a FormField the field owns that chrome;
 *  standalone controls own one field frame and explicit Field owners retain
 *  theirs. */
export function Checkbox(props: CheckboxProps): unknown @{
	const inField = useContext(FieldContext) != null
	@if (inField) {
		<CheckboxControl {...props} />
	} @else {
		<NativeToggleField {...props}>
			<CheckboxControl {...props} standalone />
		</NativeToggleField>
	}
}
