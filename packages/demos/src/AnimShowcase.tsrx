import { useState } from 'octane';
import { View, Row, Text, Pressable } from '@xplat/ui';

const MODES = ['pulse', 'spin', 'slide'] as const;
type Mode = (typeof MODES)[number];

/** css-animation-showcase — the keyframes path (decision #22: no transitions,
 *  keyframes only; ~12 animatable props in the NS∩web set).
 *  Proves: className toggling starts/stops CSS animations on both targets —
 *  pulse (opacity+scale), spin (rotate), slide (translate, fill-mode
 *  forwards so the end state persists). Classes live in demo.css. */
export function AnimShowcase() @{
	const [active, setActive] = useState<Mode | ''>('');

	<View className="vx-app flex-1 gap-4 items-center">
		<Row className="gap-4">
			@for (const m of MODES; key m) {
				<Pressable
					id={'anim-' + m}
					onPress={() => setActive(active === m ? '' : m)}
					className={['btn', active === m ? 'bg-primary' : 'btn-dim']}
				>
					<Text className="text-onprimary">{m}</Text>
				</Pressable>
			}
		</Row>
		<View className={['demo-anim-box', active ? 'anim-' + active : '']} />
		<Text>{'active: ' + (active || 'none')}</Text>
	</View>
}
