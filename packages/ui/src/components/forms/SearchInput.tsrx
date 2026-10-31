/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useContext, useImperativeHandle, useEffect, useRef, useState } from 'octane'
import type { SearchInputProps } from '../../props'
import { Icon } from '../media/Icon'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityState } from '../overlays/escape-props'
import { isWritingText, writeText } from './text-write'
import { blurText } from './text-focus'
import { FieldContext, useFieldControlProps } from './field-context'
import { FormField } from './FormField'
import { Pressable } from '../actions/Pressable'

/** Chrome-reset search field — a styled TextField (not UISearchBar) with a
 *  leading glyph and a self-drawn clear button, matching the web leaf.
 *  Controlled `value` writes go through `writeText` so Android keeps its
 *  selection (same path as TextInput); `defaultValue` seeds uncontrolled
 *  use. `returnKeyType` is fixed 'search' — the normalized chrome. */
function SearchInputControl(inputProps: SearchInputProps) @{
	const props = useFieldControlProps(inputProps)
	const el = useRef<any>(null)
	const [internal, setInternal] = useState(props.defaultValue ?? '')
	const [editVersion, setEditVersion] = useState(0)
	const value = props.value ?? internal
	const isBlocked = props.isDisabled || props.isReadOnly
	const hasClear = props.hasClear !== false
	useEffect(() => writeText(el.current, value), [value, editVersion])

	const setValue = (next: string) => {
		if (props.value === undefined) {
			setInternal(next)
		} else {
			setEditVersion((version) => version + 1)
		}

		props.onChange?.(next)
	}

	const clear = () => {
		if (isBlocked || !hasClear) {
			return
		}

		setValue('')
		props.onClear?.()
		el.current?.focus?.()
	}

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
			'vx-search',
			props.isDisabled && 'vx-search--disabled',
			props.isReadOnly && 'vx-search--readonly',
			props.isLoading && 'vx-search--loading',
			props.status && `vx-search--status-${props.status.type}`,
			props.size && `vx-search--size-${props.size}`,
			props.className,
		)}
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		{props.icon !== false ? (
			<Icon name={props.icon ?? 'xplat-search'} size={16} className="vx-search-icon" />
		) : null}
		<textfield
			key="editor"
			id={props.id}
			testID={props.testID ?? ''}
			ref={(v: any) => {
				el.current = v
				if (!v) {
					return
				}
				applyEscapeProps(v, props)
			}}
			className="vx-search-field"
			hint={props.placeholder}
			accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
			accessibilityHint={props.accessibilityHint}
			accessibilityState={nativeAccessibilityState({
				disabled: props.isDisabled,
				readOnly: props.isReadOnly,
				required: props.isRequired,
				busy: props.isLoading,
				invalid: props.status?.type === 'error',
			})}
			returnKeyType="search"
			isEnabled={!props.isDisabled}
			editable={!isBlocked}
			onTextChange={(e: any) => {
				if (!isWritingText(e.object)) {
					setValue(e.value)
				}
			}}
			onReturnPress={props.onSubmit}
			onFocus={props.onFocus}
			onBlur={props.onBlur}
		/>
		{value !== '' && hasClear && !isBlocked ? (
			<Pressable
				className="vx-search-clear"
				accessibilityRole="button"
				accessibilityLabel="Clear search"
				onPress={clear}
			>
				<Icon name="xplat-clear" size={12} />
			</Pressable>
		) : null}
	</masonview>
}


/** Keep field chrome and its editor owner mounted across label/status changes. */
export function SearchInput(inputProps: SearchInputProps): unknown @{
	const inField = useContext(FieldContext) != null
	const props = useFieldControlProps(inputProps)
	@if (inField) {
		<SearchInputControl {...inputProps} />
	} @else {
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
			<SearchInputControl {...inputProps} />
		</FormField>
	}
}
