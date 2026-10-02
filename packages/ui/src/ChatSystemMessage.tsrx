/** @jsxImportSource @nativescript-community/octane */
import type { ChatSystemMessageProps } from './props';
import { cx } from './cx';
import { Separator } from './Separator';

/** Centered system message — "conversation started", date separators, status
 *  changes. `divider` renders hairlines flanking the content. */
export function ChatSystemMessage(props: ChatSystemMessageProps) @{
	if (props.variant === 'divider') {
		return (
		<flexboxlayout
			id={props.id}
			className={cx('vx-chatsys', 'vx-chatsys--divider', props.className)}
			style={props.style}
			flexDirection="row"
			alignItems="center"
			justifyContent="center"
		>
			<Separator className="vx-chatsys-rule" />
			<flexboxlayout className="vx-chatsys-content">{props.children}</flexboxlayout>
			<Separator className="vx-chatsys-rule" />
		</flexboxlayout>
		);
	}

	return (
		<flexboxlayout
			id={props.id}
			className={cx('vx-chatsys', props.className)}
			style={props.style}
			flexDirection="row"
			alignItems="center"
			justifyContent="center"
		>
			<flexboxlayout className="vx-chatsys-content" flexDirection="row" alignItems="center">
				{props.icon != null ? <flexboxlayout className="vx-chatsys-icon">{props.icon}</flexboxlayout> : null}
				{props.children}
			</flexboxlayout>
		</flexboxlayout>
	);
}
