/** @jsxImportSource @octane-xplat/jsx */
import { appKitTextChange } from './appkit-events.macos'
import { mergeStyle } from './style-merge'
import { useContext, useImperativeHandle, useMemo, useRef, useState } from 'octane'
import type { NSView, NSTextField, NSTextView } from '@octane-xplat/platform/macos'
import { createAppKitDateFieldHandle } from './date-field-handle.macos'
import { hasDateComposition } from './date-composition.macos'
import type { Renderable, TextAreaProps, TextInputProps } from './props'
import { cx } from '@octane-xplat/lib'
import { Pressable } from './Pressable.macos.tsrx'
import { Text } from './Text.macos.tsrx'
import { Icon } from './Icon.macos.tsrx'
import { FieldContext, useFieldControlProps } from './field-context'
import { FormField } from './FormField.macos.tsrx'

const nativeValue = (view: object, name: string) => {
	const value = Reflect.get(view, name)
	return typeof value === 'function' ? value.call(view) : value
}
const composing = (view: NSView) => !!nativeValue(view, 'hasMarkedText') || hasDateComposition(view)

/** Current props and local text own every accepted edit. Draft notifications
 * remain live during composition; submit/clear wait for committed text. */
function useAppKitTextEntry<T extends NSView>(props: TextInputProps, multiline = false) {
	const live = useRef(props); live.current = props
	const el = useRef<T | null>(null), writing = useRef(false)
	const [internal, setInternal] = useState(props.defaultValue ?? '')
	const local = useRef(internal); local.current = internal
	const isBlocked = !!props.isDisabled || !!props.isReadOnly
	const canEdit = () => !!el.current && !live.current.isDisabled && !live.current.isReadOnly && !writing.current
	const handle = useMemo(() => createAppKitDateFieldHandle({ primary: () => el.current, blocked: () => !!live.current.isDisabled }), [])
	useImperativeHandle(props.ref, () => handle, [props.ref])
	const write = (text: string, current: TextInputProps) => {
		if (current.value === undefined) { local.current = text; setInternal(text) }
		current.onChange?.(text)
	}
	const change = (text: string) => {
		if (!canEdit()) return
		writing.current = true
		try { write(text, live.current) } finally { writing.current = false }
	}
	const submit = () => {
		const current = live.current, view = el.current
		if (!view || !canEdit() || composing(view) || (multiline && current.returnKeyType !== 'done' && current.returnKeyType !== 'send')) return
		writing.current = true
		try { current.onSubmit?.() } finally { writing.current = false }
	}
	const clear = () => {
		const current = live.current, view = el.current
		if (!view || !canEdit() || !current.hasClear || (current.value ?? local.current) === '' || composing(view)) return
		const window = view.window, responder = window?.firstResponder
		// An accepted clear owns its callback pair, even if onChange replaces
		// props or removes the field. Subsequent UI/focus work needs live ownership.
		writing.current = true
		try {
			write('', current); current.onClear?.()
		} finally { writing.current = false }
		if (el.current !== view || !window || view.window !== window || window.firstResponder !== responder ||
			live.current.isDisabled || live.current.isReadOnly) return
		const editor = nativeValue(view, 'currentEditor')
		if (responder !== view && (!responder || responder !== editor)) handle.focus()
	}
	return { el, value: props.value ?? internal, isBlocked, change, submit, clear,
		focus: () => { if (el.current && !live.current.isDisabled) live.current.onFocus?.() },
		blur: () => { if (el.current) live.current.onBlur?.() },
	}
}

function TextInputControl(inputProps: TextInputProps) @{
	const props = useFieldControlProps(inputProps)
	const entry = useAppKitTextEntry<NSTextField>(props)
	const { el, value, isBlocked } = entry

	<masonview
		className={cx(
			'vx-input-shell',
			'vx-input-shell--appkit',
			props.inInputGroup && 'vx-input-shell--ingroup',
		)}
		accessibilityState={{ busy: props.isLoading }}
		style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
	>
		{props.startIcon != null ? (
			<masonview className="vx-input-icon">
				{typeof props.startIcon === 'string' ? <Icon name={props.startIcon} size={16} /> : props.startIcon}
			</masonview>
		) : null}
		<textfield
			ref={el}
			secure={props.secure}
			onSubmit={isBlocked || !props.onSubmit ? undefined : entry.submit}
			onFocus={entry.focus}
			onBlur={entry.blur}
			id={props.id}
			testID={props.testID}
			value={value}
			placeholder={props.placeholder}
			placeholderTextColor={props.placeholderTextColor}
			returnKeyType={props.returnKeyType}
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
			onTextChange={appKitTextChange(entry.change)}
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
				onPress={entry.clear}
			>
				<Text>×</Text>
			</Pressable>
		) : null}
	</masonview>
}

function TextAreaControl(inputProps: TextAreaProps) @{
	const props = useFieldControlProps(inputProps)
	const entry = useAppKitTextEntry<NSTextView>(props, true)
	const { el, value, isBlocked } = entry

	<masonview className="vx-textarea-shell vx-textarea-shell--appkit"
		style={{ display: 'flex', flexDirection: 'column' }}>
		<textview
			ref={el}
			onFocus={entry.focus}
			onBlur={entry.blur}
			returnKeyType={props.returnKeyType}
			onSubmit={!isBlocked && props.onSubmit && (props.returnKeyType === 'done' || props.returnKeyType === 'send') ? entry.submit : undefined}
			autoGrow={props.autoGrow}
			maxRows={props.maxRows}
			maxLength={props.maxLength}
			id={props.id}
			testID={props.testID}
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
			onTextChange={appKitTextChange(entry.change)}
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
	// Keep the owner stable when validation/label props appear after editing.
	@if (!inField) {
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
