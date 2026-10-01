/** @jsxImportSource @nativescript-community/octane */
import { useMemo } from 'octane';
import type { ChatMessageProps } from './props';
import { cx } from './cx';
import { ChatMessageProvider, useChatListContext } from './chat-context';

const renderable = (v: any) => v != null && v !== false && v !== true;

/** Sender context wrapper for one chat message — renders an optional avatar,
 *  a name row, the body children (usually ChatMessageBubble), and trailing
 *  metadata. Sender drives alignment: user right, assistant left, system
 *  centered (avatar/name suppressed for system). NS has no row-reverse
 *  column order, so the user variant places the avatar after the content
 *  column instead — same visual result. */
export function ChatMessage(props: ChatMessageProps) @{
	const listContext = useChatListContext();
	const density = props.density ?? listContext?.density ?? 'balanced';
	const contextValue = useMemo(() => ({ sender: props.sender, density }), [props.sender, density]);
	const isSystem = props.sender === 'system';
	const isUser = props.sender === 'user';
	const hasAvatar = renderable(props.avatar) && !isSystem;
	const hasName = renderable(props.name) && !isSystem;
	const hasMetadata = renderable(props.metadata) && !isSystem;

	<ChatMessageProvider value={contextValue}>
		<flexboxlayout
			id={props.id}
			className={cx('vx-chatmsg', `vx-chatmsg--${props.sender}`, `vx-chatmsg--${density}`, props.className)}
			style={props.style}
			flexDirection="row"
			justifyContent={isSystem ? 'center' : 'flex-start'}
			accessibilityLabel={props.accessibilityLabel ?? (!hasName ? `Message from ${props.sender}` : undefined)}
		>
			{hasAvatar && !isUser ? <flexboxlayout className="vx-chatmsg-avatar">{props.avatar}</flexboxlayout> : null}
			<flexboxlayout
				className={cx('vx-chatmsg-content', `vx-chatmsg-content--${props.sender}`)}
				flexDirection="column"
				flexGrow={1}
				alignItems={isSystem ? 'center' : isUser ? 'flex-end' : 'flex-start'}
			>
				{hasName ? <flexboxlayout className="vx-chatmsg-name">{props.name}</flexboxlayout> : null}
				<flexboxlayout
					className={cx('vx-chatmsg-children', `vx-chatmsg-children--${props.sender}`, `vx-chatmsg-children--${density}`)}
					flexDirection="column"
					alignItems={isSystem ? 'center' : isUser ? 'flex-end' : 'flex-start'}
				>
					{props.children}
				</flexboxlayout>
				{hasMetadata ? <flexboxlayout className="vx-chatmsg-meta">{props.metadata}</flexboxlayout> : null}
			</flexboxlayout>
			{hasAvatar && isUser ? <flexboxlayout className="vx-chatmsg-avatar">{props.avatar}</flexboxlayout> : null}
		</flexboxlayout>
	</ChatMessageProvider>
}
