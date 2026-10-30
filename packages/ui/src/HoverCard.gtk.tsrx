/** @jsxImportSource @octane-xplat/jsx */
import type { HoverCardProps } from './props'
import { useHoverCard } from './use-hover-card'
import { cx } from '@octane-xplat/lib'
import { View } from './View'

/** Hover/focus-triggered floating card — GTK leaf. Identical to the shared
 *  leaf; the `useHoverCard` hook resolves to `use-hover-card.gtk.tsrx`, which
 *  wires Gtk.EventControllerMotion pointer intent instead of AppKit tracking
 *  areas. `focusTrigger` has no native focus traversal to key on — inert. */
export function HoverCard(props: HoverCardProps) @{
	const card = useHoverCard({
		placement: props.placement,
		alignment: props.alignment,
		delay: props.delay,
		hideDelay: props.hideDelay,
		focusTrigger: props.focusTrigger,
		touchTrigger: props.touchTrigger,
		isEnabled: props.isEnabled,
		label: props.label,
		isOpen: props.isOpen,
		isDefaultOpen: props.isDefaultOpen,
		onShow: () => props.onOpenChange?.(true),
		onHide: () => props.onOpenChange?.(false),
	})

	<>
		<View
			id={props.id}
			ref={card.ref}
			className={cx('vx-hovercard-trigger', props.className)}
			style={props.style}
			ios={props.ios}
			android={props.android}
		>
			{props.children}
		</View>
		{card.renderHoverCard(props.content, { className: props.className })}
	</>
}
