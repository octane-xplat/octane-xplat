/** @jsxImportSource @octane-xplat/macos-renderer */
import { useImperativeHandle, useRef, useState } from 'octane'
import type { TextAreaProps, TextInputProps } from './props'
import { cx } from '@octane-xplat/lib'
import { Pressable } from './Pressable.macos.tsrx'
import { Text } from './Text.macos.tsrx'
import { useFieldControlProps } from './field-context'

export function TextInput(inputProps: TextInputProps) @{
	const props = useFieldControlProps(inputProps)
	const isBlocked = props.isDisabled || props.isReadOnly
	const el = useRef<any>(null)
	const [internal, setInternal] = useState(props.defaultValue ?? '')
	const value = props.value ?? internal
	const setValue = (next: string) => {
		if (props.value === undefined) setInternal(next)
		props.onChange?.(next)
	}

	useImperativeHandle(props.ref, () => ({
		focus: () => el.current?.window?.makeFirstResponder(el.current),
		blur: () => {
			const view = el.current
			const responder = view?.window?.firstResponder
			if (responder === view || (responder && responder === view?.currentEditor?.())) {
				view.window.makeFirstResponder(null)
			}
		},
		get native() { return el.current },
	}), [])

	<masonview display="flex" className={cx('vx-input-shell', props.inInputGroup && 'vx-input-shell--ingroup')} flexDirection="row" alignItems="center" accessibilityState={{ busy: props.isLoading }}>
		<textfield
			ref={el}
			secure={props.secure}
			onSubmit={props.onSubmit}
			onFocus={props.onFocus}
			onBlur={props.onBlur}
			id={props.id}
			value={value}
			placeholder={props.placeholder}
			className={cx('vx-input', props.isDisabled && 'vx-input--disabled', props.isReadOnly && 'vx-input--readonly', props.isLoading && 'vx-input--loading', props.status && `vx-input--status-${props.status.type}`, props.size && `vx-input--size-${props.size}`, props.inInputGroup && 'vx-input--ingroup', props.className)}
			style={props.style}
			isEnabled={!props.isDisabled}
			editable={!isBlocked}
			onTextChange={setValue}
			accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={{ disabled: props.isDisabled, readonly: props.isReadOnly, busy: props.isLoading, required: props.isRequired && !props.isOptional, invalid: props.status?.type === 'error' }}
		/>
		{props.hasClear && value !== '' && !isBlocked
		? <Pressable className="vx-input-clear" accessibilityLabel={props.fieldLabel ? `Clear ${props.fieldLabel}` : props.label ? `Clear ${props.label}` : 'Clear input'} onPress={() => { setValue(''); props.onClear?.(); }}><Text>×</Text></Pressable>
			: null}
	</masonview>
}

export function TextArea(inputProps: TextAreaProps) @{
	const props = useFieldControlProps(inputProps)
	const isBlocked = props.isDisabled || props.isReadOnly
	const el = useRef<any>(null)
	const [internal, setInternal] = useState(props.defaultValue ?? '')
	const value = props.value ?? internal
	const setValue = (next: string) => {
		if (props.value === undefined) setInternal(next)
		props.onChange?.(next)
	}

	useImperativeHandle(props.ref, () => ({
		focus: () => el.current?.window?.makeFirstResponder(el.current),
		blur: () => {
			const view = el.current
			const responder = view?.window?.firstResponder
			if (responder === view || (responder && responder === view?.currentEditor?.())) {
				view.window.makeFirstResponder(null)
			}
		},
		get native() { return el.current },
	}), [])

	<textview ref={el} onFocus={props.onFocus} onBlur={props.onBlur} onSubmit={props.onSubmit} returnKeyType={props.returnKeyType} autoGrow={props.autoGrow} maxRows={props.maxRows} id={props.id} value={value} placeholder={props.placeholder} rows={props.rows ?? (props.autoGrow ? 1 : 3)} className={cx('vx-textarea', props.isDisabled && 'vx-textarea--disabled', props.isReadOnly && 'vx-textarea--readonly', props.isLoading && 'vx-textarea--loading', props.status && `vx-textarea--status-${props.status.type}`, props.size && `vx-textarea--size-${props.size}`, props.className)} style={props.style} isEnabled={!props.isDisabled} editable={!isBlocked} secure={props.secure} onTextChange={setValue} accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label} accessibilityHint={props.accessibilityHint} accessibilityState={{ disabled: props.isDisabled, readonly: props.isReadOnly, busy: props.isLoading, required: props.isRequired && !props.isOptional, invalid: props.status?.type === 'error' }} />
}
