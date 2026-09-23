import { useState, memo } from 'octane';
import { View, Row, Text, Pressable } from '@xplat/ui';

function ProbeChild(props: { name: string; n: number }) @{
	console.log('[probe] child ' + props.name + ' render n=' + props.n);
	<Row className="gap-2 items-center">
		<Text className="chip">{props.name}</Text>
		<Text>{'n=' + props.n}</Text>
	</Row>
}

const MemoChild = memo(ProbeChild, (a, b) => a.n === b.n && a.name === b.name);

/** reactive-nested-probe — reactivity granularity, read via console.
 *  Proves: which children re-commit when one state slice changes, and
 *  whether memo() actually gates re-renders in shared user code (the
 *  runtime uses it internally for List/Tabs — this is the first
 *  user-level memo on both targets). Expected: bump-a re-renders
 *  plain-a + memo-a + parent; plain-b re-render = per-render granularity
 *  missing; memo-b re-render = memo broken. */
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
		<Text className="cell">Watch [probe] logs: bumping A should not render *-b children.</Text>
	</View>
}
