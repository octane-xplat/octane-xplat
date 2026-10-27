// Port of Hooks/useStreamingTextHookUsage.tsx, Astryx 0.6.4 (Meta, MIT).
// Start/stop/reset controls supplement the pinned completed response.
import { useEffect, useRef, useState } from 'octane'
import { useStreamingText } from '@octane-xplat/ui/markdown'
import { Button, Card, HStack, VStack, Text } from '@octane-xplat/ui'

const response = 'Astryx hooks keep behavior reusable while components keep visuals consistent.'

export function UseStreamingTextHookUsage() @{
	const [text, setText] = useState(response)
	const [streaming, setStreaming] = useState(false)
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
	const displayed = useStreamingText(text, streaming, { speed: 'fast' })
	useEffect(() => () => clearTimeout(timer.current), [])
	useEffect(() => {
		if (streaming && displayed === response) {
			setStreaming(false)
		}
	}, [streaming, displayed])

	function start() {
		clearTimeout(timer.current)
		setText('')
		setStreaming(true)
		timer.current = setTimeout(() => setText(response), 40)
	}

	function stop() {
		clearTimeout(timer.current)
		setStreaming(false)
	}

	<Card width={420} padding={4}>
		<VStack gap={2}>
			<Text type="body" weight="bold">
				Assistant response
			</Text>
			<Text type="body">{displayed || 'No response yet'}</Text>
			<Text type="supporting" color="secondary">
				{streaming ? 'Streaming' : 'Complete'}
			</Text>
			<HStack gap={2}>
				<Button label="Start streaming" clickAction={start} />
				<Button label="Stop streaming" clickAction={stop} isDisabled={!streaming} />
				<Button
					label="Reset"
					clickAction={() => {
						stop()
						setText('')
					}}
				/>
			</HStack>
		</VStack>
	</Card>
}
