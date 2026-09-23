import { useState } from 'octane';
import { Screen, View, Row, Text, Pressable } from '@xplat/ui';
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

const DEMOS = [
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

const RENDER: Record<string, () => any> = {
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
};

/** Demo launcher — chip menu + render-map dispatch.
 *  Mount/unmount per selection is deliberate: leaving a demo must run its
 *  effect cleanup (watch/stopwatch timers die on switch — check the logs).
 *  Mounted as the 'Demos' tab in App.tsrx. */
export function Gallery() @{
	const [demo, setDemo] = useState('counter');
	console.log('[demo] Gallery render demo=' + demo);
	<Screen className="vx-app flex-1 gap-4">
		<Row className="demo-menu">
			@for (const d of DEMOS; key d.id) {
				<Pressable
					id={'menu-' + d.id}
					onPress={() => { console.log('[probe] demo -> ' + d.id); setDemo(d.id); }}
					className={['chip', demo === d.id ? '' : 'chip-off']}
				>
					<Text className="text-onprimary">{d.title}</Text>
				</Pressable>
			}
		</Row>
		<View className="flex-1">
			{RENDER[demo]()}
		</View>
	</Screen>
}
