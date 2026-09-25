import { useState } from 'octane';
import { Screen, View, Row, Text, Pressable } from '@octane-xplat/ui';
import { Counter } from './Counter.tsrx';
import { Stopwatch } from './Stopwatch.tsrx';
import { Todo } from './Todo.tsrx';
import { TicTacToe } from './TicTacToe.tsrx';
import { WatchFace } from './WatchFace.tsrx';
import { Dialer } from './Dialer.tsrx';
import { VirtualList } from './VirtualList.tsrx';
import { Weather } from './Weather.tsrx';
import { AnimShowcase } from './AnimShowcase.tsrx';
import { ReactiveProbe } from './ReactiveProbe.tsrx';
import { ListDemo } from './ListDemo.tsrx';
import { ScrollBoxDemo } from './ScrollBoxDemo.tsrx';
import { DeviceDemo } from './DeviceDemo.tsrx';
import { ModalDemo } from './ModalDemo.tsrx';
import { PropsDemo } from './PropsDemo.tsrx';
import { OverlayDemo } from './OverlayDemo.tsrx';
import { ControlsDemo } from './ControlsDemo.tsrx';
import { LayoutDemo } from './LayoutDemo.tsrx';
import { RichTextDemo } from './RichTextDemo.tsrx';
import { Divergence } from './Divergence.tsrx';
import { GlassDemo } from './GlassDemo.tsrx';
import { useLastDemo } from './store.tsrx';

export const DEMOS = [
	{ id: 'counter', title: 'Counter' },
	{ id: 'watch', title: 'Watch' },
	{ id: 'stopwatch', title: 'Stopwatch' },
	{ id: 'todo', title: 'Todo' },
	{ id: 'ttt', title: 'Tic-Tac-Toe' },
	{ id: 'dialer', title: 'Dialer' },
	{ id: 'vlist', title: 'List ×500' },
	{ id: 'weather', title: 'Weather' },
	{ id: 'anim', title: 'Keyframes' },
	{ id: 'probe', title: 'Reactivity' },
	{ id: 'list-demo', title: 'List contract' },
	{ id: 'scrollbox', title: 'ScrollBox + List' },
	{ id: 'device', title: 'Device seams' },
	{ id: 'modal', title: 'Modal' },
	{ id: 'props', title: 'Props' },
	{ id: 'overlay', title: 'Overlays' },
	{ id: 'controls', title: 'Controls' },
	{ id: 'layout', title: 'Layout' },
	{ id: 'rich-text', title: 'Rich text' },
	{ id: 'divergence', title: 'Divergence' },
	{ id: 'glass', title: 'Glass' },
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
};

/** Demo launcher — chip menu. Two modes:
 *  - `onOpen` provided (app shell): chips delegate — App navigates to the
 *    `demo` route; each demo runs on its own pushed Page/root.
 *  - `onOpen` absent (standalone catalog): chips swap an inline render map.
 *  `Last opened` reads the module store — it updates after nav pops back,
 *  proving module-scope state crosses roots (context never does). */
export function Gallery(props: { onOpen?: (id: string) => void }) @{
	const [demo, setDemo] = useState('counter');
	const last = useLastDemo();
	const open = (id: string) => {
		console.log('[probe] demo -> ' + id);
		if (props.onOpen) props.onOpen(id); else setDemo(id);
	};

	<Screen className="vx-app flex-1 gap-4">
		<Text className="chip-off">{'Last opened: ' + (last ?? '—')}</Text>
		<Row className="demo-menu">
			@for (const d of DEMOS; key d.id) {
				<Pressable
					id={'menu-' + d.id}
					onPress={() => open(d.id)}
					className={['chip', !props.onOpen && demo === d.id ? '' : 'chip-off']}
				>
					<Text className="text-onprimary">{d.title}</Text>
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
