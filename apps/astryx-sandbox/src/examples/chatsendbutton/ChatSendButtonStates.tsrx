// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatSendButton } from '@octane-xplat/ui/chat'
import { Stack } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'

export function ChatSendButtonStates() {
	return (
		<Stack direction="vertical" gap={2}>
			<Text type="supporting" color="secondary">
				Disabled → Ready → Streaming
			</Text>
			<Stack direction="horizontal" gap={3} vAlign="center">
				<ChatSendButton isDisabled onSend={() => {}} />
				<ChatSendButton isDisabled={false} onSend={() => {}} />
				<ChatSendButton isStopShown onCancel={() => {}} />
			</Stack>
		</Stack>
	)
}
