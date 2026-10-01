import type { ClickableCardProps } from './props'
import { cx } from './cx'
import { sanitizeUrl } from './safe-url'

export function ClickableCard(props: ClickableCardProps) @{
	const className = cx('vx-card', 'vx-clickable-card', `vx-card--${props.variant ?? 'default'}`, props.elevation && `vx-card--elev-${props.elevation}`, props.isDisabled && 'vx-card--disabled', props.className)
	const style = {...props.style, padding: (props.padding ?? 4) * 4, width: props.width, height: props.height, maxWidth: props.maxWidth}

	@if (props.href && !props.isDisabled) {
		<a id={props.id} href={sanitizeUrl(props.href) ?? undefined} target={props.target} rel={props.target === '_blank' ? 'noreferrer' : undefined} aria-label={props.label} className={className} style={style} onClick={props.onPress}>{props.children}</a>
	} @else {
		<button id={props.id} type="button" aria-label={props.label} disabled={props.isDisabled} className={className} style={style} onClick={props.onPress}>{props.children}</button>
	}
}
