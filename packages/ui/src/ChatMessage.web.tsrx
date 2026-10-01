import { useId, useMemo } from 'octane';
import type { ChatMessageProps } from './props';
import { ChatMessageProvider, useChatListContext } from './chat-context';

const renderable = (v: any) => v != null && v !== false && v !== true;

/** Sender context wrapper for one chat message — renders an optional avatar,
 *  a name row, the body children (usually ChatMessageBubble), and trailing
 *  metadata. Sender drives alignment: user right, assistant left, system
 *  centered (avatar/name suppressed for system). */
export function ChatMessage(props: ChatMessageProps) @{
	const listContext = useChatListContext();
	const density = props.density ?? listContext?.density ?? 'balanced';
	const contextValue = useMemo(() => ({ sender: props.sender, density }), [props.sender, density]);
	const isSystem = props.sender === 'system';
	const hasAvatar = renderable(props.avatar) && !isSystem;
	const hasName = renderable(props.name) && !isSystem;
	const hasMetadata = renderable(props.metadata) && !isSystem;
	const nameId = useId();

	<ChatMessageProvider value={contextValue}>
		<article
			id={props.id}
			className={[
				'vx-chatmsg',
				`vx-chatmsg--${props.sender}`,
				`vx-chatmsg--${density}`,
				props.className,
			]}
			style={props.style}
			aria-label={!hasName ? `Message from ${props.sender}` : undefined}
			aria-labelledby={hasName ? nameId : undefined}
		>
			{hasAvatar ? <div className="vx-chatmsg-avatar">{props.avatar}</div> : null}
			<div className={['vx-chatmsg-content', `vx-chatmsg-content--${props.sender}`]}>
				{hasName ? (
					<div id={nameId} className="vx-chatmsg-name">{props.name}</div>
				) : null}
				<div className={['vx-chatmsg-children', `vx-chatmsg-children--${props.sender}`, `vx-chatmsg-children--${density}`]}>
					{props.children}
				</div>
				{hasMetadata ? <div className="vx-chatmsg-meta">{props.metadata}</div> : null}
			</div>
		</article>
	</ChatMessageProvider>
}
