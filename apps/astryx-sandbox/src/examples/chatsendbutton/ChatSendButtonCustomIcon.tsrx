// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatSendButton } from '@octane-xplat/ui/chat'
import { Icon } from '@octane-xplat/ui'
import { Stack } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'

export function ChatSendButtonCustomIcon() {
	return (
		<Stack direction="vertical" gap={4}>
			<Text type="supporting" color="secondary">
				Custom icons for send and stop states
			</Text>
			<Stack direction="horizontal" gap={4} vAlign="center">
				<ChatSendButton
					isDisabled={false}
					onSend={() => {}}
					sendIcon={<Icon name="sandbox-chat-send" size={16} />}
				/>
				<ChatSendButton
					isDisabled={false}
					onSend={() => {}}
					sendIcon={<Icon name="sandbox-chat-check" size={16} />}
				/>
				<ChatSendButton
					isDisabled={false}
					onSend={() => {}}
					sendIcon={<Icon name="sandbox-chat-sparkles" size={16} />}
				/>
				<ChatSendButton
					isStopShown
					onCancel={() => {}}
					stopIcon={<Icon name="sandbox-chat-close" size={16} />}
				/>
			</Stack>
		</Stack>
	)
}
