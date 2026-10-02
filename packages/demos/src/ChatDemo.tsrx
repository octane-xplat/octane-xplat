import { useState } from 'octane';
import {
	ChatComposer,
	ChatComposerInput,
	ChatLayout,
	ChatMessage,
	ChatMessageBubble,
	ChatMessageList,
	ChatMessageMetadata,
	ChatTokenizedText,
} from '@octane-xplat/ui';

interface DemoMessage {
	id: string;
	sender: 'user' | 'assistant';
	text: string;
}

const people = [{ id: 'u1', label: 'Ada Lovelace' }];
const mention = {
	character: '@',
	searchSource: { search: (query: string) => people.filter((person) => person.label.toLowerCase().includes(query.toLowerCase())) },
	onSelect: (person: { id: string; label: string }) => ({
		value: `@${person.label}:${person.id}`,
		label: person.label,
		variant: 'info' as const,
	}),
};

const messageTokens = [{ value: '@Ada Lovelace:u1', label: 'Ada Lovelace', variant: 'info' as const }];

/** Small shared conversation demo: append a message and see it stay in the
 *  layout while the composer remains docked. */
export function ChatDemo() @{
	const [messages, setMessages] = useState<DemoMessage[]>([
		{ id: 'welcome', sender: 'assistant', text: 'Ask a question to try the composer.' },
	]);

	const send = (text: string) => {
		setMessages((current) => [
			...current,
			{ id: String(Date.now()), sender: 'user', text },
		]);
	};

	<ChatLayout
		id="chat-demo-layout"
		composer={<ChatComposer onSubmit={send} placeholder="Write a message…" input={<ChatComposerInput triggers={[mention]} />} />}
	>
		<ChatMessageList id="chat-demo-list" align="bottom" density="compact">
			@for (const message of messages; key message.id) {
				<ChatMessage sender={message.sender} density="compact" id={'chat-' + message.id}>
					<ChatMessageBubble variant={message.sender === 'user' ? 'filled' : 'ghost'}>
						<ChatTokenizedText tokens={messageTokens}>{message.text}</ChatTokenizedText>
					</ChatMessageBubble>
					<ChatMessageMetadata timestamp={message.sender === 'assistant' ? 'Just now' : undefined} />
				</ChatMessage>
			}
		</ChatMessageList>
	</ChatLayout>
}
