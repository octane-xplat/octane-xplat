/** @jsxImportSource @octane-xplat/jsx */
import type { ClickableCardProps } from '../../props'
import { styleRecord } from '../../internal/layout/style-merge'
import { TextSlot } from '../forms/text-slot'
import { Pressable } from './Pressable'
import { cx } from '@octane-xplat/lib'
import { sanitizeUrl } from '../../routing/safe-url'
import { Utils } from '@nativescript/core'

/**
 * Card whose whole surface is a press/link target; nested interactive children still work. `href` keeps real link semantics on web. Import from `@octane-xplat/ui`.
 *
 * @see ClickableCardProps, SelectableCardProps.
 */
export function ClickableCard(props: ClickableCardProps): unknown @{
	const activate = () => {
		if (props.isDisabled) {
			return
		}

		if (props.href) {
			const url = sanitizeUrl(props.href)
			if (url) {
				Utils.openUrl(url)
			}
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
			paddingTop: (props.padding ?? 4) * 4,
			paddingRight: (props.padding ?? 4) * 4,
			paddingBottom: (props.padding ?? 4) * 4,
			paddingLeft: (props.padding ?? 4) * 4,
			width: props.width,
			height: props.height,
			maxWidth: props.maxWidth,
		}}
		disabled={props.isDisabled}
		onPress={activate}
		accessibilityRole={props.href && !props.isDisabled ? 'link' : 'button'}
		accessibilityLabel={props.label}
		accessibilityState={{ disabled: props.isDisabled }}
	>
		<TextSlot>{props.children}</TextSlot>
	</Pressable>
}
