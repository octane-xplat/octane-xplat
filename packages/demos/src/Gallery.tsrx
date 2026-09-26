import { useState } from 'octane';
import { Screen, View, Row, Text, Pressable } from '@octane-xplat/ui';
import { Counter } from './Counter.tsrx';
import { Stopwatch } from './Stopwatch.tsrx';
import { Todo } from './Todo.tsrx';
import { TicTacToe } from './TicTacToe.tsrx';
import { WatchFace } from './WatchFace.tsrx';
import { Dialer } from './Dialer.tsrx';
// './variant-demos' is extensionless on purpose: moduleSuffixes +
// resolve.extensions pick the .ios.ts/.android.ts/.web.ts twin, which
// re-exports the platform-authentic demo leaf (or the shared fallback).
import { VirtualList, ListDemo, ScrollBoxDemo, DeviceDemo, ModalDemo, GlassDemo, OverlayDemo } from './variant-demos';
import { Weather } from './Weather.tsrx';
import { AnimShowcase } from './AnimShowcase.tsrx';
import { ReactiveProbe } from './ReactiveProbe.tsrx';

import { PropsDemo } from './PropsDemo.tsrx';
import { ControlsDemo } from './ControlsDemo.tsrx';
import { LayoutDemo } from './LayoutDemo.tsrx';
import { RichTextDemo } from './RichTextDemo.tsrx';
import { Divergence } from './Divergence.tsrx';
import { Reorder } from './Reorder.tsrx';
import { useLastDemo } from './store.tsrx';

// kind: 'app' = a self-contained mini-app a human pokes to build trust;
// 'proof' = a seam demonstration (probes, proofs, boring stuff) — lives
// under the harness's Test tab instead of the gallery.
export const DEMOS: { id: string; title: string; kind: 'app' | 'proof' }[] = [
	{ id: 'counter', title: 'Counter', kind: 'app' },
	{ id: 'watch', title: 'Watch', kind: 'app' },
	{ id: 'stopwatch', title: 'Stopwatch', kind: 'app' },
	{ id: 'todo', title: 'Todo', kind: 'app' },
	{ id: 'ttt', title: 'Tic-Tac-Toe', kind: 'app' },
	{ id: 'dialer', title: 'Dialer', kind: 'app' },
	{ id: 'vlist', title: 'List ×500', kind: 'app' },
	{ id: 'weather', title: 'Weather', kind: 'app' },
	{ id: 'list-demo', title: 'Feed', kind: 'app' },
	{ id: 'anim', title: 'Keyframes', kind: 'proof' },
	{ id: 'probe', title: 'Reactivity', kind: 'proof' },
	{ id: 'scrollbox', title: 'ScrollBox + List', kind: 'proof' },
	{ id: 'device', title: 'Device', kind: 'proof' },
	{ id: 'modal', title: 'Modal', kind: 'proof' },
	{ id: 'props', title: 'Props', kind: 'proof' },
	{ id: 'overlay', title: 'Overlays', kind: 'proof' },
	{ id: 'controls', title: 'Controls', kind: 'proof' },
	{ id: 'layout', title: 'Layout', kind: 'proof' },
	{ id: 'rich-text', title: 'Rich text', kind: 'proof' },
	{ id: 'divergence', title: 'Layout edges', kind: 'proof' },
	{ id: 'glass', title: 'Glass', kind: 'proof' },
	{ id: 'reorder', title: 'Reorder', kind: 'proof' },
];

// Render fns are standalone arrows (same contract as TabSpec.render /
// List.renderItem) — JSX inside a module-level object literal can't get
// universal lowering. Dispatch is {RENDER[demo]()} in children position,
// the same function-call shape Cell uses for renderItem.
// NOTE: an @if/@else-if chain here compiled to an else callback that
// discards branch results — @else-if lowers wrong in the universal
// codegen (see docs/demos.md findings).
const renderCounter = () => <Counter />;
const renderWatch = () => <WatchFace />;
const renderStopwatch = () => <Stopwatch />;
const renderTodo = () => <Todo />;
const renderTtt = () => <TicTacToe />;
const renderDialer = () => <Dialer />;
const renderVlist = () => <VirtualList />;
const renderWeather = () => <Weather />;
const renderAnim = () => <AnimShowcase />;
const renderProbe = () => <ReactiveProbe />;
const renderListDemo = () => <ListDemo />;
const renderScrollBox = () => <ScrollBoxDemo />;
const renderDevice = () => <DeviceDemo />;
const renderModal = () => <ModalDemo />;
const renderProps = () => <PropsDemo />;
const renderOverlay = () => <OverlayDemo />;
const renderControls = () => <ControlsDemo />;
const renderLayout = () => <LayoutDemo />;
const renderRichText = () => <RichTextDemo />;
const renderDivergence = () => <Divergence />;
const renderGlass = () => <GlassDemo />;
const renderReorder = () => <Reorder />;

export const RENDER: Record<string, () => any> = {
	counter: renderCounter,
	watch: renderWatch,
	stopwatch: renderStopwatch,
	todo: renderTodo,
	ttt: renderTtt,
	dialer: renderDialer,
	vlist: renderVlist,
	weather: renderWeather,
	anim: renderAnim,
	probe: renderProbe,
	'list-demo': renderListDemo,
	scrollbox: renderScrollBox,
	device: renderDevice,
	modal: renderModal,
	props: renderProps,
	overlay: renderOverlay,
	controls: renderControls,
	layout: renderLayout,
	'rich-text': renderRichText,
	divergence: renderDivergence,
	glass: renderGlass,
	reorder: renderReorder,
};

/** Demo launcher — chip menu. Two modes:
 *  - `onOpen` provided (app shell): chips delegate — App navigates to the
 *    `demo` route; each demo runs on its own pushed Page/root.
 *  - `onOpen` absent (standalone catalog): chips swap an inline render map.
 *  `Last opened` reads the module store — it updates after nav pops back,
 *  proving module-scope state crosses roots (context never does). */
export function Gallery(props: { onOpen?: (id: string) => void; kind?: 'app' | 'proof'; title?: string }) @{
	const [demo, setDemo] = useState('counter');
	const last = useLastDemo();
	const shown = DEMOS.filter((d) => !props.kind || d.kind === props.kind);
	const open = (id: string) => {
		console.log('[probe] demo -> ' + id);
		if (props.onOpen) props.onOpen(id); else setDemo(id);
	};

	<Screen className="vx-app flex-1 gap-6">
		<Row className="justify-between items-baseline">
			<Text className="text-2xl font-semibold">{props.title ?? 'Demos'}</Text>
			<Text className="text-sm text-muted">{'Last opened: ' + (last ?? '—')}</Text>
		</Row>
		<Row className="demo-menu">
			@for (const d of shown; key d.id) {
				<Pressable
					id={'menu-' + d.id}
					onPress={() => open(d.id)}
					className={['chip', props.onOpen || demo === d.id ? '' : 'chip-off']}
				>
					<Text>{d.title}</Text>
				</Pressable>
			}
		</Row>
		@if (!props.onOpen) {
			<View className="flex-1">
				{RENDER[demo]()}
			</View>
		}
	</Screen>
}
