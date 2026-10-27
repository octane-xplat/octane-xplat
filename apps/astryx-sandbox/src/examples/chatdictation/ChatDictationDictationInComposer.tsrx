// Copyright (c) Meta Platforms, Inc. and affiliates.

import { ChatDictationButton, ChatComposer } from '@octane-xplat/ui/chat'
import type { UseSpeechRecognitionReturn } from '@octane-xplat/ui/chat'
import { Stack } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'

const noop = () => {}

const idleDictation: UseSpeechRecognitionReturn = {
	volume: 0,
	rawBands: [0, 0, 0, 0, 0],
	bands: [0, 0, 0, 0, 0],
	isSupported: true,
	isListening: false,
	isSpeaking: false,
	interimTranscript: '',
	start: noop,
	stop: noop,
	abort: noop,
	toggle: noop,
}

export function ChatDictationDictationInComposer() {
	return (
		<Stack direction="vertical" gap={3} style={{ width: '100%', maxWidth: 450 }}>
			<Text type="supporting" color="secondary">
				Dictation button in the sendActions slot
			</Text>
			<ChatComposer
				onSend={() => {}}
				placeholder="Type or tap the mic to dictate..."
				sendActions={<ChatDictationButton dictation={idleDictation} />}
			/>
		</Stack>
	)
}
