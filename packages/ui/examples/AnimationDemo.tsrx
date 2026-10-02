import { View, Text, Pressable, useAnimation } from '@octane-xplat/ui'

/** Ref-driven animation: each button replaces playback from its current sample. */
export function AnimationDemo() @{
	const x = useAnimation(0, 'translateX')

	<View>
		<Pressable onPress={() => x.to(80, { duration: 300 })}><Text>Slide</Text></Pressable>
		<Pressable onPress={() => x.spring(0, { damping: 14, stiffness: 120 })}><Text>Return</Text></Pressable>
		<Pressable onPress={() => x.stop()}><Text>Stop</Text></Pressable>
		<View ref={x.ref}><Text>Moving card</Text></View>
	</View>
}
