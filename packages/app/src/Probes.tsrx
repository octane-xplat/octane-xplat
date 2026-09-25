import { useState } from 'octane';
import { View, Row, Text, Pressable, styled, useThemeScheme } from '@octane-xplat/ui';
import { probeSignal$ } from './probe-state';
import 'octane/signals';

// styled() seam (Exp 16): variant prop → class composition, CSS-backed.
const DangerBtn = styled(Pressable, { base: 'btn', variants: { danger: 'bg-danger' } });

/** Probes section — regression instrumentation, kept off the familiar demo
 *  surface. Each row pokes one seam; the muted text is the live readout. */
export function Probes() @{
	const [count, setCount] = useState(0);
	// multi-indicator proves a child mounted post-commit lands inside the
	// host — it mounts when the effective scheme flips dark.
	const dark = useThemeScheme() === 'dark';

	<View className="gap-6">
		<View className="sink-section">
			<Text className="section-label">Multi-child host</Text>
			{/* Multi-child Pressable regression — the old contentview host
			    kept only the last child. */}
			<Pressable id="multi-pressable" onPress={() => setCount(count + 1)} className="btn btn-secondary">
				<Row className="gap-2 items-center">
					<Text>Multi</Text>
					<View id="multi-sibling" className="rounded-full" style={{ width: 8, height: 8, backgroundColor: '#22c55e' }} />
					@if (dark) {
						<View id="multi-indicator" className="rounded-full" style={{ width: 8, height: 8, backgroundColor: '#facc15' }} />
					}
				</Row>
			</Pressable>
			<Text id="probe-count" className="text-sm text-muted">{'Count: ' + count}</Text>
		</View>

		<View className="sink-section">
			<Text className="section-label">Ambient signal</Text>
			<Text id="sig-probe" className="text-sm text-muted">{probeSignal$.get() as string}</Text>
			<Pressable className="btn btn-secondary" onPress={() => probeSignal$.set(probeSignal$.get() === 'sig-off' ? 'sig-on' : 'sig-off')}>
				<Text>Toggle signal</Text>
			</Pressable>
		</View>

		<View className="sink-section">
			<Text className="section-label">styled()</Text>
			<DangerBtn id="danger-btn" danger className="extra">
				<Text className="text-onprimary">styled</Text>
			</DangerBtn>
		</View>
	</View>
}
