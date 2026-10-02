/** @jsxImportSource @octane-xplat/macos-renderer */
import { Screen, Text, Pressable } from '@octane-xplat/ui'
import { goBack } from '../platform/nav'

/** The motion package's gesture/reduced-motion hosts are mobile-only. */
export function MotionProbe() @{
	<Screen className="vx-app flex-1 gap-3">
		<Pressable id="motion-probe-back" onPress={() => goBack({ into: 'test' })} className="chip">
			<Text>← Back</Text>
		</Pressable>
		<Text>Motion v1 checks are unsupported by the AppKit host</Text>
		<Text>Use the maintained AppKit animation fixture to check UI ref animation.</Text>
	</Screen>
}
