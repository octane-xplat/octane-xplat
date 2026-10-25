// Port of upstream Popover/PopoverSettingsPanel.tsx (Astryx 0.6.4, MIT).
import { useRef, useState } from 'octane'
import { Button, Divider, Heading, Popover, Switch, VStack } from '@octane-xplat/ui'

export function PopoverSettingsPanel() @{
	const anchor = useRef(null)
	const [isOpen, setIsOpen] = useState(false)
	const [notifications, setNotifications] = useState(true)
	const [darkMode, setDarkMode] = useState(false)
	const [sounds, setSounds] = useState(true)
	return (
		<>
			<Button ref={anchor} label="Settings" clickAction={() => setIsOpen(true)} />
			<Popover anchor={anchor} open={isOpen} onDismiss={() => setIsOpen(false)} placement="bottom" style={{ width: 280 }}>
				<VStack gap={3} style={{ padding: 'var(--spacing-4)' }}>
					<Heading level={4}>Settings</Heading>
					<Divider />
					<Switch label="Notifications" description="Receive push notifications" value={notifications} onChange={setNotifications} />
					<Switch label="Dark mode" description="Use dark color theme" value={darkMode} onChange={setDarkMode} />
					<Switch label="Sounds" description="Play sounds for actions" value={sounds} onChange={setSounds} />
				</VStack>
			</Popover>
		</>
	)
}
