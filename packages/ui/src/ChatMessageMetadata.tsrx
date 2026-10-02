/** @jsxImportSource @nativescript-community/octane */
import type { ChatMessageMetadataProps, ChatMessageStatus } from './props';
import { cx } from './cx';
import { Icon } from './Icon';
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
 *  Renders nothing when all three are absent. User-sender rows right-align
 *  (the DOM leaf uses row-reverse; NS children order is explicit). */
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
	const isUser = sender === 'user';

	<flexboxlayout
		id={props.id}
		className={cx('vx-chatmeta', isUser && 'vx-chatmeta--user', props.className)}
		style={props.style}
		flexDirection="row"
		alignItems="center"
		justifyContent={isUser ? 'flex-end' : 'flex-start'}
	>
		{hasTimestamp ? <flexboxlayout className="vx-chatmeta-part">{props.timestamp}</flexboxlayout> : null}
		{hasTimestamp && (hasFooter || hasStatus) ? <label className="vx-chatmeta-sep" text="·" /> : null}
		{hasFooter ? <flexboxlayout className="vx-chatmeta-part">{props.footer}</flexboxlayout> : null}
		{hasFooter && hasStatus ? <label className="vx-chatmeta-sep" text="·" /> : null}
		{hasStatus ? (
			<flexboxlayout
				className={cx('vx-chatmeta-status', `vx-chatmeta-status--${status}`)}
				flexDirection="row"
				alignItems="center"
				accessibilityLabel={`Message ${STATUS_LABEL[status].toLowerCase()}`}
			>
				<Icon name={STATUS_ICON[status]} size={12} />
				<label className="vx-chatmeta-status-text" text={STATUS_LABEL[status]} />
			</flexboxlayout>
		) : null}
	</flexboxlayout>
}
