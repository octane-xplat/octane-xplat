// Copyright (c) Meta Platforms, Inc. and affiliates.

import {
	ChatMessageList,
	ChatMessage,
	ChatMessageBubble,
	ChatMessageMetadata,
} from '@octane-xplat/ui/chat'

import { Avatar } from '@octane-xplat/ui'
import { Timestamp } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'

export function ChatMessageBubbleGrouping() {
	return (
		<ChatMessageList style={{ maxWidth: 500 }}>
			<ChatMessage sender="assistant" avatar={<Avatar name="Agent" size="md" />}>
				<ChatMessageBubble
					group="first"
					name={
						<Text type="supporting" weight="semibold" color="secondary">
							Agent
						</Text>
					}
				>
					I reviewed the three files you shared.
				</ChatMessageBubble>
				<ChatMessageBubble group="middle">
					The data model looks solid, but the API handler has a race condition on concurrent writes.
				</ChatMessageBubble>
				<ChatMessageBubble
					group="last"
					metadata={
						<ChatMessageMetadata
							timestamp={<Timestamp value="2026-04-10T10:45:00Z" format="time" />}
						/>
					}
				>
					I can draft a fix if you want.
				</ChatMessageBubble>
			</ChatMessage>
			<ChatMessage sender="user">
				<ChatMessageBubble group="first">Yes please!</ChatMessageBubble>
				<ChatMessageBubble
					group="last"
					metadata={
						<ChatMessageMetadata
							timestamp={<Timestamp value="2026-04-10T10:46:00Z" format="time" />}
							status="delivered"
						/>
					}
				>
					Also add a test for the concurrent case.
				</ChatMessageBubble>
			</ChatMessage>
		</ChatMessageList>
	)
}
