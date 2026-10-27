// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatMessageList, ChatSystemMessage } from '@octane-xplat/ui/chat'
import { Icon } from '@octane-xplat/ui'

export function ChatSystemMessageStatusUpdates() {
	return (
		<ChatMessageList>
			<ChatSystemMessage variant="divider">March 14, 2026</ChatSystemMessage>
			<ChatSystemMessage icon={<Icon name="sandbox-info" />}>
				Sarah Chen joined the conversation
			</ChatSystemMessage>
			<ChatSystemMessage>Topic changed to "Q2 Launch Planning"</ChatSystemMessage>
			<ChatSystemMessage variant="divider">March 15, 2026</ChatSystemMessage>
			<ChatSystemMessage icon={<Icon name="sandbox-info" />}>
				Alex Rivera left the conversation
			</ChatSystemMessage>
			<ChatSystemMessage variant="divider">Today</ChatSystemMessage>
			<ChatSystemMessage icon={<Icon name="sandbox-info" />}>
				Conversation marked as resolved
			</ChatSystemMessage>
		</ChatMessageList>
	)
}
