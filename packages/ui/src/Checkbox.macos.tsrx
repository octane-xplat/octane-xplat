/** @jsxImportSource @octane-xplat/jsx */
import { useId, useState } from 'octane'
import { cx } from '@octane-xplat/lib'
import type { CheckboxProps } from './props'
import { mergeStyle } from './style-merge'
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
	const toggle = () => {
		if (isBlocked) return
		const next = indeterminate ? true : !checked
		if (props.value === undefined) {
			setInternal(next)
		}

		props.onChange?.(next)
	}

	<masonview className={cx('vx-checkbox-field--appkit', props.className)}
		style={mergeStyle(props.width != null ? { width: props.width } : {}, props.style)}>
		<masonview id={controlID} testID={props.testID}
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
					isRequired={props.isRequired} isOptional={props.isOptional} isDisabled={props.isDisabled}
					isReadOnly={props.isReadOnly} isLoading={props.isLoading} size={props.size} /> : null}
		</masonview>
		{!inField && props.status?.message != null ? <label id={`${controlID}-status`}
			className={cx('vx-field-status', `vx-field-status--${props.status.type}`, 'vx-field-status--detached')}
			text={props.status.message} /> : null}
	</masonview>
}

