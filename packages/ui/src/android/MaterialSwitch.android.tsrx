/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef } from 'octane'
import type { MaterialSwitchProps } from '../props'
import { cx } from '@octane-xplat/lib'
import {
	applyEscapeProps,
	nativeAccessibilityRole,
	nativeAccessibilityState,
} from '../components/overlays/escape-props'

import { useFieldControlProps } from '../components/forms/field-context'

/** MaterialSwitch — the platform widget (Material SwitchMaterial via
 *  NativeScript `switch`). OS chrome is the point here; the self-drawn
 *  shared `Switch` lives in the root export. A bare widget:
 *  `label`/`description` are spoken, not drawn — visible field chrome
 *  belongs to `Field`. `isDisabled` maps to `isEnabled`; `isReadOnly`
 *  blocks toggling (interaction off, change reverted) while keeping the
 *  enabled appearance. */
export function MaterialSwitch(inputProps: MaterialSwitchProps): unknown @{
	const props = useFieldControlProps(inputProps)
	const el = useRef<any>(null)
	// Last confirmed value for the `isReadOnly` revert — `value` when
	// controlled, the widget's own state otherwise.
	const lastChecked = useRef(props.value ?? props.defaultValue ?? false)
	// Uncontrolled widgets own their checked state — seed it once; a bound
	// `value` write would fight the user's next toggle on re-render.
	useEffect(() => {
		if (el.current && props.value === undefined && props.defaultValue !== undefined) {
			el.current.checked = props.defaultValue
		}
	}, [])

	<switch
		ref={(v: any) => {
			el.current = v
			applyEscapeProps(v, props)
		}}
		id={props.id}
		testID={props.testID ?? ''}
		className={cx(props.className)}
		style={props.style}
		checked={props.value}
		isEnabled={!props.isDisabled}
		isUserInteractionEnabled={!props.isReadOnly}
		accessibilityRole={nativeAccessibilityRole('switch')}
		accessibilityLabel={
			props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
		}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled })}
		onCheckedChange={(e: any) => {
			// Assistive activation can still fire on a non-interactive view —
			// revert so `isReadOnly` means the value truly cannot change.
			if (props.isReadOnly) {
				const expected = props.value ?? lastChecked.current
				if (e.value !== expected) {
					e.object.checked = expected
				}

				return
			}

			lastChecked.current = e.value
			props.onChange?.(e.value)
		}}
	/>
}
