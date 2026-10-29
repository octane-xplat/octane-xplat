/** @jsxImportSource @octane-xplat/jsx */
import type { NSView } from '@octane-xplat/platform/macos'
import { useCallback, useId, useRef, useState } from 'octane'
import { cx } from '@octane-xplat/lib'
import type { CheckboxProps } from '../../props'
import { mergeStyle } from '../../internal/layout/style-merge'
import { useFieldControl } from './field-context'
import { FormField } from './FormField.macos.tsrx'
import { CheckboxIndicator } from './CheckboxIndicator.macos.tsrx'

export function Checkbox(inputProps: CheckboxProps) @{
	const { props, inField } = useFieldControl(inputProps)
	const generatedID = useId()
	const controlID = props.id ?? generatedID
	const [internal, setInternal] = useState(props.defaultValue ?? false)
	const resolved = props.value ?? internal
	const indeterminate = resolved === 'indeterminate'
	const checked = resolved === true
	const isBlocked = props.isDisabled || props.isReadOnly
	const localValue = useRef(internal)
	const latest = useRef(props)
	latest.current = props
	const attached = useRef(false), active = useRef<symbol | null>(null)
	const bind = useCallback((view: NSView | null) => {
		attached.current = Boolean(view)
		if (!view) active.current = null
	}, [])
	const toggle = () => {
		const props = latest.current
		if (!attached.current || props.isDisabled || props.isReadOnly || active.current) return
		const previous = props.value ?? localValue.current
		const next = previous === 'indeterminate' ? true : !previous
		const token = Symbol('checkbox-change')
		active.current = token
		try {
			if (props.value === undefined) {
				// Retain accepted local intent before callbacks or a later render.
				localValue.current = next
				setInternal(next)
			}
			props.onChange?.(next)
		} finally {
			if (active.current === token) active.current = null
		}
	}

	<masonview className={cx('vx-checkbox-field--appkit', props.className)}
		style={mergeStyle(props.width != null ? { width: props.width } : {}, props.style)}>
		<masonview id={controlID} ref={bind} testID={props.testID}
			className={cx('vx-checkbox-row--appkit', checked && 'vx-checkbox--on',
				props.isDisabled && 'vx-checkbox--disabled', props.isReadOnly && 'vx-checkbox--readonly',
				props.isLoading && 'vx-checkbox--loading', props.status && `vx-checkbox--status-${props.status.type}`)}
			style={{ opacity: props.isDisabled ? 0.5 : 1 }}
			accessibilityRole="checkbox"
			accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={indeterminate ? 'Partially selected' : undefined}
			accessibilityState={{ checked: indeterminate ? 'mixed' : checked, disabled: props.isDisabled,
				readonly: props.isReadOnly, busy: props.isLoading, required: props.isRequired && !props.isOptional,
				invalid: props.status?.type === 'error' }}
			onTap={isBlocked ? undefined : toggle}>
			<CheckboxIndicator state={indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked'}
				size={props.size === 'sm' ? 'sm' : 'md'} isDisabled={props.isDisabled} />
			{!inField && !props.isLabelHidden && (props.label != null || props.description != null) ?
				<FormField className="vx-checkbox-text" inputID={controlID} label={props.label} description={props.description}
					labelTooltip={props.labelTooltip} isRequired={props.isRequired} isOptional={props.isOptional} isDisabled={props.isDisabled}
					isReadOnly={props.isReadOnly} isLoading={props.isLoading} size={props.size} /> : null}
		</masonview>
		{!inField && props.status?.message != null ? <label id={`${controlID}-status`}
			className={cx('vx-field-status', `vx-field-status--${props.status.type}`, 'vx-field-status--detached')}
			text={props.status.message} /> : null}
	</masonview>
}

