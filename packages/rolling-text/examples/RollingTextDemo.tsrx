import { useState } from 'octane'
import { HStack, Pressable, Text, View } from '@octane-xplat/ui'
import { RollingText } from '../src/index'

/** Smallest useful harness: a counter whose label rolls per grapheme. */
export function RollingTextDemo() {
	const [count, setCount] = useState(9)
	return (
		<View style={{ padding: 16, gap: 8 }}>
			<HStack gap={2}>
				<Pressable onPress={() => setCount((c: number) => Math.max(0, c - 1))}>
					<Text>−1</Text>
				</Pressable>
				<Pressable onPress={() => setCount((c: number) => c + 1)}>
					<Text>+1</Text>
				</Pressable>
			</HStack>
			<RollingText
				value={`${count} seconds`}
				rollBy="grapheme"
				direction="up"
				updatePolicy="latest"
				transition={{ duration: 0.25 }}
				reducedMotion="user"
				accessibilityLabel={`${count} seconds`}
			/>
		</View>
	)
}
