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
import { DeviceDemo } from './DeviceDemo.tsrx';
import { ModalDemo } from './ModalDemo.tsrx';
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
	{ id: 'device', title: 'Device seams' },
	{ id: 'modal', title: 'Modal' },
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
const renderDevice = () => <DeviceDemo />;
const renderModal = () => <ModalDemo />;

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
	device: renderDevice,
	modal: renderModal,
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
