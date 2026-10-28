/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Text, VStack } from '@octane-xplat/ui'
import { openSettings } from '@octane-xplat/platform'
import type { ProbeContext } from '../../scripts/probe/context'

export default function OpenSettingsProbe() {
	const [status, setStatus] = useState('Not requested')
	const open = async () => {
		if (!openSettings.supported || !await openSettings.isAvailable()) {
			setStatus('Unavailable')
			return
		}
		setStatus(openSettings.open() ? 'Launch request accepted' : 'Launch request failed')
	}
	return <VStack gap={2}>
		<Text>Open System Settings, then navigate to the permission you need.</Text>
		<Button id="open-system-settings" label="Open settings" clickAction={open} />
		<Text id="settings-status">{status}</Text>
	</VStack>
}

// Availability lookup only; this deliberately does not launch another app.
// Click the button only during a human-authorized native service run.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('open-system-settings'))
	ctx.record('bridge support', openSettings.supported)
	ctx.record('installed settings application', await openSettings.isAvailable())
	ctx.assert('no launch was requested', ctx.find('settings-status')?.stringValue, 'Not requested')
}
