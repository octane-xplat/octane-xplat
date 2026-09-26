import { useState } from 'octane';
import { View, Row, Text, Pressable, styled, useThemeScheme, Meter, useMeasure, useModalRoute, openWindow } from '@octane-xplat/ui';
import { Hoverable } from '@octane-xplat/ui/web';
import { probeSignal$ } from './probe-state';
import { navigate } from './platform/nav';
import 'octane/signals';

// styled() seam (Exp 16): variant prop → class composition, CSS-backed.
const DangerBtn = styled(Pressable, { base: 'btn', variants: { danger: 'bg-danger' } });

/** Probes section — regression instrumentation, kept off the familiar demo
 *  surface. Each row pokes one seam; the muted text is the live readout.
 *  Web leaf: Hoverable is web-only (ui/web) — the shared/native leaf drops
 *  that probe. */
export function Probes() @{
	const [count, setCount] = useState(0);
	// multi-indicator proves a child mounted post-commit lands inside the
	// host — it mounts when the effective scheme flips dark.
	const dark = useThemeScheme() === 'dark';
	const bounds = useMeasure();
	const modalRoute = useModalRoute();

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

		<View className="sink-section">
			<Text className="section-label">Feedback</Text>
			<Row className="gap-4 items-center">
				{/* Meter ring tracks the probe count (wraps at max). */}
				<Meter id="meter" value={count % 6} max={5} size={40} />
				{/* Hoverable: delayed hover-intent card — web-only surface. */}
				<Hoverable
					card={<View className="overlay-demo-card"><Text className="text-sm">Hover card</Text></View>}
					placement="top"
				>
					<Text className="text-sm">Hover me</Text>
				</Hoverable>
			</Row>
		</View>

		{/* useMeasure seam: bind reports live bounds (ResizeObserver on web,
		    layout listener on native). */}
		<View className="sink-section">
			<Text className="section-label">Measure</Text>
			<View bind={bounds.bind} className="panbox" style={{ padding: 12 }}>
				<Text className="text-sm text-muted">
					{bounds.bounds ? Math.round(bounds.bounds.width) + '×' + Math.round(bounds.bounds.height) : 'unmeasured'}
				</Text>
			</View>
		</View>

		<View className="sink-section">
			<Text className="section-label">Routing</Text>
			<Row className="gap-3 flex-wrap items-center">
				<Pressable id="guarded-btn" className="btn btn-secondary" onPress={() => navigate('private')}>
					<Text>Guarded →</Text>
				</Pressable>
				<Pressable id="window-btn" className="btn btn-secondary" onPress={() => {
					try { openWindow(); } catch (e) { console.log('[probe] openWindow: ' + e); }
				}}>
					<Text>Open window</Text>
				</Pressable>
			</Row>
			<Text id="modal-route" className="text-sm text-muted">{'modal route: ' + (modalRoute?.name ?? 'none')}</Text>
		</View>
	</View>
}
