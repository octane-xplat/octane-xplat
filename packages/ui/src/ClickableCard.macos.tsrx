/** @jsxImportSource @xplat/macos/renderer */
import type { ClickableCardProps } from './props'
import { Pressable } from './Pressable.macos.tsrx'
import { cx } from './cx'
export function ClickableCard(props: ClickableCardProps) @{
	<Pressable id={props.id} className={cx('vx-card','vx-clickable-card',`vx-card--${props.variant??'default'}`,props.isDisabled&&'vx-card--disabled',props.className)} style={{...props.style,padding:(props.padding??4)*4,width:props.width,height:props.height,maxWidth:props.maxWidth}} disabled={props.isDisabled} onPress={props.onPress} accessibilityRole="button" accessibilityLabel={props.label} accessibilityState={{disabled:props.isDisabled}}>{props.children}</Pressable>
}
