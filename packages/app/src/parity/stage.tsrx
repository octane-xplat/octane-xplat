import { useEffect } from 'octane';
import { View, Text } from '@octane-xplat/ui';
import { FIXTURES } from './fixtures.tsrx';
import { installParityDump } from './measure';

const PARITY_BOX_STYLE = { width: 220, height: 64 };

/** Parity stage — every fixture in a fixed 220×64 box so measured geometry
 *  is comparable across targets (px ≡ dip after the native css rewrite).
 *  Elements are dumped relative to their .parity-box, so label metrics and
 *  scroll position can't shift the numbers. */
export function ParityStage() @{
	useEffect(() => {
		installParityDump();
	}, []);

	<View
		id="parity-stage"
		className="parity-stage"
		gap={12}
		alignItems="start"
		ios={{ iosOverflowSafeAreaEnabled: false }}
	>
		@for (const f of FIXTURES; key f.name) {
			<View id={'cell-' + f.name} className="parity-cell" gap={0} alignItems="start">
				<Text className="parity-label">{f.name}</Text>
				<View
					className={f.wide ? 'parity-box parity-box--fill' : 'parity-box'}
					style={f.height ? { ...PARITY_BOX_STYLE, height: f.height } : PARITY_BOX_STYLE}
					alignItems={f.wide ? 'stretch' : 'start'}
				>
					<{f.renderer} {...f.props} />
				</View>
			</View>
		}
	</View>
}
