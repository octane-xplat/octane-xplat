/** @jsxImportSource @octane-xplat/jsx/dom */
import type { ChatLayoutScrollButtonProps } from '../props'
import { Icon } from '../components/media/Icon.web.tsrx'
import { Pressable } from '../components/actions/Pressable.web.tsrx'

/** Floating scroll-to-bottom pill for ChatLayout. Hidden controls are
 *  unmounted, matching the native leaf and removing keyboard/hit targets. */
export function ChatLayoutScrollButton(props: ChatLayoutScrollButtonProps) @{
	// The outer element centers the pill and owns the gap above the
	// composer; the pill carries the painted surface.

	@if (props.isVisible) {
		<div id={props.id} className={['vx-chatscroll-wrap', props.className]} style={props.style}>
			<div
				className={[
					'vx-chatscroll',
					'vx-chatscroll--visible',
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
}
