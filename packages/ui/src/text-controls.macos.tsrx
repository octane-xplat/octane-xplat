/** @jsxImportSource @octane-xplat/jsx */
import { appKitTextChange } from './appkit-events.macos'
import { mergeStyle } from './style-merge'
import { useContext, useImperativeHandle, useRef, useState } from 'octane'
import type { Renderable, TextAreaProps, TextInputProps } from './props'
import { cx } from '@octane-xplat/lib'
import { Pressable } from './Pressable.macos.tsrx'
import { Text } from './Text.macos.tsrx'
import { FieldContext, useFieldControlProps } from './field-context'
import { FormField } from './FormField.macos.tsrx'

function TextInputControl(inputProps: TextInputProps) @{
	const props = useFieldControlProps(inputProps)
	const isBlocked = props.isDisabled || props.isReadOnly
	const el = useRef<any>(null)
	const [internal, setInternal] = useState(props.defaultValue ?? '')
	const value = props.value ?? internal
	const setValue = (next: string) => {
		if (isBlocked) return
		if (props.value === undefined) {
			setInternal(next)
		}

		props.onChange?.(next)
	}

	useImperativeHandle(
		props.ref,
		() => ({
			focus: () => el.current?.window?.makeFirstResponder(el.current),
			blur: () => {
				const view = el.current
				const responder = view?.window?.firstResponder
				if (responder === view || (responder && responder === view?.currentEditor?.())) {
					view.window.makeFirstResponder(null)
				}
			},
			get native() {
				return el.current
			},
		}),
		[],
	)

	<masonview
		className={cx(
			'vx-input-shell',
			'vx-input-shell--appkit',
			props.inInputGroup && 'vx-input-shell--ingroup',
		)}
		accessibilityState={{ busy: props.isLoading }}
		style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
	>
		<textfield
			ref={el}
			secure={props.secure}
			onSubmit={isBlocked ? undefined : props.onSubmit}
			onFocus={props.onFocus}
			onBlur={props.onBlur}
			id={props.id}
			value={value}
			placeholder={props.placeholder}
			className={cx(
				'vx-input',
				props.isDisabled && 'vx-input--disabled',
				props.isReadOnly && 'vx-input--readonly',
				props.isLoading && 'vx-input--loading',
				props.status && `vx-input--status-${props.status.type}`,
				props.size && `vx-input--size-${props.size}`,
				props.inInputGroup && 'vx-input--ingroup',
				props.className,
			)}
			style={props.style}
			isEnabled={!props.isDisabled}
			editable={!isBlocked}
			onTextChange={appKitTextChange(setValue)}
			accessibilityLabel={
				props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
			}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={{
				disabled: props.isDisabled,
				readonly: props.isReadOnly,
				busy: props.isLoading,
				required: props.isRequired && !props.isOptional,
				invalid: props.status?.type === 'error',
			}}
		/>
		{props.hasClear && value !== '' && !isBlocked ? (
			<Pressable
				className="vx-input-clear"
				accessibilityLabel={
					props.fieldLabel
						? `Clear ${props.fieldLabel}`
						: props.label
							? `Clear ${props.label}`
							: 'Clear input'
				}
				onPress={() => {
					setValue('')
					props.onClear?.()
				}}
			>
				<Text>×</Text>
			</Pressable>
		) : null}
	</masonview>
}

function TextAreaControl(inputProps: TextAreaProps) @{
	const props = useFieldControlProps(inputProps)
	const isBlocked = props.isDisabled || props.isReadOnly
	const el = useRef<any>(null)
	const [internal, setInternal] = useState(props.defaultValue ?? '')
	const value = props.value ?? internal
	const setValue = (next: string) => {
		if (isBlocked) return
		if (props.value === undefined) {
			setInternal(next)
		}

		props.onChange?.(next)
	}

	useImperativeHandle(
		props.ref,
		() => ({
			focus: () => el.current?.window?.makeFirstResponder(el.current),
			blur: () => {
				const view = el.current
				const responder = view?.window?.firstResponder
				if (responder === view || (responder && responder === view?.currentEditor?.())) {
					view.window.makeFirstResponder(null)
				}
			},
			get native() {
				return el.current
			},
		}),
		[],
	)

	<masonview className="vx-textarea-shell vx-textarea-shell--appkit"
		style={{ display: 'flex', flexDirection: 'column' }}>
		<textview
			ref={el}
			onFocus={props.onFocus}
			onBlur={props.onBlur}
			returnKeyType={props.returnKeyType}
			onSubmit={!isBlocked && (props.returnKeyType === 'done' || props.returnKeyType === 'send') ? props.onSubmit : undefined}
			autoGrow={props.autoGrow}
			maxRows={props.maxRows}
			id={props.id}
			value={value}
			placeholder={props.placeholder}
			rows={props.rows ?? (props.autoGrow ? 1 : 3)}
			className={cx(
				'vx-textarea',
				'vx-textarea--appkit',
				props.isDisabled && 'vx-textarea--disabled',
				props.isReadOnly && 'vx-textarea--readonly',
				props.isLoading && 'vx-textarea--loading',
				props.status && `vx-textarea--status-${props.status.type}`,
				props.size && `vx-textarea--size-${props.size}`,
				props.className,
			)}
			style={props.style}
			isEnabled={!props.isDisabled}
			editable={!isBlocked}
			onTextChange={appKitTextChange(setValue)}
			accessibilityLabel={
				props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
			}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={{
				disabled: props.isDisabled,
				readonly: props.isReadOnly,
				busy: props.isLoading,
				required: props.isRequired && !props.isOptional,
				invalid: props.status?.type === 'error',
			}}
		/>
	</masonview>
}


/** An enclosing Field owns the chrome; standalone controls create it once. */
function TextEntryField({ props, children }: { props: TextInputProps; children?: Renderable }) @{
	const inField = useContext(FieldContext) != null
	const needsChrome = !inField && (props.label != null || props.description != null ||
		props.status != null || props.isRequired || props.isOptional || props.width != null)
	@if (needsChrome) {
		<FormField
			inputID={props.id}
			label={props.label}
			description={props.description}
			status={props.status}
			statusVariant={props.statusVariant}
			isRequired={props.isRequired}
			isOptional={props.isOptional}
			isLabelHidden={props.isLabelHidden}
			isDisabled={props.isDisabled}
			isReadOnly={props.isReadOnly}
			isLoading={props.isLoading}
			size={props.size}
			labelTooltip={props.labelTooltip}
			disabledMessage={props.disabledMessage}
			width={props.width}
		>
			{children}
		</FormField>
	} @else {
		<>{children}</>
	}
}

export function TextInput(props: TextInputProps) @{
	<TextEntryField props={props}><TextInputControl {...props} /></TextEntryField>
}

export function TextArea(props: TextAreaProps) @{
	<TextEntryField props={props}><TextAreaControl {...props} /></TextEntryField>
}
