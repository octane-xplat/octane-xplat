/** @jsxImportSource @octane-xplat/jsx/dom */
// Copyright (c) Meta Platforms, Inc. and affiliates.

import { useRef } from 'octane'
import {
	ChatDictationButton,
	ChatComposer,
	ChatComposerInput,
	useChatDictation,
} from '@octane-xplat/ui/chat'

import type { ChatComposerInputHandle } from '@octane-xplat/ui/chat'
import { HStack, VStack } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'

export function ChatDictationButtonShowcase() {
	const inputRef = useRef<ChatComposerInputHandle | null>(null)

	const dictation = useChatDictation({
		inputRef,
		hasSounds: true,
		onResult: (text) => {
			console.log('Dictation result:', text)
		},
	})

	return (
		<VStack gap={4} width={450} maxWidth="100%">
			<Text type="supporting" color="secondary">
				Click the microphone to start dictating. Speech is transcribed into the input.
			</Text>
			<ChatComposer
				onSend={(v) => console.log('Submit:', v)}
				input={<ChatComposerInput ref={inputRef} />}
				sendActions={<ChatDictationButton dictation={dictation} />}
			/>
			{dictation.isListening && (
				<HStack gap={2} vAlign="center">
					<Text type="supporting" color="secondary">
						{dictation.isSpeaking ? 'Speaking detected' : 'Listening...'}
					</Text>
					<div
						style={{
							width: 80,
							height: 6,
							backgroundColor: 'var(--color-surface-secondary)',
							borderRadius: 3,
							overflow: 'hidden',
						}}
					>
						<div
							style={{
								height: '100%',
								backgroundColor: dictation.isSpeaking
									? 'var(--color-accent)'
									: 'var(--color-text-secondary)',
								borderRadius: 3,
								transition: 'width 0.08s ease-out',
								width: `${Math.min(dictation.volume * 200, 100)}%`,
							}}
						/>
					</div>
				</HStack>
			)}
			{!dictation.isSupported && (
				<Text type="supporting" color="accent">
					SpeechRecognition is not supported in this browser.
				</Text>
			)}
		</VStack>
	)
}
