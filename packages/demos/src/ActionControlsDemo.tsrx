import { useState } from 'octane'
import { Button, ButtonGroup, ClickableCard, Heading, IconButton, MoreMenu, SelectableCard, Text, ToggleButton, ToggleButtonGroup, View } from '@octane-xplat/ui'

export function ActionControlsDemo() @{
	const [pinned, setPinned] = useState(false)
	const [view, setView] = useState<string | null>('list')
	const [selected, setSelected] = useState(false)
	const [message, setMessage] = useState('Choose an action')

	<View className="action-controls-demo gap-4">
		<Heading level={2}>Action controls</Heading>
		<ButtonGroup label="Document actions">
			<Button label="Save" variant="primary" onPress={() => setMessage('Saved')} />
			<ToggleButton label="Pin" icon="pin" isPressed={pinned} onPressedChange={setPinned} />
			<IconButton label="Share" icon="share" onPress={() => setMessage('Ready to share')} />
		</ButtonGroup>
		<ToggleButtonGroup label="View mode" value={view} onChange={setView}>
			<ToggleButton value="list" label="List" />
			<ToggleButton value="grid" label="Grid" />
		</ToggleButtonGroup>
		<MoreMenu label="More document actions" items={[
			{ key: 'duplicate', label: 'Duplicate', onSelect: () => setMessage('Duplicated') },
			{ key: 'archive', label: 'Archive', onSelect: () => setMessage('Archived') },
		]} />
		<ClickableCard label="Open collection" onPress={() => setMessage('Collection opened')}>
			<Text>Open collection</Text>
		</ClickableCard>
		<SelectableCard label="Select collection" isSelected={selected} onChange={setSelected}>
			<Text>{selected ? 'Selected collection' : 'Select collection'}</Text>
		</SelectableCard>
		<Text>{message}</Text>
	</View>
}
