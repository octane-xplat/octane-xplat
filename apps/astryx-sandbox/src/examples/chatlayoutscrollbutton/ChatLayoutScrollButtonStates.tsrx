// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatLayoutScrollButton } from '@octane-xplat/ui/chat'
import { Stack } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'

export function ChatLayoutScrollButtonStates() {
	return (
		<Stack direction="vertical" gap={4}>
			<Stack direction="vertical" gap={1}>
				<Text type="supporting" color="secondary">
					Hidden (user is at bottom)
				</Text>
				<ChatLayoutScrollButton isVisible={false} onPress={() => {}} />
			</Stack>
			<Stack direction="vertical" gap={1}>
				<Text type="supporting" color="secondary">
					Visible (user scrolled up)
				</Text>
				<ChatLayoutScrollButton isVisible={true} onPress={() => {}} />
			</Stack>
			<Stack direction="vertical" gap={1}>
				<Text type="supporting" color="secondary">
					Expanded with label (new messages arrived)
				</Text>
				<ChatLayoutScrollButton isVisible={true} label="New messages" onPress={() => {}} />
			</Stack>
		</Stack>
	)
}
