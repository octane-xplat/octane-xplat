import { useState } from 'octane';
import { View, Row, Text, Pressable } from '@xplat/ui';

/** counter-jsx / reactive-counter — the smallest state→commit cycle.
 *  Baseline probe: if this breaks, everything above it is noise. */
export function Counter() @{
	const [count, setCount] = useState(0);
	const [parity, setParity] = useState(false);
	console.log('[demo] Counter render count=' + count);
	<View className="vx-app flex-1 gap-4 items-center">
		<Text className="demo-clock">{'Demo count: ' + count}</Text>
		<Row className="gap-4">
			<Pressable id="counter-dec" onPress={() => { console.log('[probe] counter -'); setCount(count - 1); }} className="btn bg-primary">
				<Text className="text-onprimary">-</Text>
			</Pressable>
			<Pressable id="counter-inc" onPress={() => { console.log('[probe] counter +'); setCount(count + 1); }} className="btn bg-primary">
				<Text className="text-onprimary">+</Text>
			</Pressable>
		</Row>
		{/* Binary @if/@else toggle — discriminates else-arm mount + arm swap
		    on native (docs/demos.md findings). */}
		<Pressable id="if-toggle" onPress={() => setParity(!parity)} className="btn bg-primary">
			<Text className="text-onprimary">Flip</Text>
		</Pressable>
		@if (parity) {
			<Text className="chip">arm-A</Text>
		} @else {
			<Text className="chip">arm-B</Text>
		}
	</View>
}
