/** @jsxImportSource @nativescript-community/octane */
import type { TextInputHandle } from '@octane-xplat/ui'
import { useRef, useState } from 'octane'
import { Heading, Pressable, Text, TextInput, View } from '@octane-xplat/ui'
import { SwiftUIBottomSheet } from '@octane-xplat/sheet/ios'

/** Demonstrates the SwiftUI .sheet + hosted-content contract. */
export function NativeSheetDemo() @{
	const [open, setOpen] = useState(false)
	const editing = useRef<TextInputHandle | null>(null)

	<View className="controls-demo gap-4">
		<Heading>SwiftUI bottom sheet</Heading>
		<TextInput ref={editing} placeholder="Draft outside the sheet" />
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
			onDismissed={() => {
				setOpen(false)
				editing.current?.focus()
			}}
			detents={['medium', 'large']}
			showDragIndicator={true}
			content={() => (
				<View className="gap-3 p-5">
					<Heading>More</Heading>
					<TextInput placeholder="Message in the sheet" />
					<Pressable
						className="rounded-lg border border-slate-300 p-3"
						onPress={() => setOpen(false)}
					>
						<Text>Close from inside</Text>
					</Pressable>
				</View>
			)}
		/>
	</View>
}
