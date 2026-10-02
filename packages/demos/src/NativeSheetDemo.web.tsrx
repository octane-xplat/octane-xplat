import { useRef, useState } from 'octane'
import { Heading, Pressable, Text, View } from '@octane-xplat/ui'
import { BottomSheet } from '@octane-xplat/sheet/web'

/** Demonstrates the web bottom-sheet contract. */
export function NativeSheetDemo() @{
	const [open, setOpen] = useState(false)
	const trigger = useRef<HTMLElement | null>(null)

	<View className="controls-demo gap-4">
		<Heading>Web bottom sheet</Heading>
		<Pressable
			id="native-sheet-open"
			bind={(element) => { trigger.current = element }}
			className="rounded-lg border border-slate-300 p-4"
			onPress={() => setOpen(true)}
		>
			<Text>Open the More sheet</Text>
		</Pressable>
		<Text>{`Sheet: ${open ? 'open' : 'closed'}`}</Text>
		<BottomSheet
			id="native-sheet"
			label="More actions"
			finalFocusRef={trigger}
			open={open}
			onDismissed={() => setOpen(false)}
			content={() => (
				<View className="gap-3 p-5">
					<Heading>More</Heading>
					<Pressable className="rounded-lg border border-slate-300 p-3" onPress={() => setOpen(false)}>
						<Text>Close from inside</Text>
					</Pressable>
				</View>
			)}
		/>
	</View>;
}
