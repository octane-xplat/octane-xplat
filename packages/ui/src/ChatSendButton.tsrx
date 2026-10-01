/** @jsxImportSource @nativescript-community/octane */
import type { ChatSendButtonProps } from './props';
import { cx } from './cx';
import { Icon } from './Icon.tsrx';
import { Pressable } from './Pressable.tsrx';
import { useChatComposerContext } from './chat-context';

/** Circular send/stop toggle for the chat composer. Reads
 *  ChatComposerContext by default — every value is prop-overridable for
 *  standalone use. */
export function ChatSendButton(props: ChatSendButtonProps) @{
	const ctx = useChatComposerContext();
	const isStopShown = props.isStopShown ?? ctx?.isStopShown ?? false;
	const isDisabled = props.isDisabled ?? !(ctx?.canSend ?? false);
	const onStop = props.onStop ?? ctx?.onStop;
	const size = props.size ?? 'md';

	const activate = () => {
		if (isStopShown) {
			onStop?.();
		} else {
			if (props.onSend) props.onSend();
			else ctx?.onSubmit(ctx.value);
		}
		props.onPress?.();
	};

	<Pressable
		id={props.id}
		className={cx(
			'vx-chatsend',
			`vx-chatsend--${size}`,
			isStopShown ? 'vx-chatsend--stop' : 'vx-chatsend--send',
			props.className,
		)}
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
