/** @jsxImportSource @octane-xplat/jsx/dom */
// Copyright (c) Meta Platforms, Inc. and affiliates.

import {
	ChatLayout,
	ChatMessageList,
	ChatMessage,
	ChatMessageBubble,
	ChatSystemMessage,
	ChatComposer,
} from '@octane-xplat/ui/chat'

import { Markdown } from '@octane-xplat/ui/markdown'
import type { StyleProp } from '@octane-xplat/ui'

const panel = {
	width: 450,
	height: 600,
	borderRadius: 8,
	overflow: 'hidden' as const,
	border: '1px solid var(--color-border)',
}

export function ChatLayoutPanelChat() {
	return (
		<div style={panel}>
			<ChatLayout composer={<ChatComposer onSend={() => {}} placeholder="Ask something..." />}>
				<ChatMessageList>
					<ChatSystemMessage variant="divider">Today</ChatSystemMessage>

					<ChatMessage sender="user">
						<ChatMessageBubble>
							Can you review the Button component and fix the focus ring?
						</ChatMessageBubble>
					</ChatMessage>

					<ChatMessage sender="assistant">
						<Markdown
							density="compact"
							text={`I'll check the Button component now.

Found the issue — the border radius was hardcoded. Replaced with the theme token.`}
						/>
					</ChatMessage>

					<ChatMessage sender="user">
						<ChatMessageBubble>Nice, can you also check the Card component?</ChatMessageBubble>
					</ChatMessage>

					<ChatMessage sender="assistant">
						<Markdown
							density="compact"
							text={`Checking the component now.

Found the issue — the border radius was hardcoded. Replaced with the theme token.`}
						/>
					</ChatMessage>
				</ChatMessageList>
			</ChatLayout>
		</div>
	)
}
