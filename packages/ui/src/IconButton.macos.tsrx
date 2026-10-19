/** @jsxImportSource @octane-xplat/macos-renderer */
import { useState } from 'octane'
import type { IconButtonProps } from './props'
import { Pressable } from './Pressable.macos.tsrx'
import { ActivityIndicator } from './controls.macos.tsrx'
import { Icon } from './Icon.macos.tsrx'
import { Text } from './Text.macos.tsrx'
import { cx } from '@octane-xplat/lib'
import { reportActionError } from './action-error'
export function IconButton(props: IconButtonProps) @{
	const [pending, setPending] = useState(false)
	const disabled = !!(props.isDisabled || props.isLoading)
	const loading = !!(props.isLoading || pending)
	const press = () => {
		if (disabled || (pending && !props.isInterruptible)) return
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

	<Pressable id={props.id} className={cx('vx-button','vx-button--icon',`vx-button--${props.variant??'secondary'}`,props.className)} style={props.style} disabled={disabled} onPress={press} accessibilityLabel={props.accessibilityLabel??props.label} accessibilityRole="button">
		{loading?<ActivityIndicator/>:<>{typeof props.icon==='string'?<Icon name={props.icon}/>:props.icon}{props.label?<Text className="vx-visually-hidden">{props.label}</Text>:null}</>}
	</Pressable>
}
