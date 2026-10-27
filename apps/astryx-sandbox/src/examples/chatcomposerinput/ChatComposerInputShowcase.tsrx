// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatComposer, ChatComposerInput } from '@octane-xplat/ui/chat'
import { Stack } from '@octane-xplat/ui'

export function ChatComposerInputShowcase() {
	return (
		<Stack direction="vertical" width={450} maxWidth="100%">
			<ChatComposer
				onSend={() => {}}
				input={<ChatComposerInput placeholder="Ask me anything about Astryx..." />}
			/>
		</Stack>
	)
}
