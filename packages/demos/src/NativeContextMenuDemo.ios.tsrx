/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane'
import { Heading, Text, View } from '@octane-xplat/ui'
import { SwiftUIContextMenu } from '@octane-xplat/context-menu/ios'

const ITEMS = [
	{ id: 'reply', title: 'Reply' },
	{ id: 'share', title: 'Share' },
	{ id: 'copy', title: 'Copy link' },
	{ id: 'report', title: 'Report', destructive: true, divider: true },
	{ id: 'blocked', title: 'Unavailable action', disabled: true },
]

/** Demonstrates the SwiftUI .contextMenu + hosted-trigger contract. */
export function NativeContextMenuDemo() @{
	const [last, setLast] = useState('none')

	<View className="controls-demo gap-4">
		<Heading>SwiftUI context menu</Heading>
		<Text>Long-press the card below</Text>
		<SwiftUIContextMenu
			id="native-context-menu-post"
			items={ITEMS}
			onItemSelected={setLast}
			trigger={() => (
				<View className="rounded-lg border border-slate-300 p-4">
					<Text>Post card — hold for actions</Text>
				</View>
			)}
			preview={() => (
				<View className="rounded-lg border border-slate-300 p-4">
					<Text>Post preview</Text>
				</View>
			)}
		/>
		<Text>{`Last action: ${last}`}</Text>
	</View>;
}
