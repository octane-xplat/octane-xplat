/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useState, useContext } from 'octane'
import type { SwitchProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import {
	applyEscapeProps,
	nativeAccessibilityRole,
	nativeAccessibilityState,
} from '../overlays/escape-props'

import { FieldContext, useFieldControlProps } from './field-context'
import { FormLayoutContext } from './form-layout-context'
import { NativeToggleField } from './NativeToggleField'

/** One state/action owner for track, label and keyboard activation. */
function SwitchControl(inputProps: SwitchProps & { standalone?: boolean }) @{
	const props = useFieldControlProps(inputProps)
	const form = useContext(FormLayoutContext)
	const [internal, setInternal] = useState(props.defaultValue ?? false)
	const checked = props.value ?? internal
	const [pending, setPending] = useState(false)
	const loading = props.isLoading || pending
	const isBlocked = props.isDisabled || props.isReadOnly
	const toggle = () => {
		if (isBlocked) return
		const next = !checked
		if (props.value === undefined) setInternal(next)
		props.onChange?.(next)
		if (!props.changeAction) return
		const previous = checked
		setPending(true)
		Promise.resolve().then(() => props.changeAction!(next)).then(
			() => setPending(false),
			() => {
				if (props.value === undefined) setInternal(previous)
				props.onChange?.(previous)
				setPending(false)
			},
		)
	}
	const showLabel = props.standalone && props.label != null && !props.isLabelHidden
	const showDescription = props.standalone && props.description != null && !props.isLabelHidden
	const marker = props.isRequired && form.defaultOptionality !== 'required'
		? ' *' : props.isOptional && form.defaultOptionality !== 'optional' ? ' (Optional)' : ''
	<masonview ref={(v: any) => applyEscapeProps(v, props)} id={props.id} testID={props.testID ?? ''}
		className="vx-switch-row"
		style={{ display: 'flex', flexDirection: props.labelPosition === 'start' ? 'row-reverse' : 'row',
			alignItems: 'center', gap: showLabel || showDescription ? 8 : 0,
			justifyContent: props.labelSpacing === 'spread' ? 'space-between'
				: props.labelPosition === 'start' ? 'flex-end' : 'flex-start' }}
		isEnabled={!props.isDisabled}
		accessibilityRole={nativeAccessibilityRole('switch')}
		accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={nativeAccessibilityState({ checked, disabled: props.isDisabled,
			readOnly: props.isReadOnly, required: props.isRequired, busy: loading,
			invalid: props.status?.type === 'error' })}
		onTap={isBlocked ? undefined : toggle}>
		<masonview className={cx('vx-switch', checked && 'vx-switch--on',
			props.isDisabled && 'vx-switch--disabled', props.isReadOnly && 'vx-switch--readonly',
			loading && 'vx-switch--loading', props.status && `vx-switch--status-${props.status.type}`,
			props.size && `vx-switch--size-${props.size}`, props.className)}
			style={mergeStyle({ display: 'flex' }, props.style)}>
			<masonview className="vx-switch-thumb" style={{ display: 'flex' }} />
		</masonview>
		<masonview style={{ display: showLabel || showDescription ? 'flex' : 'none',
			flexDirection: 'column', flexShrink: 1 }}>
			<label className="vx-field-label" text={(props.label ?? '') + marker}
				accessibilityHint={props.labelTooltip}
				style={{ display: showLabel ? 'flex' : 'none' }} textWrap />
			<label className="vx-field-description" text={props.description ?? ''}
				style={{ display: showDescription ? 'flex' : 'none' }} textWrap />
		</masonview>
	</masonview>
}

/** Standalone Switch renders its own field chrome — the label column beside
 *  the track (tapping the row toggles) and a detached status line below.
 *  Inside a FormField the field owns that chrome. */
export function Switch(inputProps: SwitchProps): unknown @{
	const props = useFieldControlProps(inputProps)
	const inField = useContext(FieldContext) != null
	@if (inField) {
		<SwitchControl {...props} />
	} @else {
		<NativeToggleField {...props}>
			<SwitchControl {...props} standalone />
		</NativeToggleField>
	}
}
