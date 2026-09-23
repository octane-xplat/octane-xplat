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

/** Demo launcher — chip menu + @if-chain dispatch.
 *  Mount/unmount per selection is deliberate: leaving a demo must run its
 *  effect cleanup (watch/stopwatch timers die on switch — check the logs).
 *  Mount as the app root (`<Gallery />` instead of `<App />`) or as a tab. */
export function Gallery() @{
	const [demo, setDemo] = useState('counter');
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
			@if (demo === 'counter') {
				<Counter />
			} @else if (demo === 'watch') {
				<WatchFace />
			} @else if (demo === 'stopwatch') {
				<Stopwatch />
			} @else if (demo === 'todo') {
				<Todo />
			} @else if (demo === 'ttt') {
				<TicTacToe />
			} @else if (demo === 'dialer') {
				<Dialer />
			} @else if (demo === 'vlist') {
				<VirtualList />
			} @else if (demo === 'weather') {
				<Weather />
			} @else if (demo === 'anim') {
				<AnimShowcase />
			} @else {
				<ReactiveProbe />
			}
		</View>
	</Screen>
}
