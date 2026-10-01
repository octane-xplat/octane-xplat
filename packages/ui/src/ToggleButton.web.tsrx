import { useState } from 'octane'
import type { ToggleButtonProps, ToggleButtonGroupProps } from './props'
import { useToggleButtonGroup, ToggleButtonGroupContext } from './toggle-button-group-context'
import { Button } from './Button.web.tsrx'

export function ToggleButton(props: ToggleButtonProps) @{
	const group = useToggleButtonGroup()
	const [localPressed, setLocalPressed] = useState(!!props.isPressed)
	const inGroup = group != null && props.value != null
	const pressed = inGroup ? group!.selectedValues.has(props.value!) : props.isPressed ?? localPressed
	const controlled = props.isPressed !== undefined
	const disabled = !!(props.isDisabled || group?.isDisabled)
	let actionValue = !pressed
	const activate = () => {
		if (disabled) return
		if (inGroup) { group!.toggle(props.value!); return }
		const next = !pressed
		actionValue = next
		if (!controlled) setLocalPressed(next)
		props.onPressedChange?.(next)
	}

	<Button {...props} variant={pressed ? 'secondary' : 'ghost'} isDisabled={disabled} icon={pressed ? (props.pressedIcon ?? props.icon) : props.icon} onPress={activate} clickAction={() => props.pressedChangeAction?.(actionValue)} accessibilityState={{...props.accessibilityState, pressed}} className={['vx-toggle-button', pressed ? 'vx-toggle-button--pressed' : undefined, props.className]} />
}

export function ToggleButtonGroup(props: ToggleButtonGroupProps) @{
	const type = props.type ?? 'single'
	const selected = new Set(Array.isArray(props.value) ? props.value : props.value == null ? [] : [props.value])
	const toggle = (key: string) => {
		if (type === 'multiple') {
			const next = new Set(selected); if (next.has(key)) next.delete(key); else next.add(key)

			;(props as Extract<ToggleButtonGroupProps, {type:'multiple'}>).onChange([...next])
		} else (props as Extract<ToggleButtonGroupProps, {type?:'single'}>).onChange(selected.has(key) ? null : key)
	}

	<ToggleButtonGroupContext.Provider value={{selectedValues:selected, toggle, size:props.size, isDisabled:props.isDisabled}}>
		<div id={props.id} role="group" aria-label={props.label} className={['vx-toggle-button-group', `vx-button-group--${props.orientation ?? 'horizontal'}`, props.className]} style={props.style}>{props.children}</div>
	</ToggleButtonGroupContext.Provider>
}
