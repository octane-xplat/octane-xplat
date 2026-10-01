import type { ChatTokenizedTextProps } from './props';
import { ChatTokenChip } from './chat-tokens.web.tsrx';
import { tokenizeChatText } from './chat-tokenize';

/** Renders serialized message text with token values replaced by inline
 *  chips — share one token table between ChatComposerInput triggers and
 *  message display. */
export function ChatTokenizedText(props: ChatTokenizedTextProps) @{
	const text = props.children ?? '';
	if (!text || !props.tokens || props.tokens.length === 0) {
		return (
			<span id={props.id} className={['vx-chattext', props.className]} style={props.style}>
				{text}
			</span>
		);
	}

	<span id={props.id} className={['vx-chattext', props.className]} style={props.style}>
		{tokenizeChatText(text, props.tokens).map((part) =>
			part.kind === 'token' ? (
				<span className="vx-chattext-token"><ChatTokenChip token={part.token} /></span>
			) : (
				part.text
			),
		)}
	</span>
}
