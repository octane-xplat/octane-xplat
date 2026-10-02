import type { ChatMessageMetadataProps, ChatMessageStatus } from './props';
import { Icon } from './Icon.web.tsrx';
import { useChatMessageContext } from './chat-context';

const STATUS_ICON: Record<ChatMessageStatus, string> = {
	sending: 'xplat-clock',
	sent: 'xplat-check',
	delivered: 'xplat-check-double',
	read: 'xplat-check-double',
	error: 'xplat-error',
};

const STATUS_LABEL: Record<ChatMessageStatus, string> = {
	sending: 'Sending',
	sent: 'Sent',
	delivered: 'Delivered',
	read: 'Read',
	error: 'Failed',
};

const renderable = (v: any) => v != null && v !== false && v !== true;

/** Composable metadata row for chat messages — timestamp · footer · status.
 *  Renders nothing when all three are absent. Direction reverses for the
 *  'user' sender (read from the enclosing ChatMessage). */
export function ChatMessageMetadata(props: ChatMessageMetadataProps) @{
	const msgContext = useChatMessageContext();
	const sender = msgContext?.sender ?? 'assistant';
	const hasTimestamp = renderable(props.timestamp);
	const hasFooter = renderable(props.footer);
	const hasStatus = props.status != null;
	if (!hasTimestamp && !hasFooter && !hasStatus) {
		return null;
	}

	const status = props.status!;

	<div
		id={props.id}
		className={['vx-chatmeta', sender === 'user' ? 'vx-chatmeta--user' : undefined, props.className]}
		style={props.style}
	>
		{hasTimestamp ? <span>{props.timestamp}</span> : null}
		{hasTimestamp && (hasFooter || hasStatus) ? <span className="vx-chatmeta-sep">·</span> : null}
		{hasFooter ? props.footer : null}
		{hasFooter && hasStatus ? <span className="vx-chatmeta-sep">·</span> : null}
		{hasStatus ? (
			<span
				className={['vx-chatmeta-status', `vx-chatmeta-status--${status}`]}
				title={STATUS_LABEL[status]}
				aria-label={`Message ${STATUS_LABEL[status].toLowerCase()}`}
			>
				<Icon name={STATUS_ICON[status]} size={12} />
				<span>{STATUS_LABEL[status]}</span>
			</span>
		) : null}
	</div>
}
