import { useRef, useState } from 'octane';
import { Overlay, Popover, Pressable, Screen, Text, View, showToast } from '@octane-xplat/ui';

export function OverlayDemo() @{
	const [overlayOpen, setOverlayOpen] = useState(false);
	const [popoverOpen, setPopoverOpen] = useState(false);
	const anchor = useRef<any>(null);

	<Screen className="vx-app flex-1 gap-4">
		<Text className="text-xl font-bold">Overlay primitives</Text>
		<Pressable className="btn bg-primary" onPress={() => setOverlayOpen(true)}>
			<Text className="text-onprimary">Open shade overlay</Text>
		</Pressable>
		<View className="overlay-demo-anchor" bind={(view) => { anchor.current = view; }}>
			<Pressable className="btn bg-primary" onPress={() => setPopoverOpen(!popoverOpen)}>
				<Text className="text-onprimary">Toggle anchored popover</Text>
			</Pressable>
		</View>
		<Popover anchor={anchor} open={popoverOpen} placement="bottom" className="overlay-demo-popover">
			<Text>Anchored to the button</Text>
		</Popover>
		<Pressable className="btn btn-dim" onPress={() => showToast('A toast from the demo', { duration: 2500, position: 'bottom' })}>
			<Text className="text-onprimary">Show toast</Text>
		</Pressable>
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
