// Port of upstream Switch/SwitchSettingsPanel.tsx (Astryx 0.6.4, MIT).
import { Switch, Card, VStack } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SwitchSettingsPanel() @{
	const [notifications, setNotifications] = useState(false)
	const [darkMode, setDarkMode] = useState(true)
	const [autoSave, setAutoSave] = useState(false)
	<Card width="100%" style={{maxWidth: 300}}>
		<VStack gap={4}>
			<Switch label="Enable notifications" value={notifications} onChange={setNotifications} labelPosition="start" labelSpacing="spread" />
			<Switch label="Dark mode" value={darkMode} onChange={setDarkMode} labelPosition="start" labelSpacing="spread" />
			<Switch label="Auto-save" value={autoSave} onChange={setAutoSave} labelPosition="start" labelSpacing="spread" />
		</VStack>
	</Card>
}
