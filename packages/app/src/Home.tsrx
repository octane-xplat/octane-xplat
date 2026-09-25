import { useState, useEffect, useRef } from 'octane';
import { View, Row, Text, Pressable, NavLink, TextInput, TextArea, List, ScrollView, Image, Modal, PlatformBadge, useAnimation, useColorScheme, setThemePreference, styled } from '@octane-xplat/ui';
import { Link } from './Link';
import { openOverlay } from './platform/overlay';
import { probeSignal$ } from './probe-state';
import { storage } from '@octane-xplat/platform';
import 'octane/signals';

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
// styled() seam (Exp 16): variant prop → class composition, CSS-backed.
const DangerBtn = styled(Pressable, { base: 'btn', variants: { danger: 'bg-danger' } });
const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
// 1×1 red PNG — deterministic, no network. data: URIs decode via
// ImageSource.fromBase64 on native; the web leaf just hands it to <img>.
const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/** Home tab — the original harness surface (counter, list, input, probes). */
export function Home() @{
	const [count, setCount] = useState(0);
	// dark = manual override ?? system scheme (useColorScheme seam —
	// systemAppearanceChanged on native, prefers-color-scheme on web).
	const scheme = useColorScheme();
	const [override, setOverride] = useState<string | null>(null);
	const dark = (override ?? scheme) === 'dark';
	// Push the app-level override into the theme store so imperative roots
	// (overlay/popover/toast/sheet/modal) render with the same scheme.
	useEffect(() => {
		setThemePreference((override ?? 'system') as 'light' | 'dark' | 'system');
	}, [override]);

	const darkMark = useRef(0);
	const [text, setText] = useState('');
	const [bio, setBio] = useState('');
	const [items, setItems] = useState(INITIAL);
	const [modal, setModal] = useState(false);
	const x = useAnimation(0);
	console.log('[harness] Home render, items=' + items.length + ' scheme=' + scheme);

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
			setOverride('dark');
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

	<View className={['vx-app', 'flex-1', 'gap-6', dark ? 'dark ns-dark' : '']}>
		<Row className="justify-between items-baseline">
			<Text className="text-2xl font-semibold">Kitchen sink</Text>
			<PlatformBadge className="badge" />
		</Row>

		<View className="sink-section">
			<Text className="section-label">Reactivity</Text>
			<Text className="text-xl font-bold">{'Count: ' + count}</Text>
			{/* Universal signal-read seam: ambient .set() must re-render this owner. */}
			<Text className="text-sm text-muted">{probeSignal$.get() as string}</Text>
		</View>

		<View className="sink-section">
			<Text className="section-label">Controls</Text>
			<Row className="gap-3 flex-wrap">
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
				<Pressable id="scheme-toggle" onPress={() => setOverride(dark ? 'light' : 'dark')} className="btn btn-secondary">
					<Text>{dark ? 'Light' : 'Dark'}</Text>
				</Pressable>
				<Pressable
					onPress={() => {
						const next = [...items].reverse();
						console.log('[harness] shuffle -> ' + next.map((i) => i.id).join(','));
						setItems(next);
					}}
					className="btn btn-secondary"
				>
					<Text>Shuffle</Text>
				</Pressable>
				<Pressable
					id="clear-btn"
					onPress={() => setItems(items.length ? [] : [...INITIAL])}
					className="btn btn-secondary"
				>
					<Text>{items.length ? 'Clear' : 'Restore'}</Text>
				</Pressable>
			</Row>
		</View>

		{/* Navigation + overlay seams (Exp 9): platform modules resolve the
		    imperative call per target. */}
		<View className="sink-section">
			<Text className="section-label">Navigation and overlays</Text>
			<Row className="gap-3 flex-wrap items-center">
				<NavLink route={{ stack: 'root', name: 'detail', params: { from: 'home' } }} className="btn bg-primary">
					<Text className="text-onprimary">Detail →</Text>
				</NavLink>
				{/* +modal route: manifest-declared presentation — NavLink pushes
				    it like any route, the leaf presents it modally. */}
				<NavLink route={{ stack: 'root', name: 'about', params: {} }} className="btn btn-secondary">
					<Text>About ⤴</Text>
				</NavLink>
				<Pressable id="overlay-btn" onPress={openOverlay} className="btn btn-secondary">
					<Text>Overlay</Text>
				</Pressable>
				<Pressable id="modal-btn" onPress={() => setModal(true)} className="btn btn-secondary">
					<Text>Modal</Text>
				</Pressable>
				<DangerBtn id="danger-btn" danger className="extra">
					<Text className="text-onprimary">styled</Text>
				</DangerBtn>
				{/* Link seam: web renders a real anchor; native is a Pressable
				    over navigate(). */}
				<Link to="detail" params={{ from: 'link' }} className="chip">
					<Text>Link →</Text>
				</Link>
				{/* Multi-child Pressable regression — the old contentview host
				    kept only the last child. The conditional indicator also
				    proves a child mounted post-commit lands inside the host. */}
				<Pressable id="multi-pressable" onPress={() => setCount(count + 1)} className="btn btn-secondary">
					<Text>Multi</Text>
					<View id="multi-sibling" style={{ width: 8, height: 8, backgroundColor: '#22c55e' }} />
					@if (dark) {
						<View id="multi-indicator" style={{ width: 8, height: 8, backgroundColor: '#facc15' }} />
					}
				</Pressable>
			</Row>
		</View>

		{/* Modal seam: declarative open → native showModal on a second root;
		    web <dialog>. Context doesn't cross — data goes through props. */}
		<Modal open={modal} onClose={() => setModal(false)}>
			<View className="modal-panel">
				<Text>Modal content</Text>
				<Pressable id="modal-close" onPress={() => setModal(false)} className="btn btn-secondary">
					<Text>Close modal</Text>
				</Pressable>
			</View>
		</Modal>

		<View className="sink-section">
			<Text className="section-label">Gestures and animation</Text>
			{/* Gesture seam (Exp 10/17): onPan/onSwipe → NS gesture events on the
			    flexboxlayout; payloads normalized to {dx,dy,state:'moved'|...}.
			    Web leaf plumbs pointer events itself (pointermove isn't
			    delegated by the DOM renderer). */}
			<View
				id="pan-box"
				className="panbox"
				style={{ padding: 16 }}
				onPan={(e) => {
					(e.target as any).lastPanState = e.state;
					console.log('[probe] pan dx=' + e.dx + ' dy=' + e.dy + ' state=' + e.state);
				}}
				onSwipe={(e) => console.log('[probe] swipe dir=' + e.direction)}
			>
				<Text className="text-sm text-muted">Pan or swipe inside this box</Text>
				<Pressable onPress={openOverlay} className="btn btn-secondary">
					<Text>Pan / swipe box</Text>
				</Pressable>
			</View>
			<Row className="gap-4 items-center">
				{/* Animation seam (Exp 13): imperative controller writes the view's
				    translateX per rAF frame — no re-render, no worklets. */}
				<View id="anim-box" bind={x.bind} className="anim-box" />
				{/* Image seam: <image> native / <img> web; data: URI decodes
				    synchronously via ImageSource.fromBase64Sync. */}
				<Image id="img" src={PIXEL} alt="pixel" style={{ width: 24, height: 24 }} />
				<Pressable id="anim-btn" onPress={() => {
					x.to(80, { duration: 300 });
					setTimeout(() => x.spring(0), 700);
				}} className="btn btn-secondary">
					<Text>Animate</Text>
				</Pressable>
			</Row>
		</View>

		<View className="sink-section">
			<Text className="section-label">Reordering and scrolling</Text>
			{/* @for keyed reorder on a plain layout parent — native driver
			    insert/move path (experiment bc3f77c4). */}
			<Row className="gap-2 flex-wrap">
				@for (const item of items; key item.id) {
					<Text className="chip">{item.id}</Text>
				}
			</Row>
			{/* ScrollView seam: NS <scrollview> hosts one child — the leaf wraps
			    children in a column layout. Probe reads verticalOffset back.
			    Universal @for keys default to position when omitted (upstream
			    branch universal-for-optional-key); `key n` kept for clarity. */}
			<ScrollView id="scroll-box" className="scrollbox" style={{ height: 96 }}>
				@for (const n of ROWS; key n) {
					<Text className="scrollrow">{'Row ' + n}</Text>
				}
			</ScrollView>
		</View>

		<View className="sink-section">
			<Text className="section-label">Inputs</Text>
			<TextInput
				id="probe-input"
				value={text}
				onChange={(v) => { console.log('[probe] onChange ' + v); setText(v); storage.setString('draft', v); }}
				placeholder="Type here"
				className="input"
			/>
			<Text className="text-sm text-muted">{'Typed: ' + text}</Text>
			{/* TextArea seam: <textarea>/<textview>; autoGrow re-fits height to
			    content on web (scrollHeight, capped at maxRows) while native's
			    TextView grows on its own — the leaf maps rows/maxRows to
			    min/maxHeight dips at the widget's measured line height. */}
			<TextArea
				id="probe-textarea"
				value={bio}
				onChange={(v) => { console.log('[probe] textareaChange ' + JSON.stringify(v)); setBio(v); }}
				placeholder="Multiline composer"
				autoGrow
				maxRows={4}
				className="input"
			/>
			<Text className="text-sm text-muted">{'Bio: ' + bio}</Text>
		</View>

		<View className="sink-section flex-1">
			<Text className="section-label">Items</Text>
			<List
				id="main-list"
				items={items}
				className="list flex-1"
				renderItem={renderItem}
				renderEmpty={renderEmpty}
			/>
		</View>
	</View>
}
