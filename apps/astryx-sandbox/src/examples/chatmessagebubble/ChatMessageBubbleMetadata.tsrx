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
import { Button } from '@octane-xplat/ui'
import { Icon } from '@octane-xplat/ui'
import { HStack } from '@octane-xplat/ui'

export function ChatMessageBubbleMetadata() {
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
							timestamp={<Timestamp value="2026-04-10T09:15:00Z" format="time" />}
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
									<Text type="supporting" color="secondary">
										Claude Opus 4.6
									</Text>
								</HStack>
							}
						/>
					}
				>
					Your deployment finished successfully. All 14 checks passed.
				</ChatMessageBubble>
			</ChatMessage>
			<ChatMessage sender="user">
				<ChatMessageBubble
					metadata={
						<ChatMessageMetadata
							timestamp={<Timestamp value="2026-04-10T09:16:00Z" format="time" />}
							status="read"
						/>
					}
				>
					Great, can you send me the production URL?
				</ChatMessageBubble>
			</ChatMessage>
		</ChatMessageList>
	)
}
