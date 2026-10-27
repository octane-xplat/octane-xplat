// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatLayoutScrollButton } from '@octane-xplat/ui/chat'
import { Stack } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'

export function ChatLayoutScrollButtonLabels() {
	return (
		<Stack direction="vertical" gap={4}>
			<Text type="supporting" color="secondary">
				Labels expand the button to give context
			</Text>
			<Stack direction="vertical" gap={3}>
				<ChatLayoutScrollButton isVisible={true} onPress={() => {}} />
				<ChatLayoutScrollButton isVisible={true} label="New messages" onPress={() => {}} />
				<ChatLayoutScrollButton isVisible={true} label="3 unread replies" onPress={() => {}} />
			</Stack>
		</Stack>
	)
}
