import { useState } from 'octane';
import { View, Row, Text, Pressable } from '@xplat/ui';

/** counter-jsx / reactive-counter — the smallest state→commit cycle.
 *  Baseline probe: if this breaks, everything above it is noise. */
export function Counter() @{
	const [count, setCount] = useState(0);
	console.log('[demo] Counter render count=' + count);
	<View className="vx-app flex-1 gap-4 items-center">
		<Text className="demo-clock">{'Count: ' + count}</Text>
		<Row className="gap-4">
			<Pressable id="counter-dec" onPress={() => { console.log('[probe] counter -'); setCount(count - 1); }} className="btn bg-primary">
				<Text className="text-onprimary">-</Text>
			</Pressable>
			<Pressable id="counter-inc" onPress={() => { console.log('[probe] counter +'); setCount(count + 1); }} className="btn bg-primary">
				<Text className="text-onprimary">+</Text>
			</Pressable>
		</Row>
	</View>
}
