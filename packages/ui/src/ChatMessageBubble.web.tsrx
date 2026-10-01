import type { ChatMessageBubbleProps } from './props';
import { useChatMessageContext } from './chat-context';

const renderable = (v: any) => v != null && v !== false && v !== true;

/** Styled content container — the chat bubble. Reads sender and density from
 *  the enclosing ChatMessage (or list defaults). `variant="ghost"` drops the
 *  background but keeps the padding so custom content stays column-aligned;
 *  `group` tightens sender-side corners between consecutive bubbles. */
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
			<div
				className={['vx-chatbubble-name', `vx-chatbubble-name--${density}`, isUser ? 'vx-chatbubble-name--end' : undefined]}
			>
				{props.name}
			</div>
		) : null}
		<div
			id={props.id}
			className={[
				'vx-chatbubble',
				`vx-chatbubble--${variant}`,
				`vx-chatbubble--${sender}`,
				`vx-chatbubble--${density}`,
				props.group ? `vx-chatbubble--${props.group}-${isUser ? 'user' : 'assistant'}` : undefined,
				props.className,
			]}
			style={{
				...(props.width != null
					? { width: props.width, maxWidth: 'none' }
					: {}),
				...props.style,
			}}
		>
			{props.children}
		</div>
		{hasMetadata ? (
			<div
				className={['vx-chatbubble-meta', `vx-chatbubble-meta--${density}`, isUser ? 'vx-chatbubble-meta--end' : undefined]}
			>
				{props.metadata}
			</div>
		) : null}
	</>
}
