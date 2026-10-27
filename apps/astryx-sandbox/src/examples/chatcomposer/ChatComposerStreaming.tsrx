// Copyright (c) Meta Platforms, Inc. and affiliates.

import { useState, useRef, useEffect } from 'octane'
import { ChatComposer } from '@octane-xplat/ui/chat'
import { Stack } from '@octane-xplat/ui'
import { Text } from '@octane-xplat/ui'

export function ChatComposerStreaming() {
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
	useEffect(() => () => clearTimeout(timer.current), [])
	const [isStreaming, setIsStreaming] = useState(false)
	const [value, setValue] = useState('Click the send button to start streaming.')

	return (
		<Stack direction="vertical" gap={4} width={450} maxWidth="100%">
			<Stack direction="vertical" gap={1}>
				<Text type="supporting" color="secondary">
					{isStreaming ? 'Streaming — click stop to cancel' : 'Send a message to start streaming'}
				</Text>
				<ChatComposer
					value={value}
					onChange={setValue}
					onSend={(value) => {
						console.log('Sent:', value)
						setValue('')
						setIsStreaming(true)
						clearTimeout(timer.current)
						timer.current = setTimeout(() => setIsStreaming(false), 5000)
					}}
					isStopShown={isStreaming}
					onCancel={() => {
						clearTimeout(timer.current)
						setIsStreaming(false)
					}}
					placeholder="Send a message to start streaming..."
				/>
			</Stack>
		</Stack>
	)
}
