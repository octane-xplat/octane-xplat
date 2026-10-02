import { useState } from 'octane';
import { View, HStack, Text, Pressable, NavLink, styled, useThemeScheme, Meter, useMeasure, useModalRoute, openWindow, HoverCard, Tooltip } from '@octane-xplat/ui';
import { probeSignal$ } from './probe-state';
import { navigate } from './platform/nav';
import 'octane/signals';

// styled() seam (Exp 16): variant prop → class composition, CSS-backed.
const DangerBtn = styled(Pressable, { base: 'btn', variants: { danger: 'bg-danger' } });

/** Probes section — regression instrumentation, kept off the familiar demo
 *  surface. Each row pokes one seam; the muted text is the live readout.
 *  HoverCard/Tooltip are shared now: pointer platforms (web, macOS) mount the
 *  hint layer on hover; touch leaves render the trigger only. */
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
				<HStack className="gap-2 items-center">
					<Text>Multi</Text>
					<View id="multi-sibling" className="rounded-full" style={{ width: 8, height: 8, backgroundColor: '#22c55e' }} />
					@if (dark) {
						<View id="multi-indicator" className="rounded-full" style={{ width: 8, height: 8, backgroundColor: '#facc15' }} />
					}
				</HStack>
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
			<HStack className="gap-4 items-center">
				{/* Meter ring tracks the probe count (wraps at max). */}
				<Meter id="meter" value={count % 6} max={5} size={40} />
				{/* Hover intent — real card on pointer platforms, passthrough on touch. */}
				<HoverCard
					id="hoverable-probe"
					content={<View className="overlay-demo-card"><Text className="text-sm">Hover card</Text></View>}
					placement="above"
				>
					<Text className="text-sm">Hover me</Text>
				</HoverCard>
				<Tooltip
					id="tooltip-probe"
					content={<Text className="text-sm">Tooltip text</Text>}
					placement="top"
					trigger={<Text className="text-sm">Tooltip trigger</Text>}
				/>
			</HStack>
		</View>

		{/* useMeasure seam: ref reports live bounds (ResizeObserver on web,
		    layout listener on native). */}
		<View className="sink-section">
			<Text className="section-label">Measure</Text>
			<View ref={bounds.ref} className="panbox" style={{ padding: 12 }}>
				<Text className="text-sm text-muted">
					{bounds.bounds ? Math.round(bounds.bounds.width) + '×' + Math.round(bounds.bounds.height) : 'unmeasured'}
				</Text>
			</View>
		</View>

		<View className="sink-section">
			<Text className="section-label">Routing</Text>
			<HStack className="gap-3 flex-wrap items-center">
				<Pressable id="guarded-btn" className="btn btn-secondary" onPress={() => navigate('private')}>
					<Text>Guarded →</Text>
				</Pressable>
				{/* Programmatic routes — 'guides' isn't a file route or a generated
				    RouteName; it was registered from a data array via addRoutes
				    (guides.tsrx). NavLink takes the untyped Route shape directly. */}
				<NavLink route={{ stack: 'test', name: 'guides', params: {} }} className="btn btn-secondary">
					<Text>Guides →</Text>
				</NavLink>
				<Pressable id="window-btn" className="btn btn-secondary" onPress={() => {
					try { openWindow(); } catch (e) { console.log('[probe] openWindow: ' + e); }
				}}>
					<Text>Open window</Text>
				</Pressable>
			</HStack>
			<Text id="modal-route" className="text-sm text-muted">{'modal route: ' + (modalRoute?.name ?? 'none')}</Text>
		</View>
	</View>
}
