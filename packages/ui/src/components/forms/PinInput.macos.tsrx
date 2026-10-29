/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useId, useRef, useState } from 'octane'
import type { PinInputProps, TextInputHandle } from '../../props'
import type { NativeKeyboardEvent } from '@octane-xplat/jsx/intrinsics'
import { cx } from '@octane-xplat/lib'
import { useFieldControl } from './field-context'
import { FormField } from './FormField.macos.tsrx'
import { TextInput } from './text-controls.macos.tsrx'

/** PinInput — a row of single-character cells that auto-advance on entry.
 *  `onComplete` fires when every cell is filled. `secure` masks each cell. */
export function PinInput(inputProps: PinInputProps) @{
	const { props, inField } = useFieldControl(inputProps)
	const generatedID = useId()
	const controlID = props.id ?? generatedID
	const name = props.ariaLabel ?? props.fieldLabel ?? props.label ?? 'PIN'
	const length = props.length ?? 4
	const [internal, setInternal] = useState('')
	const controlled = props.value !== undefined
	const value = controlled ? props.value! : internal
	const handles = useRef<(TextInputHandle | null)[]>([])
	const pendingFocus = useRef<number | null>(null)
	useEffect(() => {
		const next = pendingFocus.current
		if (props.isDisabled || props.isReadOnly || (next !== null && next >= length)) {
			pendingFocus.current = null
			return
		}
		if (next !== null && next <= value.length) {
			pendingFocus.current = null
			handles.current[next]?.focus()
		}
	}, [value, length, props.isDisabled, props.isReadOnly])

	const setValue = (next: string) => {
		const clipped = next.slice(0, length)
		if (!controlled) {
			setInternal(clipped)
		}

		props.onValueChange?.(clipped)
		if (clipped.length === length) {
			props.onComplete?.(clipped)
		}
	}

	const cellValue = (i: number) => value[i] ?? ''

	const enter = (i: number, text: string) => {
		if (props.isDisabled || props.isReadOnly || i > value.length) {
			return
		}

		const ch = text.slice(-1)
		const next = ch
			? (value.slice(0, i) + ch + value.slice(i + 1)).slice(0, length)
			: value.slice(0, i)

		pendingFocus.current = ch && i < length - 1 ? i + 1 : null
		setValue(next)
		if (pendingFocus.current !== null && pendingFocus.current <= value.length) {
			const index = pendingFocus.current
			pendingFocus.current = null
			handles.current[index]?.focus()
		}
	}

	// The renderer maps a shared field editor back to its owning text field.
	// Keep this private native target lookup: portable useKeyboard omits targets.
	const backspace = (event: NativeKeyboardEvent<NSView>) => {
		if (event.defaultPrevented || event.key !== 'Backspace' || event.isComposing ||
			event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
			props.isDisabled || props.isReadOnly) return
		const index = handles.current.findIndex((handle) => handle?.native === event.target)
		if (index <= 0 || index >= length || index > value.length || cellValue(index) !== '') return
		const previous = handles.current[index - 1]
		if (!previous) return
		pendingFocus.current = null
		event.preventDefault()
		event.stopPropagation()
		previous.focus()
	}

	const group = <masonview
		id={controlID}
		onKeyDown={backspace}
		className={cx(
			'vx-pininput',
			'vx-pininput--appkit',
			props.isDisabled && 'vx-pininput--disabled',
			props.isReadOnly && 'vx-pininput--readonly',
			props.isLoading && 'vx-pininput--loading',
			props.status && `vx-pininput--status-${props.status.type}`,
			props.size && `vx-pininput--size-${props.size}`,
			props.className,
		)}
		style={props.style}
		accessibilityRole="group"
		accessibilityLabel={name}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={{
			disabled: props.isDisabled,
			readonly: props.isReadOnly,
			busy: props.isLoading,
		}}
	>
		@for (const i of Array.from({ length }, (_, k) => k); key i) {
			<TextInput
				id={`${controlID}-digit-${i + 1}`}
				accessibilityLabel={`${name}, digit ${i + 1} of ${length}`}
				className="vx-pininput-cell"
				keyboardType="number"
				secure={props.secure}
				isDisabled={props.isDisabled}
				isReadOnly={props.isReadOnly || i > value.length}
				isLoading={props.isLoading}
				value={cellValue(i)}
				onChange={(text: string) => enter(i, text)}
				ref={(h: TextInputHandle | null) => {
					handles.current[i] = h
				}}
			/>
		}
	</masonview>
	@if (inField) {
		{group}
	} @else {
		<FormField inputID={controlID} label={props.label} description={props.description} status={props.status}
			statusVariant={props.statusVariant} isRequired={props.isRequired} isOptional={props.isOptional}
			isDisabled={props.isDisabled} isReadOnly={props.isReadOnly} isLoading={props.isLoading}
			isLabelHidden={props.isLabelHidden} disabledMessage={props.disabledMessage} labelTooltip={props.labelTooltip}
			width={props.width} size={props.size}>{group}</FormField>
	}
}
