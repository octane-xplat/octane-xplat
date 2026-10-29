/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../internal/layout/style-merge'
import type { ChatTokenizedTextProps } from '../props'
import { cx } from '@octane-xplat/lib'
import { ChatTokenChip } from './chat-tokens.tsrx'
import { tokenizeChatText } from './chat-tokenize'

/** Renders serialized message text with token values replaced by chips.
 *  Native can't inline chips inside a Label, so the leaf renders a
 *  wrapping row: text runs become labels, tokens become chips in order —
 *  same content, wrapped flow instead of true inline. */
export function ChatTokenizedText(props: ChatTokenizedTextProps) @{
	const text = props.children ?? ''
	if (!text || !props.tokens || props.tokens.length === 0) {
		return (
			<masonview
				id={props.id}
				className={cx('vx-chattext', props.className)}
				style={mergeStyle({ flexWrap: 'wrap' }, mergeStyle({ display: 'flex' }, props.style))}
			>
				<label text={text} />
			</masonview>
		)
	}

	<masonview
		id={props.id}
		className={cx('vx-chattext', props.className)}
		style={mergeStyle({ alignItems: 'center' }, mergeStyle({ display: 'flex' }, props.style))}
	>
		{tokenizeChatText(text, props.tokens).map((part) =>
			part.kind === 'token' ? (
				<ChatTokenChip token={part.token} />
			) : (
				<label text={part.text} textWrap={true} />
			),
		)}
	</masonview>
}
