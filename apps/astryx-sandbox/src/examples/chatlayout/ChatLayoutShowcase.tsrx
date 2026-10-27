// Copyright (c) Meta Platforms, Inc. and affiliates.

import {
	ChatLayout,
	ChatMessageList,
	ChatMessage,
	ChatMessageBubble,
	ChatComposer,
	ChatTokenizedText,
} from '@octane-xplat/ui/chat'

import { VStack } from '@octane-xplat/ui'

const TOKENS = [{ value: '/review', label: '/review', variant: 'blue' as const }]

export function ChatLayoutShowcase() {
	return (
		<VStack width={450}>
			<ChatLayout composer={<ChatComposer onSend={() => {}} placeholder="Ask something..." />}>
				<ChatMessageList>
					<ChatMessage sender="user">
						<ChatMessageBubble>
							<ChatTokenizedText tokens={TOKENS}>
								/review the changes in this file
							</ChatTokenizedText>
						</ChatMessageBubble>
					</ChatMessage>
					<ChatMessage sender="assistant">
						<ChatMessageBubble variant="ghost">Reading the file now...</ChatMessageBubble>
					</ChatMessage>
				</ChatMessageList>
			</ChatLayout>
		</VStack>
	)
}
