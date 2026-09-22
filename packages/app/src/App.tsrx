import { useState, useEffect, useRef } from 'octane';
import { Screen, View, Row, Text, Pressable, TextInput, List, PlatformBadge } from '@xplat/ui';
import { openDetail } from './platform/nav';
import { openOverlay } from './platform/overlay';

const INITIAL = [
	{ id: 'a', label: 'Alpha' },
	{ id: 'b', label: 'Beta' },
	{ id: 'c', label: 'Gamma' },
	{ id: 'd', label: 'Delta' },
	{ id: 'e', label: 'Epsilon' },
];

console.log('[harness] App module evaluated');

// Identity-stable — an inline arrow would change every App render and force
// every recycled cell root to re-render on each native itemLoading refire.
const renderItem = (item: any) => <Text className="cell">{item.label}</Text>;

export function App() @{
	const [count, setCount] = useState(0);
	const [dark, setDark] = useState(false);
	const darkMark = useRef(0);
	const [text, setText] = useState('');
	const [items, setItems] = useState(INITIAL);
	console.log('[harness] App render, items=' + items.length);

	useEffect(() => {
		console.log('[harness] App mounted');
		// Self-driving probe sequence for lab experiments (no UI taps needed):
		// t+1s shuffle (ListView rebind/recycle path), t+2s controlled input,
		// t+3s dark toggle (class/token swap).
		const t1 = setTimeout(() => {
			console.log('[self] shuffle');
			setItems([...items].reverse());
		}, 1000);
		const t2 = setTimeout(() => {
			console.log('[self] setText');
			setText('hello');
		}, 2000);
		const t3 = setTimeout(() => {
			console.log('[self] dark on');
			darkMark.current = Date.now();
			setDark(true);
		}, 3000);
		return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
	}, []);

	useEffect(() => {
		// Runs post-commit: setState -> render -> native prop application ->
		// effect. darkMark is the setState timestamp.
		if (darkMark.current) {
			console.log('[probe] dark setState->commit ' + (Date.now() - darkMark.current) + 'ms');
		}
	}, [dark]);

	<Screen className={['vx-app', 'flex-1', 'gap-4', dark ? 'dark ns-dark' : '']}>
		<Text className="text-xl font-bold">{'Count: ' + count}</Text>
		<PlatformBadge className="badge" />

		<Row className="gap-4">
			<Pressable
				id="a11y-btn"
				accessible={true}
				accessibilityLabel="Increment counter"
				accessibilityRole="button"
				onPress={() => setCount(count + 1)}
				className="btn bg-primary"
			>
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

		{/* Navigation + overlay seams (Exp 9): platform modules resolve the
		    imperative call per target. */}
		<Row className="gap-4">
			<Pressable id="detail-btn" onPress={openDetail} className="btn bg-primary">
				<Text className="text-onprimary">Detail →</Text>
			</Pressable>
			<Pressable id="overlay-btn" onPress={openOverlay} className="btn bg-primary">
				<Text className="text-onprimary">Overlay</Text>
			</Pressable>
		</Row>

		{/* Gesture seam (Exp 10): onPan/onSwipe → NS gesture events on the
		    flexboxlayout; web leaf accepts the props, pointer plumbing
		    pending. */}
		<View
			id="pan-box"
			className="panbox"
			style={{ padding: 16 }}
			onPan={(e) => console.log('[probe] pan d=' + e.deltaX + ',' + e.deltaY + ' state=' + e.state)}
			onSwipe={(e) => console.log('[probe] swipe dir=' + e.direction)}
		>
			<Pressable onPress={openOverlay} className="btn bg-primary">
				<Text className="text-onprimary">Pan / swipe box</Text>
			</Pressable>
		</View>

		{/* @for keyed reorder on a plain layout parent — native driver
		    insert/move path (experiment bc3f77c4). */}
		<Row className="gap-2">
			@for (const item of items; key item.id) {
				<Text className="chip">{item.id}</Text>
			}
		</Row>

		<TextInput
			value={text}
			onChange={(v) => { console.log('[probe] onChange ' + v); setText(v); }}
			placeholder="Type here"
			className="input"
		/>
		<Text>{'Typed: ' + text}</Text>

		{/* ListView cell roots — experiment a1b2c3d4 (each cell is an
		    independent universal root; check mount + reuse). */}
		<List
			items={items}
			className="list flex-1"
			renderItem={renderItem}
		/>
	</Screen>
}
