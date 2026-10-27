// Copyright (c) Meta Platforms, Inc. and affiliates.

import {
	ChatTokenizedText,
	ChatMessage,
	ChatMessageBubble,
	ChatMessageList,
} from '@octane-xplat/ui/chat'

const mixedTokens = [
	{ value: '@cindy', label: '@Cindy', variant: 'blue' as const },
	{ value: '#bug', label: '#bug', variant: 'red' as const },
	{ value: '#feat', label: '#feature', variant: 'green' as const },
]

export function ChatTokenizedTextColors() {
	return (
		<ChatMessageList>
			<ChatMessage sender="system">
				<ChatMessageBubble>
					<ChatTokenizedText tokens={mixedTokens}>
						@cindy filed #bug and #feat for the sprint
					</ChatTokenizedText>
				</ChatMessageBubble>
			</ChatMessage>
		</ChatMessageList>
	)
}
