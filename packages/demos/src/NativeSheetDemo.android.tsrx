/** @jsxImportSource @octane-xplat/jsx */
import type { TextInputHandle } from '@octane-xplat/ui'
import { useRef, useState } from 'octane'
import { Heading, Pressable, Text, TextInput, View } from '@octane-xplat/ui'
import { MaterialBottomSheet } from '@octane-xplat/sheet/android'

/** Demonstrates the Material 3 ModalBottomSheet + hosted-content contract. */
export function NativeSheetDemo() @{
	const [open, setOpen] = useState(false)
	const editing = useRef<TextInputHandle | null>(null)
	const close = () => {
		setOpen(false)
		editing.current?.focus()
	}

	<View className="controls-demo gap-4">
		<Heading>Material bottom sheet</Heading>
		<TextInput ref={editing} placeholder="Draft outside the sheet" />
		<Pressable
			id="native-sheet-open"
			className="rounded-lg border border-slate-300 p-4"
			onPress={() => setOpen(true)}
		>
			<Text>Open the More sheet</Text>
		</Pressable>
		<Text>{`Sheet: ${open ? 'open' : 'closed'}`}</Text>
		<MaterialBottomSheet
			id="native-sheet"
			open={open}
			onDismissed={close}
			skipPartiallyExpanded={false}
			content={() => (
				<View className="gap-3 p-5">
					<Heading>More</Heading>
					<TextInput placeholder="Message in the sheet" />
					<Pressable className="rounded-lg border border-slate-300 p-3" onPress={close}>
						<Text>Close from inside</Text>
					</Pressable>
					<View className="h-6" />
				</View>
			)}
		/>
	</View>
}
