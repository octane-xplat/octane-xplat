/** @jsxImportSource @nativescript-community/octane */
import type { ChatLayoutScrollButtonProps } from './props';
import { cx } from './cx';
import { Icon } from './Icon';
import { Pressable } from './Pressable';

/** Floating scroll-to-bottom pill for ChatLayout. Native keeps the same
 *  anatomy (centered pill above the composer, optional expanding label);
 *  the fade/max-width transition is a DOM behavior — native toggles
 *  visibility without animation. */
export function ChatLayoutScrollButton(props: ChatLayoutScrollButtonProps) @{
	if (!props.isVisible) {
		return null;
	}
	<flexboxlayout
		id={props.id}
		className={cx('vx-chatscroll-wrap', props.className)}
		style={props.style}
		justifyContent="center"
	>
		<Pressable
			className={cx('vx-chatscroll', props.label ? 'vx-chatscroll--expanded' : 'vx-chatscroll--collapsed')}
			accessibilityRole="button"
			accessibilityLabel={props.label ?? 'Scroll to bottom'}
			onPress={props.onPress}
		>
			<Icon name="xplat-chevron-down" size={16} />
			{props.label ? <label className="vx-chatscroll-label" text={props.label} /> : null}
		</Pressable>
	</flexboxlayout>
}
