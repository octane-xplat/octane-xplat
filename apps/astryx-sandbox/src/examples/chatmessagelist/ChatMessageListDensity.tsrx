// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatMessageList, ChatMessage, ChatMessageBubble } from '@octane-xplat/ui/chat'
import { VStack } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'
import { Avatar } from '@octane-xplat/ui'
import { Divider } from '@octane-xplat/ui'
import { Fragment } from 'octane'

const DENSITIES = ['compact', 'balanced', 'spacious'] as const

const AVATAR_SIZE = {
	compact: 'sm' as const,
	balanced: 'md' as const,
	spacious: 'md' as const,
}

export function ChatMessageListDensity() {
	return (
		<VStack gap={4} style={{ maxWidth: 500 }}>
			{DENSITIES.map((density, index) => (
				<Fragment key={density}>
					{index > 0 && <Divider />}
					<VStack gap={2}>
						<Text type="supporting" color="secondary">
							{density.charAt(0).toUpperCase() + density.slice(1)}
						</Text>
						<VStack style={{ flex: 1, minHeight: 0 }}>
							<ChatMessageList density={density}>
								<ChatMessage sender="user">
									<ChatMessageBubble>How does density work?</ChatMessageBubble>
								</ChatMessage>
								<ChatMessage
									sender="assistant"
									avatar={<Avatar name="Agent" size={AVATAR_SIZE[density]} />}
								>
									<ChatMessageBubble>
										Density provides default spacing at every level — message gap, bubble padding,
										and gap between child elements. Use gap to tune row spacing independently.
									</ChatMessageBubble>
								</ChatMessage>
							</ChatMessageList>
						</VStack>
					</VStack>
				</Fragment>
			))}
		</VStack>
	)
}
