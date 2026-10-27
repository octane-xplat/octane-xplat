// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatMessageList, ChatMessage, ChatMessageBubble } from '@octane-xplat/ui/chat'
import { Stack } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'

export function ChatMessageBubbleVariants() {
	return (
		<Stack direction="vertical" gap={4} style={{ maxWidth: 500 }}>
			<Stack direction="vertical" gap={1}>
				<Text type="supporting" color="secondary">
					Filled — sender-colored background (default)
				</Text>
				<ChatMessageList>
					<ChatMessage sender="user">
						<ChatMessageBubble>Can you summarize the latest deployment logs?</ChatMessageBubble>
					</ChatMessage>
				</ChatMessageList>
			</Stack>
			<Stack direction="vertical" gap={1}>
				<Text type="supporting" color="secondary">
					Ghost — transparent background, keeps alignment padding
				</Text>
				<ChatMessageList>
					<ChatMessage sender="assistant">
						<ChatMessageBubble variant="ghost">
							The last deploy completed at 2:41 PM with zero errors across all three regions.
						</ChatMessageBubble>
					</ChatMessage>
				</ChatMessageList>
			</Stack>
		</Stack>
	)
}
