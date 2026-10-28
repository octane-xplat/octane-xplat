/** @jsxImportSource @octane-xplat/jsx */
import type { ClickableCardProps } from './props'
import { styleRecord } from './style-merge'
import { Pressable } from './Pressable.macos.tsrx'
import { cx } from '@octane-xplat/lib'
import { openUrl } from '@octane-xplat/platform'
import { sanitizeUrl } from './safe-url'
import { TextSlot } from './text-slot'
export function ClickableCard(props: ClickableCardProps) @{
	const activate = () => {
		if (props.isDisabled) return
		if (props.href) {
			const url = sanitizeUrl(props.href)
			if (url) openUrl(url)
		}
		props.onPress?.()
	}
	<Pressable
		id={props.id}
		className={cx(
			'vx-card',
			'vx-clickable-card',
			`vx-card--${props.variant ?? 'default'}`,
			props.elevation && `vx-card--elev-${props.elevation}`,
			props.isDisabled && 'vx-card--disabled',
			props.className,
		)}
		style={{
			...styleRecord(props.style),
			padding: (props.padding ?? 4) * 4,
			width: props.width,
			height: props.height,
			maxWidth: props.maxWidth,
		}}
		disabled={props.isDisabled}
		onPress={activate}
		accessibilityRole={props.href ? 'link' : 'button'}
		accessibilityLabel={props.label}
		accessibilityState={{ disabled: props.isDisabled }}
	>
		<TextSlot>{props.children}</TextSlot>
	</Pressable>
}
