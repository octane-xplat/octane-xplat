import type { ChatComposerToken } from './props';
import { ChatTokenChip } from './chat-tokens.web.tsrx';
import { Tooltip } from './Tooltip.web.tsrx';
import { Pressable } from './Pressable.web.tsrx';

function formatLabel(text: string): string {
	const lines = text.split('\n').length;
	const chars = text.length;
	return lines > 1 ? `${lines} lines, ${chars} chars` : `${chars} chars`;
}

/** Inline token for a long paste — chip shows the size summary; hover
 *  reveals a truncated preview card with an Expand action that dissolves
 *  the token back into editable text. */
export function ChatPastedTextToken(props: { text: string; onExpand?: () => void }) @{
	const label = formatLabel(props.text);
	const chip: ChatComposerToken = { value: props.text, label, variant: 'neutral' };

	<Tooltip
		placement="top"
		openDelay={150}
		trigger={<ChatTokenChip token={chip} />}
		content={
			<div className="vx-chatpaste-preview">
				<div className="vx-chatpaste-text">{props.text}</div>
				<div className="vx-chatpaste-footer">
					<span className="vx-chatpaste-meta">{label}</span>
					{props.onExpand ? (
						<Pressable className="vx-chatpaste-expand" onPress={props.onExpand} accessibilityRole="button">
							Expand
						</Pressable>
					) : null}
				</div>
			</div>
		}
	/>
}
