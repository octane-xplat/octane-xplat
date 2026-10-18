/** @jsxImportSource @nativescript-community/octane */
import type { ChatMessageBubbleProps } from './props';
import { cx } from '@octane-xplat/lib';
import { useChatMessageContext } from './chat-context';

const renderable = (v: any) => v != null && v !== false && v !== true;

/** Styled content container — the chat bubble. Reads sender and density from
 *  the enclosing ChatMessage (or list defaults). `variant="ghost"` drops the
 *  background but keeps the padding so custom content stays column-aligned;
 *  `group` tightens sender-side corners between consecutive bubbles.
 *  Native note: `width` accepts dips only (percentage strings pass through
 *  to the view's width when set). */
export function ChatMessageBubble(props: ChatMessageBubbleProps) @{
	const msgContext = useChatMessageContext();
	const sender = msgContext?.sender ?? 'assistant';
	const density = msgContext?.density ?? 'balanced';
	const isUser = sender === 'user';
	const variant = props.variant ?? 'filled';
	const hasName = renderable(props.name);
	const hasMetadata = renderable(props.metadata);

	<>
		{hasName ? (
			<masonview display="flex" className={cx('vx-chatbubble-name', `vx-chatbubble-name--${density}`, isUser && 'vx-chatbubble-name--end')} alignSelf={isUser ? 'flex-end' : 'flex-start'}>
				{props.name}
			</masonview>
		) : null}
		<masonview display="flex" id={props.id} className={cx(
				'vx-chatbubble',
				`vx-chatbubble--${variant}`,
				`vx-chatbubble--${sender}`,
				`vx-chatbubble--${density}`,
				props.group && `vx-chatbubble--${props.group}-${isUser ? 'user' : 'assistant'}`,
				props.className,
			)} style={{ ...(props.width != null ? { width: props.width } : {}), ...(props.style as any) }} flexDirection="column">
			{props.children}
		</masonview>
		{hasMetadata ? (
			<masonview display="flex" className={cx('vx-chatbubble-meta', `vx-chatbubble-meta--${density}`, isUser && 'vx-chatbubble-meta--end')} alignSelf={isUser ? 'flex-end' : 'flex-start'}>
				{props.metadata}
			</masonview>
		) : null}
	</>
}
