// Copyright (c) Meta Platforms, Inc. and affiliates.

import {
	ChatMessageList,
	ChatMessage,
	ChatMessageBubble,
	ChatMessageMetadata,
	ChatSystemMessage,
} from '@octane-xplat/ui/chat'

import { VStack, HStack, Text } from '@octane-xplat/ui'
import { Avatar } from '@octane-xplat/ui'
import { Markdown } from '@octane-xplat/ui/markdown'
import { CodeBlock } from '@octane-xplat/ui'
import { Timestamp } from '@octane-xplat/ui'
import { Token } from '@octane-xplat/ui'

export function ChatMessageListFullFeatured() {
	return (
		<VStack style={{ maxWidth: 500, justifyContent: 'center' }}>
			<ChatMessageList messages={[]} emptyState={<Text>No messages yet</Text>} />
			<ChatMessageList>
				<ChatSystemMessage variant="divider">Today</ChatSystemMessage>

				<ChatMessage sender="user">
					<HStack gap={2} wrap="wrap">
						<Token label="useReducer.ts" />
						<Token label="formState.ts" />
					</HStack>
					<ChatMessageBubble
						metadata={
							<ChatMessageMetadata
								timestamp={<Timestamp value="2026-03-15T14:30:00Z" format="time" />}
								status="read"
							/>
						}
					>
						Can you review these files?
					</ChatMessageBubble>
				</ChatMessage>

				<ChatMessage sender="assistant" avatar={<Avatar name="Agent" size="md" />}>
					<ChatMessageBubble group="first">
						<Markdown
							density="compact"
							text={`Sure! Here's the key pattern from **useReducer.ts**:`}
						/>
					</ChatMessageBubble>
					<ChatMessageBubble group="last">
						<Markdown
							density="compact"
							text={`The reducer is **pure and easy to test** — pass in state and action, assert on the output.`}
						/>
					</ChatMessageBubble>
					<ChatMessageBubble
						variant="ghost"
						group="middle"
						metadata={
							<ChatMessageMetadata
								timestamp={<Timestamp value="2026-03-15T14:30:30Z" format="time" />}
							/>
						}
					>
						<CodeBlock
							code={`const [state, dispatch] = useReducer(
  (state, action) => ({
    ...state,
    [action.field]: action.value,
  }),
  { name: '', email: '' }
);`}
							language="tsx"
						/>
					</ChatMessageBubble>
				</ChatMessage>

				<ChatSystemMessage>Agent shared a code snippet</ChatSystemMessage>

				<ChatMessage sender="user">
					<ChatMessageBubble
						metadata={
							<ChatMessageMetadata
								timestamp={<Timestamp value="2026-03-15T14:31:00Z" format="time" />}
								status="delivered"
							/>
						}
					>
						That's clean, thanks!
					</ChatMessageBubble>
				</ChatMessage>
			</ChatMessageList>
		</VStack>
	)
}
