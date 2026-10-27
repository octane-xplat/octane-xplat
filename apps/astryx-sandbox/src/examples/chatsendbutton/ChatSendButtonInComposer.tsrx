// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatComposer } from '@octane-xplat/ui/chat'
import { Stack } from '@octane-xplat/ui'

export function ChatSendButtonInComposer() {
	return (
		<Stack direction="vertical" width={450} maxWidth="100%">
			<ChatComposer onSend={() => {}} value="Hello, how can you help?" onChange={() => {}} />
		</Stack>
	)
}
