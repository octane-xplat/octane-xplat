import type { ChatLayoutScrollButtonProps } from './props';
import { Icon } from './Icon.web.tsrx';
import { Pressable } from './Pressable.web.tsrx';

/** Floating scroll-to-bottom pill for ChatLayout — fades in/out and expands
 *  to show a label (e.g. "New messages"). */
export function ChatLayoutScrollButton(props: ChatLayoutScrollButtonProps) @{
	// The outer element centers the pill and owns the gap above the
	// composer; the pill carries the painted surface.
	<div id={props.id} className={['vx-chatscroll-wrap', props.className]} style={props.style}>
		<div
			className={[
				'vx-chatscroll',
				props.isVisible ? 'vx-chatscroll--visible' : 'vx-chatscroll--hidden',
				props.label ? 'vx-chatscroll--expanded' : 'vx-chatscroll--collapsed',
			]}
		>
			<Pressable
				className="vx-chatscroll-btn"
				accessibilityRole="button"
				accessibilityLabel={props.label ?? 'Scroll to bottom'}
				onPress={props.onPress}
			>
				<Icon name="xplat-chevron-down" size={16} />
				{props.label ? <span className="vx-chatscroll-label">{props.label}</span> : null}
			</Pressable>
		</div>
	</div>
}
