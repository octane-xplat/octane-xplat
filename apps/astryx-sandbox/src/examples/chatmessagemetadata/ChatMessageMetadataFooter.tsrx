// Copyright (c) Meta Platforms, Inc. and affiliates.

import {
	ChatMessageList,
	ChatMessage,
	ChatMessageBubble,
	ChatMessageMetadata,
} from '@octane-xplat/ui/chat'

import { Timestamp } from '@octane-xplat/ui'
import { Button } from '@octane-xplat/ui'
import { Icon } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'
import { HStack } from '@octane-xplat/ui'

export function ChatMessageMetadataFooter() {
	return (
		<ChatMessageList style={{ maxWidth: 500 }}>
			<ChatMessage sender="user">
				<ChatMessageBubble
					metadata={
						<ChatMessageMetadata
							timestamp={<Timestamp value="2026-04-29T09:41:00Z" format="time" />}
							status="read"
						/>
					}
				>
					Summarize the Q1 revenue report.
				</ChatMessageBubble>
			</ChatMessage>
			<ChatMessage sender="assistant">
				<ChatMessageBubble
					metadata={
						<ChatMessageMetadata
							timestamp={<Timestamp value="2026-04-29T09:42:00Z" format="time" />}
							footer={
								<HStack gap={1}>
									<Button
										label="Copy"
										variant="ghost"
										size="sm"
										icon={<Icon name="sandbox-chat-copy" size={16} />}
										isIconOnly
										clickAction={() => {}}
									/>
									<Button
										label="Retry"
										variant="ghost"
										size="sm"
										icon={<Icon name="sandbox-chat-refresh" size={16} />}
										isIconOnly
										clickAction={() => {}}
									/>
									<Button
										label="Good response"
										variant="ghost"
										size="sm"
										icon={<Icon name="sandbox-chat-thumbs-up" size={16} />}
										isIconOnly
										clickAction={() => {}}
									/>
									<Button
										label="Bad response"
										variant="ghost"
										size="sm"
										icon={<Icon name="sandbox-chat-thumbs-down" size={16} />}
										isIconOnly
										clickAction={() => {}}
									/>
									<Text type="supporting" color="secondary">
										GPT-4o
									</Text>
								</HStack>
							}
						/>
					}
				>
					Q1 revenue reached $2.4B, up 18% year-over-year. Enterprise subscriptions drove 62% of the
					growth, while ad revenue held steady at $890M.
				</ChatMessageBubble>
			</ChatMessage>
		</ChatMessageList>
	)
}
