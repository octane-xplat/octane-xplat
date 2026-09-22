import { useState, useEffect } from 'octane';
import { View, Row, Text, Pressable, TextInput, List } from '@xplat/ui';

const INITIAL = [
	{ id: 'a', label: 'Alpha' },
	{ id: 'b', label: 'Beta' },
	{ id: 'c', label: 'Gamma' },
	{ id: 'd', label: 'Delta' },
	{ id: 'e', label: 'Epsilon' },
];

console.log('[harness] App module evaluated');

export function App() @{
	const [count, setCount] = useState(0);
	const [dark, setDark] = useState(false);
	const [text, setText] = useState('');
	const [items, setItems] = useState(INITIAL);
	console.log('[harness] App render, items=' + items.length);

	useEffect(() => {
		console.log('[harness] App mounted');
	}, []);

	<View className={['vx-app', 'flex-1', 'gap-4', dark ? 'dark ns-dark' : '']}>
		<Text className="text-xl font-bold">{'Count: ' + count}</Text>

		<Row className="gap-4">
			<Pressable onPress={() => setCount(count + 1)} className="btn bg-primary">
				<Text className="text-onprimary">Increment</Text>
			</Pressable>
			<Pressable onPress={() => setDark(!dark)} className="btn bg-primary">
				<Text className="text-onprimary">{dark ? 'Light' : 'Dark'}</Text>
			</Pressable>
			<Pressable
				onPress={() => {
					const next = [...items].reverse();
					console.log('[harness] shuffle -> ' + next.map((i) => i.id).join(','));
					setItems(next);
				}}
				className="btn bg-primary"
			>
				<Text className="text-onprimary">Shuffle</Text>
			</Pressable>
		</Row>

		{/* @for keyed reorder on a plain layout parent — native driver
		    insert/move path (experiment bc3f77c4). */}
		<Row className="gap-2">
			@for (const item of items; key item.id) {
				<Text className="chip">{item.id}</Text>
			}
		</Row>

		<TextInput
			value={text}
			onChange={setText}
			placeholder="Type here"
			className="input"
		/>
		<Text>{'Typed: ' + text}</Text>

		{/* ListView cell roots — experiment a1b2c3d4 (each cell is an
		    independent universal root; check mount + reuse). */}
		<List
			items={items}
			className="list flex-1"
			renderItem={(item) => <Text className="cell">{item.label}</Text>}
		/>
	</View>
}
