// Copyright (c) Meta Platforms, Inc. and affiliates.

import {
	ChatMessageList,
	ChatMessage,
	ChatMessageBubble,
	ChatMessageMetadata,
} from '@octane-xplat/ui/chat'

import { Timestamp } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'
import { Button } from '@octane-xplat/ui'
import { Icon } from '@octane-xplat/ui'
import { HStack, VStack } from '@octane-xplat/ui'

export function ChatMessageMetadataShowcase() {
	return (
		<VStack style={{ maxWidth: 600 }}>
			<ChatMessageList>
				<ChatMessage sender="assistant">
					<ChatMessageBubble
						metadata={
							<ChatMessageMetadata
								timestamp={<Timestamp value="2026-03-15T14:30:00Z" format="time" />}
								status="error"
								footer={
									<HStack gap={1}>
										<Button
											label="Retry"
											variant="ghost"
											size="sm"
											icon={<Icon name="sandbox-chat-refresh" size={16} />}
											isIconOnly
											clickAction={() => {}}
										/>
									</HStack>
								}
							/>
						}
					>
						Sorry, something went wrong on my end.
					</ChatMessageBubble>
				</ChatMessage>

				<ChatMessage sender="user">
					<ChatMessageBubble
						metadata={
							<ChatMessageMetadata
								timestamp={<Timestamp value="2026-03-15T14:31:00Z" format="time" />}
								status="read"
							/>
						}
					>
						No worries — try again with just the last 24 hours of logs.
					</ChatMessageBubble>
				</ChatMessage>

				<ChatMessage sender="assistant">
					<ChatMessageBubble
						metadata={
							<ChatMessageMetadata
								timestamp={<Timestamp value="2026-03-15T14:32:00Z" format="time" />}
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
											Claude Opus 4.6
										</Text>
									</HStack>
								}
							/>
						}
					>
						The canary at 11:42 AM caused a memory spike. Rolled back at 11:58 AM.
					</ChatMessageBubble>
				</ChatMessage>
			</ChatMessageList>
		</VStack>
	)
}
