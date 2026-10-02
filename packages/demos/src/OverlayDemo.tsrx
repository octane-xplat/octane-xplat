import { useRef, useState } from 'octane';
import { Dialog, DropdownMenu, HoverCard, Overlay, Popover, Pressable, HStack, Screen, Text, Tooltip, View, showToast, useMeasure } from '@octane-xplat/ui';

export function OverlayDemo() @{
	const [dialogOpen, setDialogOpen] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [overlayOpen, setOverlayOpen] = useState(false);
	const [popoverOpen, setPopoverOpen] = useState(false);
	const anchor = useRef<any>(null);
	const measured = useMeasure();

	<Screen className="vx-app flex-1 gap-6">
		<Text className="text-xl font-semibold">Overlay primitives</Text>
		<View className="sink-section">
			<HStack className="gap-3 flex-wrap">
				<Pressable className="btn btn-secondary" onPress={() => setDialogOpen(true)}>
					<Text>Open nested layers</Text>
				</Pressable>
				<Pressable className="btn btn-secondary" onPress={() => setOverlayOpen(true)}>
					<Text>Open shade overlay</Text>
				</Pressable>
				<View className="overlay-demo-anchor" ref={anchor}>
					<Pressable className="btn btn-secondary" onPress={() => setPopoverOpen(!popoverOpen)}>
						<Text>Toggle anchored popover</Text>
					</Pressable>
				</View>
				<HoverCard id="hoverable-demo" content={<Text>Hint card text</Text>}>
					<Pressable className="btn btn-secondary" onPress={() => {}}>
						<Text>HoverCard trigger</Text>
					</Pressable>
				</HoverCard>
				<Tooltip
					id="tooltip-demo"
					content={<Text>Saved automatically</Text>}
					trigger={<Pressable className="btn btn-secondary" onPress={() => {}}>
						<Text>Tooltip trigger</Text>
					</Pressable>}
				/>
				<Pressable className="btn btn-secondary" onPress={() => showToast({ body: 'A toast from the demo', autoHideDuration: 2500, position: 'bottomEnd' })}>
					<Text>Show toast</Text>
				</Pressable>
				<Pressable className="btn btn-secondary" onPress={() => showToast({ body: 'Top toast', autoHideDuration: 1200, position: 'topEnd' })}>
					<Text>Toast top</Text>
				</Pressable>
				<Pressable className="btn btn-secondary" onPress={() => showToast({ body: 'Anchored toast', autoHideDuration: 1200, anchor })}>
					<Text>Toast anchored</Text>
				</Pressable>
			</HStack>
		</View>
		<View className="sink-section">
			<Text className="section-label">Measure</Text>
			<View ref={measured.ref} id="measure-box" className="overlay-demo-anchor">
				<Text>Measured box</Text>
			</View>
			<Text id="measure-echo" className="text-sm text-muted">
				{measured.bounds
					? 'Bounds ' + Math.round(measured.bounds.width) + '×' + Math.round(measured.bounds.height) + ' @ ' + Math.round(measured.bounds.x) + ',' + Math.round(measured.bounds.y)
					: 'Bounds pending'}
			</Text>
		</View>
		<Dialog isOpen={dialogOpen} onOpenChange={setDialogOpen} accessibilityLabel="Nested layers">
			<Text>Open the menu. Escape requests the menu close first, then the dialog close.</Text>
			<DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} trigger={<Text>Open menu</Text>} items={[{ key: 'close', label: 'Close menu' }]} />
			<HoverCard content={<Text>Escape closes this card before the dialog.</Text>}>
				<Pressable onPress={() => {}}><Text>Hover or tap for a card</Text></Pressable>
			</HoverCard>
			<Pressable onPress={() => { setMenuOpen(false); setDialogOpen(false); }}><Text>Close dialog</Text></Pressable>
		</Dialog>
		<Popover anchor={anchor} open={popoverOpen} placement="bottom" className="overlay-demo-popover" onDismiss={() => setPopoverOpen(false)}>
			<Text>Anchored to the button</Text>
		</Popover>
		@if (overlayOpen) {
		<Overlay open={overlayOpen} shadeCover accessibilityLabel="Overlay demo" onDismiss={() => setOverlayOpen(false)}>
			<View className="overlay-demo-card">
				<Text className="text-xl font-bold">Overlay is open</Text>
				<Text>Tap outside or close it below.</Text>
				<Pressable className="btn bg-primary" onPress={() => setOverlayOpen(false)}>
					<Text className="text-onprimary">Close overlay</Text>
				</Pressable>
			</View>
		</Overlay>
		}
	</Screen>
}
