/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../internal/layout/style-merge'
import type { ChatMessageBubbleProps } from '../props'
import { cx } from '@octane-xplat/lib'
import { useChatMessageContext } from './chat-context'

const renderable = (v: any) => v != null && v !== false && v !== true

/** Styled content container — the chat bubble. Reads sender and density from
 *  the enclosing ChatMessage (or list defaults). `variant="ghost"` drops the
 *  background but keeps the padding so custom content stays column-aligned;
 *  `group` tightens sender-side corners between consecutive bubbles.
 *  Native note: `width` accepts dips only (percentage strings pass through
 *  to the view's width when set). */
export function ChatMessageBubble(props: ChatMessageBubbleProps): unknown @{
	const msgContext = useChatMessageContext()
	const sender = msgContext?.sender ?? 'assistant'
	const density = msgContext?.density ?? 'balanced'
	const isUser = sender === 'user'
	const variant = props.variant ?? 'filled'
	const hasName = renderable(props.name)
	const hasMetadata = renderable(props.metadata)

	<>
		{hasName ? (
			<masonview
				className={cx(
					'vx-chatbubble-name',
					`vx-chatbubble-name--${density}`,
					isUser && 'vx-chatbubble-name--end',
				)}
				style={mergeStyle({ alignSelf: isUser ? 'flex-end' : 'flex-start' }, { display: 'flex' })}
			>
				{props.name}
			</masonview>
		) : null}
		<masonview
			id={props.id}
			className={cx(
				'vx-chatbubble',
				`vx-chatbubble--${variant}`,
				`vx-chatbubble--${sender}`,
				`vx-chatbubble--${density}`,
				props.group && `vx-chatbubble--${props.group}-${isUser ? 'user' : 'assistant'}`,
				props.className,
			)}
			style={mergeStyle(
				{ display: 'flex' },
				{ ...(props.width != null ? { width: props.width } : {}), ...styleRecord(props.style) },
			)}
		>
			{props.children}
		</masonview>
		{hasMetadata ? (
			<masonview
				className={cx(
					'vx-chatbubble-meta',
					`vx-chatbubble-meta--${density}`,
					isUser && 'vx-chatbubble-meta--end',
				)}
				style={mergeStyle({ alignSelf: isUser ? 'flex-end' : 'flex-start' }, { display: 'flex' })}
			>
				{props.metadata}
			</masonview>
		) : null}
	</>
}
