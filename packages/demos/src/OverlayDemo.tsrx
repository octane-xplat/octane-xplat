import { useRef, useState } from 'octane';
import { Overlay, Popover, Pressable, Row, Screen, Text, View, showToast } from '@octane-xplat/ui';

export function OverlayDemo() @{
	const [overlayOpen, setOverlayOpen] = useState(false);
	const [popoverOpen, setPopoverOpen] = useState(false);
	const anchor = useRef<any>(null);

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
				<Pressable className="btn btn-secondary" onPress={() => showToast('A toast from the demo', { duration: 2500, position: 'bottom' })}>
					<Text>Show toast</Text>
				</Pressable>
			</Row>
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
