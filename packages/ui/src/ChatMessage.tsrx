/** @jsxImportSource @nativescript-community/octane */
import { markChatRow } from './chat-scroll-state'
import { mergeStyle } from './style-merge'
import { useMemo } from 'octane';
import type { ChatMessageProps } from './props';
import { cx } from '@octane-xplat/lib';
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
		<masonview ref={markChatRow} id={props.id} className={cx('vx-chatmsg', `vx-chatmsg--${props.sender}`, `vx-chatmsg--${density}`, props.className)} style={mergeStyle({flexDirection: "row", justifyContent: isSystem ? 'center' : 'flex-start'}, mergeStyle({display: "flex"}, props.style))} accessibilityLabel={props.accessibilityLabel ?? (!hasName ? `Message from ${props.sender}` : undefined)}>
			{hasAvatar && !isUser ? <masonview className="vx-chatmsg-avatar" style={{display: "flex"}}>{props.avatar}</masonview> : null}
			<masonview className={cx('vx-chatmsg-content', `vx-chatmsg-content--${props.sender}`)} style={mergeStyle({flexDirection: "column", flexGrow: 1, alignItems: isSystem ? 'center' : isUser ? 'flex-end' : 'flex-start'}, {display: "flex"})}>
				{hasName ? <masonview className="vx-chatmsg-name" style={{display: "flex"}}>{props.name}</masonview> : null}
				<masonview className={cx('vx-chatmsg-children', `vx-chatmsg-children--${props.sender}`, `vx-chatmsg-children--${density}`)} style={mergeStyle({flexDirection: "column", alignItems: isSystem ? 'center' : isUser ? 'flex-end' : 'flex-start'}, {display: "flex"})}>
					{props.children}
				</masonview>
				{hasMetadata ? <masonview className="vx-chatmsg-meta" style={{display: "flex"}}>{props.metadata}</masonview> : null}
			</masonview>
			{hasAvatar && isUser ? <masonview className="vx-chatmsg-avatar" style={{display: "flex"}}>{props.avatar}</masonview> : null}
		</masonview>
	</ChatMessageProvider>
}
