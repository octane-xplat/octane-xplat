/** @jsxImportSource @nativescript-community/octane */
import type { HoverCardProps } from './props';
import { useHoverCard } from './use-hover-card.tsrx';
import { cx } from './cx';
import { View } from './View.tsrx';

/** Default (macOS) leaf — pointer intent comes from the AppKit host
 *  bridge (tracking areas + anchored NSPopover); iOS/Android resolve the
 *  `.mobile` leaf (tap-to-open). Bridge-absent targets render the
 *  trigger only. `focusTrigger` has no native focus traversal to key on
 *  — inert here (documented deviation). */
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
	});

	<>
		<View
			id={props.id}
			bind={card.ref}
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
