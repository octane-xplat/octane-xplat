/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import { useState } from 'octane'
import type { ToggleButtonProps, ToggleButtonGroupProps } from './props'
import { useToggleButtonGroup, ToggleButtonGroupContext } from './toggle-button-group-context'
import { Button } from './Button.tsrx'
import { cx } from '@octane-xplat/lib'

/**
 * Button with a pressed state (`isPressed`/`onPressedChange`), optional `pressedChangeAction`, and `pressedIcon`. Inside `ToggleButtonGroup` the group owns state via `value`. Import from `@octane-xplat/ui`.
 *
 * @see ToggleButtonProps, ToggleButtonGroupProps.
 */
export function ToggleButton(props: ToggleButtonProps) @{
	const group = useToggleButtonGroup()
	const [localPressed, setLocalPressed] = useState(!!props.isPressed)
	const inGroup = group != null && props.value != null
	const pressed = inGroup ? group!.selectedValues.has(props.value!) : props.isPressed ?? localPressed
	const controlled = props.isPressed !== undefined
	const disabled = !!(props.isDisabled || group?.isDisabled)
	const size = props.size ?? group?.size ?? 'md'
	let actionValue = !pressed
	const activate = () => {
		if (disabled) return
		if (inGroup) { group!.toggle(props.value!); return }
		const next = !pressed
		actionValue = next
		if (!controlled) setLocalPressed(next)
		props.onPressedChange?.(next)
	}

	<Button {...props} size={size} variant={pressed ? 'secondary' : 'ghost'} isDisabled={disabled} icon={pressed ? (props.pressedIcon ?? props.icon) : props.icon} clickAction={() => { activate(); return props.pressedChangeAction?.(actionValue) }} accessibilityState={{...props.accessibilityState, pressed}} className={cx('vx-toggle-button', pressed && 'vx-toggle-button--pressed', props.className)} />
}

/**
 * Keyed single- or multi-select group of `ToggleButton`s. Import from `@octane-xplat/ui`.
 *
 * @see ToggleButtonGroupProps.
 */
export function ToggleButtonGroup(props: ToggleButtonGroupProps) @{
	const type = props.type ?? 'single'
	const controlled = props.value
	const selected = new Set(Array.isArray(controlled) ? controlled : controlled == null ? [] : [controlled])
	const toggle = (key: string) => {
		if (type === 'multiple') {
			const next = new Set(selected)
			if (next.has(key)) next.delete(key); else next.add(key)

			;(props as Extract<ToggleButtonGroupProps, {type:'multiple'}>).onChange([...next])
		} else {
			;(props as Extract<ToggleButtonGroupProps, {type?:'single'}>).onChange(selected.has(key) ? null : key)
		}
	}

	const context = { selectedValues: selected, toggle, size: props.size, isDisabled: props.isDisabled }

	<ToggleButtonGroupContext.Provider value={context}>
		<masonview id={props.id} className={cx('vx-toggle-button-group', `vx-button-group--${props.orientation ?? 'horizontal'}`, props.className)} style={mergeStyle({display: "flex"}, props.style as any)} accessible={true} accessibilityLabel={props.label}>{props.children}</masonview>
	</ToggleButtonGroupContext.Provider>
}
