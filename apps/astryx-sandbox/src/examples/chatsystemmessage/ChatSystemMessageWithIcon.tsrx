// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatMessageList, ChatSystemMessage } from '@octane-xplat/ui/chat'
import { Icon } from '@octane-xplat/ui'
import { Stack } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'

export function ChatSystemMessageWithIcon() {
	return (
		<Stack direction="vertical" gap={4}>
			<Text type="supporting" color="secondary">
				Icons reinforce the message type
			</Text>
			<ChatMessageList>
				<ChatSystemMessage icon={<Icon name="sandbox-info" />}>
					Jordan was added to the conversation
				</ChatSystemMessage>
				<ChatSystemMessage icon={<Icon name="sandbox-info" />}>
					Messages are end-to-end encrypted
				</ChatSystemMessage>
				<ChatSystemMessage icon={<Icon name="sandbox-chat-sparkles" />}>
					Agent is generating a response…
				</ChatSystemMessage>
				<ChatSystemMessage icon={<Icon name="sandbox-info" />}>
					Conversation verified by admin
				</ChatSystemMessage>
			</ChatMessageList>
		</Stack>
	)
}
