// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatComposer } from '@octane-xplat/ui/chat'
import { Stack } from '@octane-xplat/ui'

export function ChatComposerShowcase() {
	return (
		<Stack direction="vertical" width={450} maxWidth="100%">
			<ChatComposer onSend={() => {}} placeholder="Type a message…" />
		</Stack>
	)
}
