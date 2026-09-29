/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane'
import { Heading, Pressable, Text, View } from '@octane-xplat/ui'
import { SwiftUIBottomSheet } from '@octane-xplat/sheet/ios'

/** Demonstrates the SwiftUI .sheet + hosted-content contract. */
export function NativeSheetDemo() @{
	const [open, setOpen] = useState(false)

	<View className="controls-demo gap-4">
		<Heading>SwiftUI bottom sheet</Heading>
		<Pressable
			id="native-sheet-open"
			className="rounded-lg border border-slate-300 p-4"
			onPress={() => setOpen(true)}
		>
			<Text>Open the More sheet</Text>
		</Pressable>
		<Text>{`Sheet: ${open ? 'open' : 'closed'}`}</Text>
		<SwiftUIBottomSheet
			id="native-sheet"
			open={open}
			onDismissed={() => setOpen(false)}
			detents={['medium', 'large']}
			showDragIndicator={true}
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
