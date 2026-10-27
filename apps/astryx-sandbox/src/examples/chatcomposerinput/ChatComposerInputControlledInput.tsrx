// Copyright (c) Meta Platforms, Inc. and affiliates.

import { useState } from 'octane'
import { ChatComposer, ChatComposerInput } from '@octane-xplat/ui/chat'
import { Stack } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'

export function ChatComposerInputControlledInput() {
	const [value, setValue] = useState('')
	return (
		<Stack direction="vertical" gap={3} width={450} maxWidth="100%">
			<ChatComposer
				onSend={() => setValue('')}
				value={value}
				onChange={setValue}
				input={
					<ChatComposerInput value={value} onChange={setValue} placeholder="Type a message..." />
				}
			/>
			<Text type="supporting" color="secondary">
				Value: {JSON.stringify(value)}
			</Text>
		</Stack>
	)
}
