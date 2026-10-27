// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatComposer } from '@octane-xplat/ui/chat'
import { Stack } from '@octane-xplat/ui'

export function ChatComposerSimple() {
	return (
		<Stack direction="vertical" width={450} maxWidth="100%">
			<ChatComposer
				onSend={(value) => {
					console.log('Sent:', value)
				}}
			/>
		</Stack>
	)
}
