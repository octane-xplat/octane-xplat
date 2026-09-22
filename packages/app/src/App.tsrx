import { useState } from 'octane';
import { View, Text, Pressable } from '@xplat/ui';

export function App() @{
	const [count, setCount] = useState(0);
	<View className="flex-1 items-center justify-center gap-4">
		<Text className="text-xl font-bold">{'Count: ' + count}</Text>
		<Pressable onPress={() => setCount(count + 1)} className="btn bg-primary">
			<Text className="text-onprimary">Increment</Text>
		</Pressable>
	</View>
}
