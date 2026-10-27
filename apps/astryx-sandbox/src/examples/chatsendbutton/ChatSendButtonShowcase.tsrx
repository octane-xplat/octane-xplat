// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatSendButton } from '@octane-xplat/ui/chat'
import { Icon } from '@octane-xplat/ui'
import { Stack } from '@octane-xplat/ui'

export function ChatSendButtonShowcase() {
	return (
		<Stack direction="horizontal" gap={3} vAlign="center">
			<ChatSendButton isDisabled={false} onSend={() => {}} />
			<ChatSendButton
				isDisabled={false}
				onSend={() => {}}
				sendIcon={<Icon name="sandbox-chat-sparkles" size={16} />}
			/>
			<ChatSendButton isStopShown onCancel={() => {}} />
		</Stack>
	)
}
