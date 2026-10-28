/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import type { HoverCardProps } from './props'
import { useHoverCard } from './use-hover-card.mobile.tsrx'
import { cx } from '@octane-xplat/lib'

/** Touch-leaf HoverCard: a tap on the trigger opens the anchored card
 *  (`touchTrigger` 'auto'/'tap'; 'none' disables it). There is no hover
 *  or focus traversal on iOS/Android, so `delay`/`hideDelay`/
 *  `focusTrigger` are inert — documented deviations. */
export function HoverCard(props: HoverCardProps) @{
	const card = useHoverCard({
		placement: props.placement,
		alignment: props.alignment,
		touchTrigger: props.touchTrigger,
		isEnabled: props.isEnabled,
		label: props.label,
		isOpen: props.isOpen,
		isDefaultOpen: props.isDefaultOpen,
		onShow: () => props.onOpenChange?.(true),
		onHide: () => props.onOpenChange?.(false),
	})

	<>
		<masonview
			id={props.id}
			ref={card.ref}
			className={cx('vx-hovercard-trigger', props.className)}
			style={mergeStyle({ display: 'flex' }, props.style)}
			ios={props.ios}
			android={props.android}
		>
			{props.children}
		</masonview>
		{card.renderHoverCard(props.content, { className: props.className })}
	</>
}
