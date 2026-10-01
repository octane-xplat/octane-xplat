import type { ChatSystemMessageProps } from './props';
import { Separator } from './Separator.web.tsrx';

/** Centered system message — "conversation started", date separators, status
 *  changes. `divider` renders hairlines flanking the content. */
export function ChatSystemMessage(props: ChatSystemMessageProps) @{
	if (props.variant === 'divider') {
		return (
		<div
			id={props.id}
			className={['vx-chatsys', 'vx-chatsys--divider', props.className]}
			style={props.style}
			role="status"
		>
			<Separator />
			<span className="vx-chatsys-content">{props.children}</span>
			<Separator />
		</div>
		);
	}

	return (
		<div
			id={props.id}
			className={['vx-chatsys', props.className]}
			style={props.style}
			role="status"
		>
			<span className="vx-chatsys-content">
				{props.icon != null ? <span className="vx-chatsys-icon">{props.icon}</span> : null}
				{props.children}
			</span>
		</div>
	);
}
