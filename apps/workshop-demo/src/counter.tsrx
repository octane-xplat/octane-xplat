import { Pressable, Text, useStore, type Store } from '@octane-xplat/ui'

export type CounterState = { count: number }

export function WorkshopCounter(props: {
	step: number
	label?: string
	state: Store<CounterState>
	fixture: { account: string }
}) {
	const { count } = useStore(props.state)
	return (
		<Pressable
			accessibilityLabel="Increment"
			testID="workshop.counter"
			onPress={() => props.state.update((s) => ({ count: s.count + props.step }))}
		>
			<Text>
				{props.label ?? props.fixture.account}: {count} (+{props.step})
			</Text>
		</Pressable>
	)
}
