/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useRef, useState } from 'octane'
import type { ToggleButtonProps, ToggleButtonGroupProps } from '../../props'
import { useToggleButtonGroup, ToggleButtonGroupProvider } from './toggle-button-group-context'
import { cx } from '@octane-xplat/lib'
import { Button } from './Button.macos.tsrx'

export function ToggleButton(props: ToggleButtonProps) @{
	const group = useToggleButtonGroup()
	const [local, setLocal] = useState(!!props.isPressed)
	const inGroup = group != null && props.value != null
	const pressed = inGroup ? group!.selectedValues.has(props.value!) : (props.isPressed ?? local)
	// Keep local intent separate from controlled/group display. An accepted
	// Button callback retains its props even if URL dispatch updates the parent.
	const current = useRef(local)
	const disabled = Boolean(props.isDisabled || group?.isDisabled)
	const activate = () => {
		if (disabled) return
		if (inGroup) { group!.toggle(props.value!); return }
		const next = !(props.isPressed ?? current.current)
		if (props.isPressed === undefined) { current.current = next; setLocal(next) }
		props.onPressedChange?.(next)
		return props.pressedChangeAction?.(next)
	}
	<Button {...props} variant="ghost" size={props.size ?? group?.size}
		isDisabled={disabled} clickAction={activate}
		icon={pressed ? (props.pressedIcon ?? props.icon) : props.icon}
		accessibilityState={{ ...props.accessibilityState, pressed }}
		className={cx('vx-toggle-button', pressed && 'vx-toggle-button--pressed',
			pressed && props.color && `vx-toggle-button--${props.color}`, props.className)} />
}

export function ToggleButtonGroup(props: ToggleButtonGroupProps) @{
	const type = props.type ?? 'single'
	const selected = new Set(
		Array.isArray(props.value) ? props.value : props.value == null ? [] : [props.value],
	)

	const toggle = (key: string) => {
		if (props.isDisabled) return
		if (type === 'multiple') {
			const next = new Set(selected)
			if (next.has(key)) {
				next.delete(key)
			} else {
				next.add(key)
			}

			;(props as Extract<ToggleButtonGroupProps, { type: 'multiple' }>).onChange([...next])
		} else {
			;(props as Extract<ToggleButtonGroupProps, { type?: 'single' }>).onChange(
				selected.has(key) ? null : key,
			)
		}
	}

	<ToggleButtonGroupProvider
		value={{ selectedValues: selected, toggle, size: props.size, isDisabled: props.isDisabled }}
	>
		<masonview
			id={props.id}
			className={cx(
				'vx-toggle-button-group',
				`vx-button-group--${props.orientation ?? 'horizontal'}`,
				props.className,
			)}
			style={mergeStyle({ display: 'flex' }, props.style)}
			accessibilityRole="group"
			accessibilityLabel={props.label}
		>
			{props.children}
		</masonview>
	</ToggleButtonGroupProvider>
}
