// Port of upstream CommandPalette/CommandPalettePickerMode.tsx (Astryx 0.6.4, MIT).
import { useMemo, useState } from 'octane'
import { CommandPalette, createStaticSource, Icon, Text } from '@octane-xplat/ui'

export function CommandPalettePickerMode() @{
	const [theme, setTheme] = useState('light')
	const source = useMemo(
		() =>
			createStaticSource([
				{ id: 'light', label: 'Light' },
				{ id: 'dark', label: 'Dark' },
				{ id: 'system', label: 'System' },
			]),
		[],
	)
	<CommandPalette
		open
		onOpenChange={() => {}}
		searchSource={source}
		value={theme}
		onValueChange={setTheme}
		renderItem={(item: { label: string }, isSelected: boolean) => (
			<>
				<Text type="body" style={{ flex: 1 }}>{item.label}</Text>
				{isSelected && <Icon name="xplat-check" size={16} />}
			</>
		)}
	/>
}
