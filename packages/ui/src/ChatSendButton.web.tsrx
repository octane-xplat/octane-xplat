/** @jsxImportSource @octane-xplat/jsx/dom */
import type { ChatSendButtonProps } from './props'
import { Icon } from './Icon.web.tsrx'
import { Pressable } from './Pressable.web.tsrx'
import { useChatComposerContext } from './chat-context'

/** Circular send/stop toggle for the chat composer. Reads
 *  ChatComposerContext by default — every value is prop-overridable for
 *  standalone use. Send = accent + arrow-up (disabled when empty); stop =
 *  neutral + stop glyph, calls onStop. */
export function ChatSendButton(props: ChatSendButtonProps) @{
	const ctx = useChatComposerContext()
	const isStopShown = props.isStopShown ?? ctx?.isStopShown ?? false
	const isDisabled = props.isDisabled ?? !(ctx?.canSend ?? false)
	const onCancel = props.onCancel ?? props.onStop ?? ctx?.onCancel ?? ctx?.onStop
	const size = props.size ?? 'md'

	const activate = () => {
		if (isStopShown) {
			onCancel?.()
		} else if (props.onSend) {
			props.onSend()
		} else {
			const sendAction = ctx?.onSend ?? ctx?.onSubmit
			sendAction?.(ctx?.value ?? '')
		}

		props.onPress?.()
	}

	<Pressable
		id={props.id}
		className={[
			'vx-chatsend',
			`vx-chatsend--${size}`,
			isStopShown ? 'vx-chatsend--stop' : 'vx-chatsend--send',
			props.className,
		]}
		style={props.style}
		accessibilityRole="button"
		accessibilityLabel={isStopShown ? 'Stop' : 'Send'}
		disabled={!isStopShown && isDisabled}
		onPress={activate}
	>
		{isStopShown
			? (props.stopIcon ?? <Icon name="xplat-stop" size={size === 'sm' ? 14 : 16} />)
			: (props.sendIcon ?? <Icon name="xplat-send" size={size === 'sm' ? 14 : 16} />)}
	</Pressable>
}
