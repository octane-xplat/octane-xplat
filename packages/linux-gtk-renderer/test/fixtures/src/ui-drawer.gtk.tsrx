/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Drawer, Text, View } from '@octane-xplat/ui'

export function DrawerProbe() @{
	const [open, setOpen] = useState(false)
	const [mark, setMark] = useState('none')
	const [mainClicks, setMainClicks] = useState(0)

	<View style={{ flexDirection: 'column' }}>
		<Button id="dr-open" label="OpenDrawer" clickAction={() => setOpen(true)} />
		<Text id="picked">{mark}</Text>
		<Text id="main-count">{String(mainClicks)}</Text>
		<Drawer
			open={open}
			onDismiss={() => {
				setOpen(false)
				setMark('dismissed')
			}}
			main={
				<View style={{ flexDirection: 'column', height: '100%' }}>
					<Button id="dr-main-btn" label="Main" clickAction={() => setMainClicks(mainClicks + 1)} />
				</View>
			}
			drawer={
				<View style={{ flexDirection: 'column' }}>
					<Text>drawer-panel-label</Text>
					<Button id="dr-item" label="Item" clickAction={() => setMark('item')} />
				</View>
			}
		/>
		<Drawer
			defaultOpen={true}
			main={<View />}
			drawer={
				<View style={{ flexDirection: 'column' }}>
					<Text>unctl-panel-label</Text>
				</View>
			}
		/>
	</View>
}
