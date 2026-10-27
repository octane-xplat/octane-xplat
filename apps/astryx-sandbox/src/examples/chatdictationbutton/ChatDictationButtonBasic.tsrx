// Copyright (c) Meta Platforms, Inc. and affiliates.

import { useRef } from 'octane'
import {
	ChatDictationButton,
	ChatComposer,
	ChatComposerInput,
	useChatDictation,
} from '@octane-xplat/ui/chat'

import type { ChatComposerInputHandle } from '@octane-xplat/ui/chat'
import { Stack, Text } from '@octane-xplat/ui'

export function ChatDictationButtonBasic() {
	const inputRef = useRef<ChatComposerInputHandle | null>(null)

	const dictation = useChatDictation({
		inputRef,
		onResult: (text) => {
			console.log('Dictation result:', text)
		},
	})

	return (
		<Stack direction="vertical" width={450} maxWidth="100%">
			{!dictation.isSupported && <Text>SpeechRecognition is not supported in this browser.</Text>}
			<ChatComposer
				onSend={(value) => console.log('Submit:', value)}
				input={<ChatComposerInput ref={inputRef} />}
				sendActions={<ChatDictationButton dictation={dictation} />}
			/>
		</Stack>
	)
}
