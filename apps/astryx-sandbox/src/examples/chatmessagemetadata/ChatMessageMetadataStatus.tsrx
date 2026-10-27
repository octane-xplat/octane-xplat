// Copyright (c) Meta Platforms, Inc. and affiliates.

import {
	ChatMessageList,
	ChatMessage,
	ChatMessageBubble,
	ChatMessageMetadata,
} from '@octane-xplat/ui/chat'

import { Timestamp } from '@octane-xplat/ui'

const STATUSES = [
	{ status: 'sending' as const, text: 'Deploying the update now…' },
	{ status: 'sent' as const, text: 'Config pushed to staging.' },
	{ status: 'delivered' as const, text: 'Verified on the staging cluster.' },
	{ status: 'read' as const, text: 'Looks good — promoting to prod.' },
	{ status: 'error' as const, text: 'Rollback triggered, checking logs.' },
]

export function ChatMessageMetadataStatus() {
	return (
		<ChatMessageList style={{ maxWidth: 400 }}>
			{STATUSES.map(({ status, text }) => (
				<ChatMessage key={status} sender="user">
					<ChatMessageBubble
						metadata={
							<ChatMessageMetadata
								timestamp={<Timestamp value="2026-04-29T10:15:00Z" format="time" />}
								status={status}
							/>
						}
					>
						{text}
					</ChatMessageBubble>
				</ChatMessage>
			))}
		</ChatMessageList>
	)
}
