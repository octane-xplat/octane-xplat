import { useState } from 'octane';
import {
	ChatComposer,
	ChatLayout,
	ChatMessage,
	ChatMessageBubble,
	ChatMessageList,
	ChatMessageMetadata,
	Text,
} from '@octane-xplat/ui';

interface DemoMessage {
	id: string;
	sender: 'user' | 'assistant';
	text: string;
}

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
		composer={<ChatComposer onSubmit={send} placeholder="Write a message…" />}
	>
		<ChatMessageList id="chat-demo-list" align="bottom" density="compact">
			@for (const message of messages; key message.id) {
				<ChatMessage sender={message.sender} density="compact" id={'chat-' + message.id}>
					<ChatMessageBubble variant={message.sender === 'user' ? 'filled' : 'ghost'}>
						<Text>{message.text}</Text>
					</ChatMessageBubble>
					<ChatMessageMetadata timestamp={message.sender === 'assistant' ? 'Just now' : undefined} />
				</ChatMessage>
			}
		</ChatMessageList>
	</ChatLayout>
}
