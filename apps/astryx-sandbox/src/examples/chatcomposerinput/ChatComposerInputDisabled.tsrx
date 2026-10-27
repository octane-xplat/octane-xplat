// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatComposer, ChatComposerInput } from '@octane-xplat/ui/chat'
import { Stack } from '@octane-xplat/ui'

export function ChatComposerInputDisabled() {
	return (
		<Stack direction="vertical" width={450} maxWidth="100%">
			<ChatComposer
				onSend={() => {}}
				isDisabled
				input={<ChatComposerInput isDisabled placeholder="Input is disabled" />}
			/>
		</Stack>
	)
}
