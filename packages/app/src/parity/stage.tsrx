import { useEffect } from 'octane';
import { View, Text } from '@octane-xplat/ui';
import { FIXTURES } from './fixtures.tsrx';
import { installParityDump } from './measure';

/** Parity stage — every fixture in a fixed 220×64 box so measured geometry
 *  is comparable across targets (px ≡ dip after the native css rewrite).
 *  Elements are dumped relative to their .parity-box, so label metrics and
 *  scroll position can't shift the numbers. */
export function ParityStage() @{
	useEffect(() => {
		installParityDump();
	}, []);

	<View id="parity-stage" className="parity-stage">
		@for (const f of FIXTURES; key f.name) {
			<View id={'cell-' + f.name} className="parity-cell">
				<Text className="parity-label">{f.name}</Text>
				<View className="parity-box">{f.render()}</View>
			</View>
		}
	</View>
}
