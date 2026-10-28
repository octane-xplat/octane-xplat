/** @jsxImportSource @octane-xplat/jsx */
import { Pressable, Text } from '@octane-xplat/ui'

export function Input(props: { report: (kind: string, detail?: any) => void }) @{
	<Pressable
		id="input-target"
		className="input-target"
		onPress={() => props.report('press')}
		onPressIn={() => props.report('in')}
		onPressOut={() => props.report('out')}
		onPan={(e) => props.report('pan', { state: e.state, x: e.x, y: e.y, vx: e.vx, vy: e.vy })}
	>
		<Text>Pointer input</Text>
	</Pressable>
}
