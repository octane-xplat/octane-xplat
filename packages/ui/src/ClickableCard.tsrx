/** @jsxImportSource @nativescript-community/octane */
import type { ClickableCardProps } from './props'
import { Pressable } from './Pressable.tsrx'
import { cx } from './cx'
import { sanitizeUrl } from './safe-url'
import { Utils } from '@nativescript/core'

export function ClickableCard(props: ClickableCardProps) @{
	const activate = () => { if (props.isDisabled) return; if (props.href) { const url = sanitizeUrl(props.href); if (url) Utils.openUrl(url) }; props.onPress?.() }

	<Pressable id={props.id} className={cx('vx-card', 'vx-clickable-card', `vx-card--${props.variant ?? 'default'}`, props.elevation && `vx-card--elev-${props.elevation}`, props.isDisabled && 'vx-card--disabled', props.className)} style={{...props.style, padding: (props.padding ?? 4) * 4, width: props.width, height: props.height, maxWidth: props.maxWidth}} disabled={props.isDisabled} onPress={activate} accessibilityRole="button" accessibilityLabel={props.label} accessibilityState={{disabled:props.isDisabled}}>{props.children}</Pressable>
}
