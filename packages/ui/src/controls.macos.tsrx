/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from './style-merge'
import { useState } from 'octane'
import type {
	ActivityIndicatorProps,
	ButtonProps,
	CheckboxProps,
	SearchInputProps,
	SwitchProps,
} from './props'

import { Pressable } from './Pressable.macos.tsrx'
import { CheckboxIndicator } from './CheckboxIndicator.macos.tsrx'
import { Text } from './Text.macos.tsrx'
import { TextInput } from './text-controls.macos.tsrx'
import { cx } from '@octane-xplat/lib'
import { nativeAccessibilityRole } from './escape-props'
import { useThemeScheme } from './theme/theme-scheme.macos'
import { useFieldControlProps } from './field-context'
import { useButtonGroup } from './button-group-context'
import { useSize } from './size-context'
import { Icon } from './Icon.macos.tsrx'
import { reportActionError } from './action-error'
import { controlColors } from './control-colors.macos'

export function Button(props: ButtonProps) @{
	const group = useButtonGroup()
	const size = useSize(props.size ?? group?.size, 'md')
	const [pending, setPending] = useState(false)
	const loading = !!(props.isLoading || pending)
	const disabled = !!(props.isDisabled || props.isLoading || group?.isDisabled)
	const press = () => {
		if (disabled || (pending && !props.isInterruptible)) {
			return
		}

		let action: void | Promise<void> | undefined
		try {
			action = props.clickAction?.()
		} catch (error) {
			reportActionError(error, props.onActionError)
			return
		}

		if (action && typeof action.then === 'function') {
			setPending(true)
			Promise.resolve(action).then(
				() => setPending(false),
				(error) => {
					setPending(false)
					reportActionError(error, props.onActionError)
				},
			)
		}
	}

	<Pressable
		ref={props.ref}
		id={props.id}
		className={cx(
			'vx-button',
			`vx-button--${props.variant ?? 'secondary'}`,
			`vx-button--size-${size}`,
			group && `vx-button--group-${group.position}`,
			props.isIconOnly && 'vx-button--icon',
			disabled && 'vx-button--disabled',
			props.className,
		)}
		style={props.style}
		disabled={disabled}
		onPress={press}
		accessibilityLabel={props.accessibilityLabel ?? (props.isIconOnly ? props.label : undefined)}
		accessibilityRole="button"
	>
		{loading ? (
			<ActivityIndicator />
		) : (
			<>
				{typeof props.icon === 'string' ? <Icon name={props.icon} /> : props.icon}
				{props.children ?? (props.isIconOnly ? null : <Text>{props.label}</Text>)}
				{props.endContent}
			</>
		)}
	</Pressable>
}

export function Checkbox(inputProps: CheckboxProps) @{
	const props = useFieldControlProps(inputProps)
	const [internal, setInternal] = useState(props.defaultValue ?? false)
	const resolved = props.value ?? internal
	const indeterminate = resolved === 'indeterminate'
	const checked = resolved === true
	const isBlocked = props.isDisabled || props.isReadOnly
	const toggle = () => {
		const next = indeterminate ? true : !checked
		if (props.value === undefined) {
			setInternal(next)
		}

		props.onChange?.(next)
	}

	<masonview
		id={props.id}
		className={cx(
			'vx-checkbox-row',
			checked && 'vx-checkbox--on',
			props.isDisabled && 'vx-checkbox--disabled',
			props.isReadOnly && 'vx-checkbox--readonly',
			props.isLoading && 'vx-checkbox--loading',
			props.status && `vx-checkbox--status-${props.status.type}`,
			props.size && `vx-checkbox--size-${props.size}`,
			props.className,
		)}
		style={mergeStyle(
			{ flexDirection: 'row', alignItems: 'center', gap: props.label == null ? 0 : 8 },
			mergeStyle(
				{ display: 'flex' },
				{ opacity: props.isDisabled ? 0.5 : 1, ...styleRecord(props.style) },
			),
		)}
		accessibilityRole="checkbox"
		accessibilityLabel={
			props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
		}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={indeterminate ? 'Partially selected' : undefined}
		accessibilityState={{
			checked: indeterminate ? 'mixed' : checked,
			disabled: props.isDisabled,
			readonly: props.isReadOnly,
			busy: props.isLoading,
			required: props.isRequired && !props.isOptional,
			invalid: props.status?.type === 'error',
		}}
		onTap={isBlocked ? undefined : toggle}
	>
		<CheckboxIndicator
			state={indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked'}
			size={props.size === 'sm' ? 'sm' : 'md'}
			isDisabled={props.isDisabled}
		/>
		{props.label != null ? <Text className="vx-checkbox-label">{props.label}</Text> : null}
	</masonview>
}

export function Switch(inputProps: SwitchProps) @{
	const props = useFieldControlProps(inputProps)
	const [internal, setInternal] = useState(props.defaultValue ?? false)
	const checked = props.value ?? internal
	const isBlocked = props.isDisabled || props.isReadOnly
	const colors = controlColors(useThemeScheme() === 'dark')
	const toggle = () => {
		if (props.value === undefined) {
			setInternal(!checked)
		}

		props.onChange?.(!checked)
	}

	<masonview
		id={props.id}
		className={cx(
			'vx-switch',
			checked && 'vx-switch--on',
			props.isDisabled && 'vx-switch--disabled',
			props.isReadOnly && 'vx-switch--readonly',
			props.isLoading && 'vx-switch--loading',
			props.status && `vx-switch--status-${props.status.type}`,
			props.size && `vx-switch--size-${props.size}`,
			props.className,
		)}
		style={mergeStyle(
			{ flexDirection: 'row', justifyContent: checked ? 'end' : 'start', alignItems: 'center' },
			mergeStyle(
				{ display: 'flex' },
				{
					width: 48,
					height: 28,
					padding: 3,
					borderRadius: 14,
					backgroundColor: checked ? colors.primary : colors.border,
					...styleRecord(props.style),
				},
			),
		)}
		accessibilityRole="switch"
		accessibilityLabel={
			props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
		}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={{
			checked,
			disabled: props.isDisabled,
			readonly: props.isReadOnly,
			busy: props.isLoading,
			required: props.isRequired && !props.isOptional,
			invalid: props.status?.type === 'error',
		}}
		onTap={isBlocked ? undefined : toggle}
	>
		<masonview
			className="vx-switch-thumb"
			style={mergeStyle(
				{ display: 'flex' },
				{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surface },
			)}
		/>
	</masonview>
}

export { Slider } from './Slider.macos.tsrx'

export { SegmentedControl } from './SegmentedControl.macos.tsrx'

export function SearchInput(props: SearchInputProps) @{
	const [internal, setInternal] = useState(props.defaultValue ?? '')
	const value = props.value ?? internal
	const setValue = (next: string) => {
		if (props.isDisabled || props.isReadOnly) {
			return
		}

		if (props.value === undefined) {
			setInternal(next)
		}

		props.onChange?.(next)
	}

	<TextInput
		{...props}
		value={value}
		onChange={setValue}
		hasClear={props.hasClear !== false}
		placeholder={props.placeholder}
		returnKeyType="search"
		startIcon={props.icon === false ? undefined : props.icon ?? 'xplat-search'}
	/>
}

export function ActivityIndicator(props: ActivityIndicatorProps) @{
	if (props.busy === false) {
		return null
	}

	// Self-drawn ring — the vx-spinner class is inert on AppKit (no CSS
	// layer), so the ring chrome comes from explicit border styles. There
	// is no layer animation yet; the ring renders statically.
	<masonview
		id={props.id}
		className={cx('vx-spinner', props.className)}
		style={mergeStyle(
			{ display: 'flex' },
			{
				borderWidth: 2,
				borderTopColor: '#666666',
				borderColor: '#666666',
				borderRadius: 12,
				width: 24,
				height: 24,
				...styleRecord(props.style),
			},
		)}
		accessibilityRole="progressbar"
	/>
}
