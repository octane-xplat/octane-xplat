// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatComposer } from '@octane-xplat/ui/chat'
import { Stack } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'

export function ChatComposerValidation() {
	return (
		<Stack direction="vertical" gap={4} width={450} maxWidth="100%">
			<Stack direction="vertical" gap={1}>
				<Text type="supporting" color="secondary">
					Error message (with top position)
				</Text>
				<ChatComposer
					onSend={(value) => {
						console.log('Sent:', value)
					}}
					statusPosition="top"
					status={{
						type: 'error',
						message: 'Failed to send message. Please try again.',
					}}
				/>
			</Stack>
			<Stack direction="vertical" gap={1}>
				<Text type="supporting" color="secondary">
					Warning message (with bottom position)
				</Text>
				<ChatComposer
					onSend={(value) => {
						console.log('Sent:', value)
					}}
					status={{
						type: 'warning',
						message: 'Context window is 90% full.',
					}}
				/>
			</Stack>
		</Stack>
	)
}
