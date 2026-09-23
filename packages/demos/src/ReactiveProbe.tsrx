import { useState, memo } from 'octane';
import { View, Row, Text, Pressable } from '@xplat/ui';

// Module-scope render ledger — a mutation during render, deliberate for a
// probe: the text the tree carries IS the observation channel.
const renderCounts = new Map<string, number>();

function ProbeChild(props: { name: string; n: number }) @{
	const renders = (renderCounts.get(props.name) ?? 0) + 1;
	renderCounts.set(props.name, renders);
	console.log('[probe] child ' + props.name + ' render n=' + props.n + ' renders=' + renders);
	<Row className="gap-2 items-center">
		<Text className="chip">{props.name}</Text>
		<Text>{props.name + ' n=' + props.n + ' renders=' + renders}</Text>
	</Row>
}

const MemoChild = memo(ProbeChild, (a, b) => a.n === b.n && a.name === b.name);

/** reactive-nested-probe — reactivity granularity, read from the tree.
 *  Proves: which children re-commit when one state slice changes, and
 *  whether memo() actually gates re-renders in shared user code (the
 *  runtime uses it internally for List/Tabs — this is the first
 *  user-level memo on both targets). Read the renders= counters:
 *  - memo-b must stay renders=1 after any bump (hard invariant)
 *  - plain-b renders=1 → per-child prop diffing; renders=2 → coarse
 *    re-render of siblings
 *  - renders staying 1 while n= text updates → fine-grained binding,
 *    the component body didn't re-run at all. */
export function ReactiveProbe() @{
	const [a, setA] = useState(0);
	const [b, setB] = useState(0);
	console.log('[probe] ReactiveProbe render a=' + a + ' b=' + b);
	<View className="vx-app flex-1 gap-4">
		<Row className="gap-4">
			<Pressable id="rp-a" onPress={() => setA(a + 1)} className="btn bg-primary">
				<Text className="text-onprimary">Bump A</Text>
			</Pressable>
			<Pressable id="rp-b" onPress={() => setB(b + 1)} className="btn bg-primary">
				<Text className="text-onprimary">Bump B</Text>
			</Pressable>
		</Row>
		<ProbeChild name="plain-a" n={a} />
		<ProbeChild name="plain-b" n={b} />
		<MemoChild name="memo-a" n={a} />
		<MemoChild name="memo-b" n={b} />
		<Text className="cell">renders= counters say who re-ran per bump — see logs.</Text>
	</View>
}
