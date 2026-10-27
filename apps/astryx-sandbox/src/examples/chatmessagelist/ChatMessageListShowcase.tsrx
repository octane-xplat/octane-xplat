// Copyright (c) Meta Platforms, Inc. and affiliates.

import {
	ChatMessageList,
	ChatMessage,
	ChatMessageBubble,
	ChatMessageMetadata,
	ChatSystemMessage,
} from '@octane-xplat/ui/chat'

import { VStack } from '@octane-xplat/ui'
import { Timestamp } from '@octane-xplat/ui'

export function ChatMessageListShowcase() {
	return (
		<VStack style={{ maxWidth: 600, height: '100%' }}>
			<ChatMessageList density="balanced">
				<ChatSystemMessage variant="divider">March 15, 2026</ChatSystemMessage>

				<ChatMessage sender="user">
					<ChatMessageBubble
						metadata={
							<ChatMessageMetadata
								timestamp={<Timestamp value="2026-03-15T14:30:00Z" format="time" />}
								status="read"
							/>
						}
					>
						How should I structure a monorepo?
					</ChatMessageBubble>
				</ChatMessage>

				<ChatMessage sender="assistant">
					<ChatMessageBubble
						metadata={
							<ChatMessageMetadata
								timestamp={<Timestamp value="2026-03-15T14:30:15Z" format="time" />}
							/>
						}
					>
						Use workspaces with a shared packages directory. Keep each package focused on a single
						concern.
					</ChatMessageBubble>
				</ChatMessage>

				<ChatMessage sender="user">
					<ChatMessageBubble
						metadata={
							<ChatMessageMetadata
								timestamp={<Timestamp value="2026-03-15T14:31:00Z" format="time" />}
								status="delivered"
							/>
						}
					>
						Should I use Yarn or pnpm for that?
					</ChatMessageBubble>
				</ChatMessage>
			</ChatMessageList>
		</VStack>
	)
}
