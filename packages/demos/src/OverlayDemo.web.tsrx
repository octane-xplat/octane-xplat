import { useRef, useState } from 'octane';
import { Overlay, Popover, Pressable, Row, Screen, Text, View, showToast, useMeasure } from '@octane-xplat/ui';
import { Hoverable } from '@octane-xplat/ui/web';

export function OverlayDemo() @{
	const [overlayOpen, setOverlayOpen] = useState(false);
	const [popoverOpen, setPopoverOpen] = useState(false);
	const anchor = useRef<any>(null);
	const measured = useMeasure();

	<Screen className="vx-app flex-1 gap-6">
		<Text className="text-xl font-semibold">Overlay primitives</Text>
		<View className="sink-section">
			<Row className="gap-3 flex-wrap">
				<Pressable className="btn btn-secondary" onPress={() => setOverlayOpen(true)}>
					<Text>Open shade overlay</Text>
				</Pressable>
				<View className="overlay-demo-anchor" bind={(view) => { anchor.current = view; }}>
					<Pressable className="btn btn-secondary" onPress={() => setPopoverOpen(!popoverOpen)}>
						<Text>Toggle anchored popover</Text>
					</Pressable>
				</View>
				<Hoverable card={<Text>Hint card text</Text>}>
					<Pressable className="btn btn-secondary" onPress={() => {}}>
						<Text>Hoverable trigger</Text>
					</Pressable>
				</Hoverable>
				<Pressable className="btn btn-secondary" onPress={() => showToast('A toast from the demo', { duration: 2500, position: 'bottom' })}>
					<Text>Show toast</Text>
				</Pressable>
				<Pressable className="btn btn-secondary" onPress={() => showToast('Top toast', { duration: 1200, position: 'top' })}>
					<Text>Toast top</Text>
				</Pressable>
				<Pressable className="btn btn-secondary" onPress={() => showToast('Anchored toast', { duration: 1200, anchor })}>
					<Text>Toast anchored</Text>
				</Pressable>
			</Row>
		</View>
		<View className="sink-section">
			<Text className="section-label">Measure</Text>
			<View bind={measured.bind} id="measure-box" className="overlay-demo-anchor">
				<Text>Measured box</Text>
			</View>
			<Text id="measure-echo" className="text-sm text-muted">
				{measured.bounds
					? 'Bounds ' + Math.round(measured.bounds.width) + '×' + Math.round(measured.bounds.height) + ' @ ' + Math.round(measured.bounds.x) + ',' + Math.round(measured.bounds.y)
					: 'Bounds pending'}
			</Text>
		</View>
		<Popover anchor={anchor} open={popoverOpen} placement="bottom" className="overlay-demo-popover">
			<Text>Anchored to the button</Text>
		</Popover>
		<Overlay open={overlayOpen} shadeCover onDismiss={() => setOverlayOpen(false)}>
			<View className="overlay-demo-card">
				<Text className="text-xl font-bold">Overlay is open</Text>
				<Text>Tap outside or close it below.</Text>
				<Pressable className="btn bg-primary" onPress={() => setOverlayOpen(false)}>
					<Text className="text-onprimary">Close overlay</Text>
				</Pressable>
			</View>
		</Overlay>
	</Screen>
}
