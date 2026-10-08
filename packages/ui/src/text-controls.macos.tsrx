/** @jsxImportSource @octane-xplat/macos-renderer */
import type { TextAreaProps, TextInputProps } from './props'
import { cx } from './cx'
import { Pressable } from './Pressable.macos.tsrx'
import { Text } from './Text.macos.tsrx'
import { useFieldControlProps } from './field-context'

export function TextInput(inputProps: TextInputProps) @{
	const props = useFieldControlProps(inputProps)
	const isBlocked = props.isDisabled || props.isReadOnly

	<flexboxlayout className={cx('vx-input-shell', props.inInputGroup && 'vx-input-shell--ingroup')} flexDirection="row" alignItems="center" accessibilityState={{ busy: props.isLoading }}>
		<textfield
			id={props.id}
			value={props.value}
			placeholder={props.placeholder}
			className={cx('vx-input', props.isDisabled && 'vx-input--disabled', props.isReadOnly && 'vx-input--readonly', props.isLoading && 'vx-input--loading', props.status && `vx-input--status-${props.status.type}`, props.size && `vx-input--size-${props.size}`, props.inInputGroup && 'vx-input--ingroup', props.className)}
			style={props.style}
			isEnabled={!props.isDisabled}
			editable={!isBlocked}
			secure={props.secure}
			onTextChange={props.onChange}
			onSubmit={props.onSubmit}
			accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={{ disabled: props.isDisabled, readonly: props.isReadOnly, busy: props.isLoading, required: props.isRequired && !props.isOptional, invalid: props.status?.type === 'error' }}
		/>
		{props.hasClear && props.value != null && props.value !== '' && !isBlocked
		? <Pressable className="vx-input-clear" accessibilityLabel={props.fieldLabel ? `Clear ${props.fieldLabel}` : props.label ? `Clear ${props.label}` : 'Clear input'} onPress={() => { props.onChange?.(''); props.onClear?.(); }}><Text>×</Text></Pressable>
			: null}
	</flexboxlayout>
}

export function TextArea(inputProps: TextAreaProps) @{
	const props = useFieldControlProps(inputProps)
	const isBlocked = props.isDisabled || props.isReadOnly

	<textview id={props.id} value={props.value} placeholder={props.placeholder} rows={props.autoGrow ? undefined : props.rows ?? 3} className={cx('vx-textarea', props.isDisabled && 'vx-textarea--disabled', props.isReadOnly && 'vx-textarea--readonly', props.isLoading && 'vx-textarea--loading', props.status && `vx-textarea--status-${props.status.type}`, props.size && `vx-textarea--size-${props.size}`, props.className)} style={props.style} isEnabled={!props.isDisabled} editable={!isBlocked} secure={props.secure} onTextChange={props.onChange} onSubmit={props.onSubmit} accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label} accessibilityHint={props.accessibilityHint} accessibilityState={{ disabled: props.isDisabled, readonly: props.isReadOnly, busy: props.isLoading, required: props.isRequired && !props.isOptional, invalid: props.status?.type === 'error' }} />
}
