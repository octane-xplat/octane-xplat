import { useState } from 'octane'
import { Heading, Text, View } from '@octane-xplat/ui'
import { ContextMenu } from '@octane-xplat/context-menu/web'

const ITEMS = [
	{ id: 'reply', title: 'Reply' },
	{ id: 'share', title: 'Share' },
	{ id: 'copy', title: 'Copy link' },
	{ id: 'report', title: 'Report', destructive: true, divider: true },
	{ id: 'blocked', title: 'Unavailable action', disabled: true },
]

/** Demonstrates the web right-click context menu contract. */
export function NativeContextMenuDemo() @{
	const [last, setLast] = useState('none')

	<View className="controls-demo gap-4">
		<Heading>Web context menu</Heading>
		<Text>Right-click the card below</Text>
		<ContextMenu
			id="native-context-menu-post"
			items={ITEMS}
			onItemSelected={setLast}
			trigger={() => (
				<View className="rounded-lg border border-slate-300 p-4">
					<Text>Post card — right-click for actions</Text>
				</View>
			)}
		/>
		<Text>{`Last action: ${last}`}</Text>
	</View>;
}
