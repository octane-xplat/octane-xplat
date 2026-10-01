/** @jsxImportSource @nativescript-community/octane */
import type { ChatTokenizedTextProps } from './props';
import { cx } from './cx';
import { ChatTokenChip } from './chat-tokens.tsrx';
import { tokenizeChatText } from './chat-tokenize';

/** Renders serialized message text with token values replaced by chips.
 *  Native can't inline chips inside a Label, so the leaf renders a
 *  wrapping row: text runs become labels, tokens become chips in order —
 *  same content, wrapped flow instead of true inline. */
export function ChatTokenizedText(props: ChatTokenizedTextProps) @{
	const text = props.children ?? '';
	if (!text || !props.tokens || props.tokens.length === 0) {
		return (
			<flexboxlayout id={props.id} className={cx('vx-chattext', props.className)} style={props.style} flexDirection="row" flexWrap="wrap">
				<label text={text} />
			</flexboxlayout>
		);
	}

	<flexboxlayout
		id={props.id}
		className={cx('vx-chattext', props.className)}
		style={props.style}
		flexDirection="row"
		flexWrap="wrap"
		alignItems="center"
	>
		{tokenizeChatText(text, props.tokens).map((part) =>
			part.kind === 'token' ? (
				<ChatTokenChip token={part.token} />
			) : (
				<label text={part.text} textWrap={true} />
			),
		)}
	</flexboxlayout>
}
