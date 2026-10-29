/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, FocusScope, Text, TextInput, VStack, useLandmark } from '@octane-xplat/ui'
import type { UseLandmarkOptions, Renderable } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
function Region(props: UseLandmarkOptions & { hidden?: boolean; empty?: boolean; children?: Renderable }) @{
	const { landmarkProps } = useLandmark(props)
	<VStack {...landmarkProps} style={{ visibility: props.hidden ? 'collapse' : 'visible', padding: 8, borderWidth: 1 }} gap={2}>
		<Text>{props.label}</Text>
		{!props.empty ? <TextInput label={`${props.label} notes`} /> : null}
		{props.children}
	</VStack>
}
export default function LandmarkProbe() @{
	const [contain, setContain] = useState(false), [hideAside, setHideAside] = useState(false), [mountAside, setMountAside] = useState(true)
	<VStack id="landmark-controls" gap={2}>
		<Text>Use F6 and Shift+F6 (Fn may be needed). Check native region order, fields/IME, nested and empty regions, hidden/unmounted rows, multiple windows and FocusScope containment. Modified F6 stays native. This runner records mounting only.</Text>
		<Button label="Outside landmark control" />
		<Region role="navigation" label="Navigation" />
		<FocusScope contain={contain} restoreFocus>
			<VStack gap={2}>
				<Button label="Toggle containment" clickAction={() => setContain(!contain)} />
				<Button label="Toggle aside visibility" clickAction={() => setHideAside(!hideAside)} />
				<Button label="Toggle aside mount" clickAction={() => setMountAside(!mountAside)} />
				<Region role="main" label="Workspace"><Region role="search" label="Nested search" /></Region>
				{mountAside ? <Region role="complementary" label="Empty aside" hidden={hideAside} empty /> : null}
			</VStack>
		</FocusScope>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('landmark-controls'))
	ctx.record('qualification', 'Controls mounted only; no native F6/focus/containment/AX proof')
}
