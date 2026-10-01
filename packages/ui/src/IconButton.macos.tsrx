/** @jsxImportSource @xplat/macos/renderer */
import type { IconButtonProps } from './props'
import { Pressable } from './Pressable.macos.tsrx'
import { Icon } from './Icon.macos.tsrx'
import { Text } from './Text.macos.tsrx'
import { cx } from './cx'
export function IconButton(props: IconButtonProps) @{
	<Pressable id={props.id} className={cx('vx-button','vx-button--icon',`vx-button--${props.variant??'secondary'}`,props.className)} style={props.style} disabled={props.isDisabled||props.disabled} onPress={props.onPress} accessibilityLabel={props.accessibilityLabel??props.label} accessibilityRole="button">
		{typeof props.icon==='string'?<Icon name={props.icon}/>:props.icon}{props.label?<Text className="vx-visually-hidden">{props.label}</Text>:null}
	</Pressable>
}
