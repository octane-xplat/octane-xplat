import { useState, useEffect, useRef } from 'octane';
import { View, Row, Text, Pressable } from '@octane-xplat/ui';

type Lap = { id: number; ms: number };

function fmt(ms: number): string {
	const t = Math.floor(ms / 100);
	const d = t % 10;
	const s = Math.floor(t / 10) % 60;
	const m = Math.floor(t / 600);
	return m + ':' + String(s).padStart(2, '0') + '.' + d;
}

/** stopwatch-jsx — interval-driven commits + effect lifecycle.
 *  Proves: setInterval inside useEffect on both targets, cleanup on
 *  unmount (gallery switch must kill the timer), lap appends via @for. */
export function Stopwatch() @{
	const [elapsed, setElapsed] = useState(0);
	const [running, setRunning] = useState(false);
	const [laps, setLaps] = useState<Lap[]>([]);
	const acc = useRef(0);
	const since = useRef(0);
	const lapId = useRef(0);

	useEffect(() => {
		if (!running) return;
		since.current = Date.now();
		const t = setInterval(() => setElapsed(acc.current + (Date.now() - since.current)), 100);
		return () => clearInterval(t);
	}, [running]);

	useEffect(() => {
		return () => console.log('[demo] Stopwatch unmounted — timer dead');
	}, []);

	const toggle = () => {
		if (running) acc.current = elapsed;
		setRunning(!running);
	};

	<View className="vx-app flex-1 gap-4">
		<Text className="demo-clock">{fmt(elapsed)}</Text>
		<Row className="gap-4">
			<Pressable id="sw-toggle" onPress={toggle} className="btn bg-primary">
				<Text className="text-onprimary">{running ? 'Stop' : 'Start'}</Text>
			</Pressable>
			<Pressable id="sw-lap" onPress={() => setLaps([{ id: ++lapId.current, ms: elapsed }, ...laps])} className="btn btn-secondary">
				<Text>Lap</Text>
			</Pressable>
			<Pressable id="sw-reset" onPress={() => { setRunning(false); acc.current = 0; setElapsed(0); setLaps([]); }} className="btn btn-secondary">
				<Text>Reset</Text>
			</Pressable>
		</Row>
		<View className="gap-2">
			@for (const lap of laps; index i; key lap.id) {
				<Text className="chip">{'Lap ' + (laps.length - i) + ' — ' + fmt(lap.ms)}</Text>
			}
		</View>
	</View>
}
