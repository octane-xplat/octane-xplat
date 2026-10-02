/** @jsxImportSource @octane-xplat/macos-renderer */
import { useState } from 'octane'
import type { ToggleButtonProps, ToggleButtonGroupProps } from './props'
import { useToggleButtonGroup, ToggleButtonGroupContext } from './toggle-button-group-context'
import { Pressable } from './Pressable.macos.tsrx'
import { Text } from './Text.macos.tsrx'
import { Icon } from './Icon.macos.tsrx'
import { cx } from './cx'
export function ToggleButton(props: ToggleButtonProps) @{
	const group=useToggleButtonGroup(); const [local,setLocal]=useState(!!props.isPressed)
	const pressed=group&&props.value!=null?group.selectedValues.has(props.value):props.isPressed??local
	const activate=()=>{if(props.isDisabled||group?.isDisabled)return;if(group&&props.value!=null){group.toggle(props.value);return};const next=!pressed;if(props.isPressed===undefined)setLocal(next);props.onPressedChange?.(next);const action=props.pressedChangeAction?.(next);if(action&&typeof (action as any).then==='function')Promise.resolve(action).catch(()=>{})}

	<Pressable id={props.id} className={cx('vx-button','vx-toggle-button',pressed&&'vx-toggle-button--pressed',props.className)} style={props.style} disabled={props.isDisabled||props.disabled||group?.isDisabled} onPress={activate} accessibilityLabel={props.accessibilityLabel??props.label} accessibilityRole="button" accessibilityState={{pressed}}>
		{typeof (pressed?(props.pressedIcon??props.icon):props.icon)==='string'?<Icon name={(pressed?(props.pressedIcon??props.icon):props.icon) as string}/>:null}<Text>{props.children??props.label}</Text>
	</Pressable>
}

export function ToggleButtonGroup(props: ToggleButtonGroupProps) @{
	const type=props.type??'single';const selected=new Set(Array.isArray(props.value)?props.value:props.value==null?[]:[props.value])
	const toggle=(key:string)=>{if(type==='multiple'){const next=new Set(selected);if(next.has(key))next.delete(key);else next.add(key);(props as Extract<ToggleButtonGroupProps,{type:'multiple'}>).onChange([...next])}else (props as Extract<ToggleButtonGroupProps,{type?:'single'}>).onChange(selected.has(key)?null:key)}

	<ToggleButtonGroupContext.Provider value={{selectedValues:selected,toggle,size:props.size,isDisabled:props.isDisabled}}><flexboxlayout id={props.id} className={cx('vx-toggle-button-group',`vx-button-group--${props.orientation??'horizontal'}`,props.className)} style={props.style} accessibilityLabel={props.label}>{props.children}</flexboxlayout></ToggleButtonGroupContext.Provider>
}
