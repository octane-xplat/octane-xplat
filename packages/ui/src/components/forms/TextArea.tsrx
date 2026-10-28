/** @jsxImportSource @octane-xplat/jsx */
import { useContext, useImperativeHandle, useEffect, useRef, useState } from 'octane'
import { mergeStyle } from '../../internal/layout/style-merge'
import { styleRecord } from '../../internal/layout/style-merge'
import { Utils } from '@nativescript/core'
import { fitTextArea } from '../../text-area-fit'
import type { TextAreaProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityState } from '../overlays/escape-props'
import { isWritingText, writeText } from './text-write'
import { blurText } from './text-focus'
import { FieldContext, useFieldControlProps } from './field-context'
import { FormField } from './FormField'

/** Multiline input. Fixed rows match the web default; autoGrow measures to
 * content and maxRows caps that growth. Platform helpers use native line
 * metrics and remove old generated constraints when sizing props change. */
function TextAreaControl(inputProps: TextAreaProps) @{
	const props = useFieldControlProps(inputProps)
	const el = useRef<any>(null)
	const submitOnReturn = props.returnKeyType === 'done' || props.returnKeyType === 'send'

	const [internal, setInternal] = useState(props.defaultValue ?? '')
	const [editVersion, setEditVersion] = useState(0)
	const value = props.value ?? internal
	const setValue = (next: string) => {
		if (props.value === undefined) {
			setInternal(next)
		} else {
			// Restore the owner value even when an edit is rejected unchanged.
			setEditVersion((version) => version + 1)
		}

		props.onChange?.(next)
	}

	// Explicit deps — the sizing helper hides prop reads one level down.
	useEffect(
		() => fitTextArea(el.current, props),
		[props.rows, props.autoGrow, props.maxRows, props.style, props.className, props.size],
	)
	// Imperative controlled write — Android setText resets selection to 0.
	useEffect(() => writeText(el.current, value), [value, editVersion])

	useImperativeHandle(
		props.ref,
		() => ({
			focus: () => el.current.focus(),
			blur: () => blurText(el.current),
			native: el.current,
		}),
		[],
	)

	<masonview
		className={cx(
			'vx-textarea-shell',
			props.status && `vx-textarea-shell--status-${props.status.type}`,
			props.isDisabled && 'vx-textarea-shell--disabled',
		)}
		style={mergeStyle({ flexDirection: 'column', alignItems: 'stretch' }, { display: 'flex' })}
	>
		<textview
			id={props.id}
			testID={props.testID ?? ''}
			ref={(v: any) => {
				el.current = v
				if (!v) {
					return
				}

				applyEscapeProps(v, props)
			}}
			className={cx(
				'vx-textarea',
				props.isDisabled && 'vx-textarea--disabled',
				props.isReadOnly && 'vx-textarea--readonly',
				props.isLoading && 'vx-textarea--loading',
				props.status && `vx-textarea--status-${props.status.type}`,
				props.size && `vx-textarea--size-${props.size}`,
				props.className,
			)}
			style={mergeStyle(
				styleRecord(props.style),
				props.placeholderTextColor ? { placeholderColor: props.placeholderTextColor } : {},
			)}
			hint={props.placeholder}
			accessibilityLabel={
				props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
			}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled })}
			keyboardType={props.keyboardType === 'default' ? undefined : props.keyboardType}
			returnKeyType={props.returnKeyType}
			isEnabled={!props.isDisabled}
			editable={!props.isDisabled && !props.isReadOnly}
			onTextChange={(e: any) => {
				if (!isWritingText(e.object)) {
					setValue(e.value)
				}
			}}
			// TextView emits returnPress for every newline. Only an explicit action
			// key opts into the submit semantic; ordinary Return remains a newline.
			onReturnPress={submitOnReturn ? props.onSubmit : undefined}
			onFocus={props.onFocus}
			onBlur={props.onBlur}
		/>
	</masonview>
}

/** Standalone text areas render Astryx's visible field chrome: outside a
 *  FormField, wrap the control in one (label, description, status). Inside a
 *  field the FormField owns that chrome, so the control renders bare. */
export function TextArea(props: TextAreaProps): unknown @{
	const inField = useContext(FieldContext) != null
	const needsChrome =
		!inField &&
		(props.label != null ||
			props.description != null ||
			props.status != null ||
			props.isRequired ||
			props.isOptional)

	@if (needsChrome) {
		<FormField
			label={props.label}
			description={props.description}
			status={props.status}
			isRequired={props.isRequired}
			isOptional={props.isOptional}
			isLabelHidden={props.isLabelHidden}
			isDisabled={props.isDisabled}
			labelTooltip={props.labelTooltip}
			disabledMessage={props.disabledMessage}
			width={props.width}
		>
			<TextAreaControl {...props} />
		</FormField>
	} @else {
		<TextAreaControl {...props} />
	}
}
