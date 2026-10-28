/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import type { ChatSystemMessageProps } from './props'
import { cx } from '@octane-xplat/lib'
import { Separator } from './Separator'

/** Centered system message — "conversation started", date separators, status
 *  changes. `divider` renders hairlines flanking the content. */
export function ChatSystemMessage(props: ChatSystemMessageProps) @{
	if (props.variant === 'divider') {
		return (
			<masonview
				id={props.id}
				className={cx('vx-chatsys', 'vx-chatsys--divider', props.className)}
				style={mergeStyle({ display: 'flex' }, props.style)}
			>
				<Separator className="vx-chatsys-rule" />
				<masonview className="vx-chatsys-content" style={{ display: 'flex' }}>
					{props.children}
				</masonview>
				<Separator className="vx-chatsys-rule" />
			</masonview>
		)
	}

	return (
		<masonview
			id={props.id}
			className={cx('vx-chatsys', props.className)}
			style={mergeStyle({ display: 'flex' }, props.style)}
		>
			<masonview
				className="vx-chatsys-content"
				style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
			>
				{props.icon != null ? (
					<masonview className="vx-chatsys-icon" style={{ display: 'flex' }}>
						{props.icon}
					</masonview>
				) : null}
				{props.children}
			</masonview>
		</masonview>
	)
}
