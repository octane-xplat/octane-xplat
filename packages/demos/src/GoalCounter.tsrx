import { useState } from 'octane'
import { View, Text, Pressable } from '@octane-xplat/ui'

/** A session-local goal: no timers, persistence, or permissions. */
export function GoalCounter() @{
	const [count, setCount] = useState(0)

	<View className="gap-4">
		<Text className="text-xl font-semibold">Take five small steps</Text>
		<Text accessibilityLiveRegion="polite">{`${count} of 5 steps completed${count === 5 ? ' — goal reached!' : ''}`}</Text>
		<Pressable
			id="goal-add"
			className="btn bg-primary"
			disabled={count === 5}
			onPress={() => setCount(Math.min(5, count + 1))}
		>
			<Text className="text-onprimary">Complete one step</Text>
		</Pressable>
		<Pressable
			id="goal-undo"
			className="btn btn-secondary"
			disabled={count === 0}
			onPress={() => setCount(Math.max(0, count - 1))}
		>
			<Text>Undo one step</Text>
		</Pressable>
		<Pressable id="goal-reset" className="btn btn-secondary" onPress={() => setCount(0)}>
			<Text>Reset goal</Text>
		</Pressable>
	</View>
}
