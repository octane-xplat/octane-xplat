import { useState, useEffect, useRef } from 'octane';
import { View, Row, Text, Pressable, TextInput, List, ScrollView, Image, Modal, PlatformBadge, useAnimation } from '@xplat/ui';
import { openDetail } from './platform/nav';
import { openOverlay } from './platform/overlay';

const INITIAL = [
	{ id: 'a', label: 'Alpha' },
	{ id: 'b', label: 'Beta' },
	{ id: 'c', label: 'Gamma' },
	{ id: 'd', label: 'Delta' },
	{ id: 'e', label: 'Epsilon' },
];

// Identity-stable — an inline arrow would change every Home render and force
// every recycled cell root to re-render on each native itemLoading refire.
const renderItem = (item: any) => <Text className="cell">{item.label}</Text>;
const renderEmpty = () => <Text>No items</Text>;
const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
// 1×1 red PNG — deterministic, no network. data: URIs decode via
// ImageSource.fromBase64 on native; the web leaf just hands it to <img>.
const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/** Home tab — the original harness surface (counter, list, input, probes). */
export function Home() @{
	const [count, setCount] = useState(0);
	const [dark, setDark] = useState(false);
	const darkMark = useRef(0);
	const [text, setText] = useState('');
	const [items, setItems] = useState(INITIAL);
	const [modal, setModal] = useState(false);
	const x = useAnimation(0);
	console.log('[harness] Home render, items=' + items.length);

	useEffect(() => {
		console.log('[harness] Home mounted');
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

	<View className={['vx-app', 'flex-1', 'gap-4', dark ? 'dark ns-dark' : '']}>
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
			<Pressable
				id="clear-btn"
				onPress={() => setItems(items.length ? [] : [...INITIAL])}
				className="btn bg-primary"
			>
				<Text className="text-onprimary">{items.length ? 'Clear' : 'Restore'}</Text>
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
			<Pressable id="modal-btn" onPress={() => setModal(true)} className="btn bg-primary">
				<Text className="text-onprimary">Modal</Text>
			</Pressable>
		</Row>

		{/* Modal seam: declarative open → native showModal on a second root;
		    web <dialog>. Context doesn't cross — data goes through props. */}
		<Modal open={modal} onClose={() => setModal(false)}>
			<View className="modal-panel">
				<Text>Modal content</Text>
				<Pressable id="modal-close" onPress={() => setModal(false)} className="btn bg-primary">
					<Text className="text-onprimary">Close modal</Text>
				</Pressable>
			</View>
		</Modal>

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

		{/* ScrollView seam: NS <scrollview> hosts one child — the leaf wraps
		    children in a column layout. Probe reads verticalOffset back.
		    Universal @for needs an explicit key even for scalar ranges. */}
		<ScrollView id="scroll-box" className="scrollbox" style={{ height: 96 }}>
			@for (const n of ROWS; key n) {
				<Text className="scrollrow">{'Row ' + n}</Text>
			}
		</ScrollView>

		{/* Image seam: <image> native / <img> web; data: URI decodes
		    synchronously via ImageSource.fromBase64Sync. */}
		<Image id="img" src={PIXEL} alt="pixel" style={{ width: 24, height: 24 }} />

		{/* Animation seam (Exp 13): imperative controller writes the view's
		    translateX per rAF frame — no re-render, no worklets. */}
		<Row className="gap-4">
			<View id="anim-box" bind={x.bind} style={{ width: 40, height: 40, backgroundColor: '#e91e63' }} />
			<Pressable id="anim-btn" onPress={() => {
				x.to(80, { duration: 300 });
				setTimeout(() => x.spring(0), 700);
			}} className="btn bg-primary">
				<Text className="text-onprimary">Animate</Text>
			</Pressable>
		</Row>

		<TextInput
			value={text}
			onChange={(v) => { console.log('[probe] onChange ' + v); setText(v); }}
			placeholder="Type here"
			className="input"
		/>
		<Text>{'Typed: ' + text}</Text>

		<List
			id="main-list"
			items={items}
			className="list flex-1"
			renderItem={renderItem}
			renderEmpty={renderEmpty}
		/>
	</View>
}
