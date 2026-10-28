/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from './style-merge'
import { useState } from 'octane'
import type {
	ButtonProps,
	SearchInputProps,
} from './props'

import { Pressable } from './Pressable.macos.tsrx'
import { Text } from './Text.macos.tsrx'
import { TextInput } from './text-controls.macos.tsrx'
import { cx } from '@octane-xplat/lib'
import { useButtonGroup } from './button-group-context'
import { useSize } from './size-context'
import { Icon } from './Icon.macos.tsrx'
import { reportActionError } from './action-error'
import { ActivityIndicator } from './ActivityIndicator.macos.tsrx'

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

export { Checkbox } from './Checkbox.macos.tsrx'

export { Switch } from './Switch.macos.tsrx'

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

export { ActivityIndicator } from './ActivityIndicator.macos.tsrx'
