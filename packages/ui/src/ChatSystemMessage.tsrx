/** @jsxImportSource @nativescript-community/octane */
import type { ChatSystemMessageProps } from './props';
import { cx } from '@octane-xplat/lib';
import { Separator } from './Separator';

/** Centered system message — "conversation started", date separators, status
 *  changes. `divider` renders hairlines flanking the content. */
export function ChatSystemMessage(props: ChatSystemMessageProps) @{
	if (props.variant === 'divider') {
		return (
		<masonview display="flex" id={props.id} className={cx('vx-chatsys', 'vx-chatsys--divider', props.className)} style={props.style as any} flexDirection="row" alignItems="center" justifyContent="center">
			<Separator className="vx-chatsys-rule" />
			<masonview display="flex" className="vx-chatsys-content">{props.children}</masonview>
			<Separator className="vx-chatsys-rule" />
		</masonview>
		);
	}

	return (
		<masonview display="flex" id={props.id} className={cx('vx-chatsys', props.className)} style={props.style as any} flexDirection="row" alignItems="center" justifyContent="center">
			<masonview display="flex" className="vx-chatsys-content" flexDirection="row" alignItems="center">
				{props.icon != null ? <masonview display="flex" className="vx-chatsys-icon">{props.icon}</masonview> : null}
				{props.children}
			</masonview>
		</masonview>
	);
}
