// Copyright (c) Meta Platforms, Inc. and affiliates.

import {
	ChatMessageList,
	ChatMessage,
	ChatMessageBubble,
	ChatMessageMetadata,
} from '@octane-xplat/ui/chat'

import { Timestamp } from '@octane-xplat/ui'

export function ChatMessageMetadataTimestamp() {
	return (
		<ChatMessageList style={{ maxWidth: 500 }}>
			<ChatMessage sender="user">
				<ChatMessageBubble
					metadata={
						<ChatMessageMetadata
							timestamp={<Timestamp value="2026-04-29T14:30:00Z" format="time" />}
						/>
					}
				>
					Thanks — any blockers I should know about?
				</ChatMessageBubble>
			</ChatMessage>
			<ChatMessage sender="assistant">
				<ChatMessageBubble
					metadata={
						<ChatMessageMetadata
							timestamp={<Timestamp value="2026-04-28T16:45:00Z" format="relative" />}
						/>
					}
				>
					Relative timestamps work too — helpful for older messages where the exact time matters
					less than recency.
				</ChatMessageBubble>
			</ChatMessage>
		</ChatMessageList>
	)
}
