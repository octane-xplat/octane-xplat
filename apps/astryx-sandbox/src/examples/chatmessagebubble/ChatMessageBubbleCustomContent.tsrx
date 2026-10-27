// Copyright (c) Meta Platforms, Inc. and affiliates.

import {
	ChatMessageList,
	ChatMessage,
	ChatMessageBubble,
	ChatMessageMetadata,
} from '@octane-xplat/ui/chat'

import { ClickableCard } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'
import { Timestamp } from '@octane-xplat/ui'

export function ChatMessageBubbleCustomContent() {
	return (
		<ChatMessageList style={{ maxWidth: 520 }}>
			<ChatMessage sender="user">
				<ChatMessageBubble>Can you pull up the Q3 report?</ChatMessageBubble>
			</ChatMessage>
			<ChatMessage sender="assistant">
				<ChatMessageBubble name="Navi">
					Sure, here is the artifact from last quarter.
				</ChatMessageBubble>
				{/* A ghost bubble aligns custom content with the bubble text column;
            width="100%" spans the full message column instead of the default
            bubble width cap. Metadata rides the bubble's metadata slot. */}
				<ChatMessageBubble
					variant="ghost"
					width="100%"
					metadata={
						<ChatMessageMetadata
							timestamp={<Timestamp value="2026-04-28T09:45:00Z" format="time" />}
							footer={
								<Text type="supporting" color="secondary">
									Claude Opus 4.6
								</Text>
							}
						/>
					}
				>
					<ClickableCard label="Open Q3 performance report" onPress={() => {}}>
						<Text type="body" weight="semibold">
							Q3 Performance Report
						</Text>
						<Text type="supporting" color="secondary">
							12 pages · updated 2 days ago
						</Text>
					</ClickableCard>
				</ChatMessageBubble>
			</ChatMessage>
		</ChatMessageList>
	)
}
