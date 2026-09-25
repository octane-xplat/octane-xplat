import { useEffect } from 'octane';
import { Screen, View, Row, Text, Pressable } from '@octane-xplat/ui';
import { DEMOS, RENDER, setLastDemo } from '@xplat/demos';
import { goBack } from '../../platform/nav';
import { openSheet } from '../../platform/sheet';

/** demo/:id route — pushed via navigate('demo/:id', {id}): a fresh Page +
 *  Octane root on native (context doesn't cross; the store does); a real
 *  /demos/demo/<id> path on web. "In sheet" re-mounts the same component
 *  inside the RootLayout sheet root — same demo, third root. */
export function DemoDetail(props: { id?: string; _stack?: string }) @{
	const id = props.id ?? 'counter';
	const title = DEMOS.find((d) => d.id === id)?.title ?? id;
	const renderDemo = RENDER[id] ?? RENDER.counter;

	useEffect(() => { setLastDemo(id); }, []);

	<Screen className="vx-app flex-1 gap-6">
		<Row className="gap-4 items-center">
			{/* _stack is injected by navigate(...,{into}) — pop the stack that
			    pushed this page (parallel stacks: several Frames alive). */}
			<Pressable id="demo-back" onPress={() => goBack({ into: props._stack })} className="btn btn-secondary">
				<Text>← Back</Text>
			</Pressable>
			<Text className="text-xl font-semibold flex-1">{title}</Text>
			<Pressable
				id="demo-sheet"
				onPress={() => { openSheet(renderDemo); console.log('[probe] sheet demo=' + id); }}
				className="btn btn-secondary"
			>
				<Text>In sheet</Text>
			</Pressable>
		</Row>
		<View className="flex-1">
			{renderDemo()}
		</View>
	</Screen>
}
