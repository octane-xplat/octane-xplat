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

export function ChatMessageAvatarName() {
	return (
		<ChatMessageList style={{ maxWidth: 500 }}>
			<ChatMessage sender="assistant" avatar={<Avatar name="Agent" size="md" />}>
				<ChatMessageBubble
					name={
						<Text type="supporting" weight="semibold" color="secondary">
							Agent
						</Text>
					}
					metadata={
						<ChatMessageMetadata
							timestamp={<Timestamp value="2026-04-28T10:15:00Z" format="time" />}
						/>
					}
				>
					I reviewed the pull request. The changes look solid — clean code and good test coverage.
				</ChatMessageBubble>
			</ChatMessage>
			<ChatMessage sender="user">
				<ChatMessageBubble
					metadata={
						<ChatMessageMetadata
							timestamp={<Timestamp value="2026-04-28T10:16:00Z" format="time" />}
							status="read"
						/>
					}
				>
					Thanks! Merging it now.
				</ChatMessageBubble>
			</ChatMessage>
			<ChatMessage sender="assistant" avatar={<Avatar name="Agent" size="md" />}>
				<ChatMessageBubble
					name={
						<Text type="supporting" weight="semibold" color="secondary">
							Agent
						</Text>
					}
					metadata={
						<ChatMessageMetadata
							timestamp={<Timestamp value="2026-04-28T10:17:00Z" format="time" />}
						/>
					}
				>
					I can run the deployment pipeline once it lands. Just let me know.
				</ChatMessageBubble>
			</ChatMessage>
		</ChatMessageList>
	)
}
