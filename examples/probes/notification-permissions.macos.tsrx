/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { Button, Text, VStack } from '@octane-xplat/ui'
import { notifications } from '../../packages/notifications/src/index.macos'
import type { ProbeContext } from '../../scripts/probe/context'
export default function NotificationPermissionsProbe() {
	const [result, setResult] = useState('No status read or notification requested')
	const alive = useRef(true), generation = useRef(0)
	useEffect(() => { alive.current = true; return () => { alive.current = false; generation.current++ } }, [])
	const run = async (action: 'read' | 'request' | 'send') => {
		const own = ++generation.current
		try {
			const permission = action === 'request' ? await notifications.requestPermissions() : await notifications.getPermissions()
			if (!alive.current || own !== generation.current) return
			if (action === 'send' && permission.granted) { notifications.notify('AppKit permission check', 'Explicit test send'); setResult('Send requested; delivery unverified') }
			else setResult(JSON.stringify(permission))
		} catch { if (alive.current && own === generation.current) setResult('Operation failed') }
	}
	return <VStack id="notification-permission-controls" gap={2}>
		<Text>Bridge capability: {notifications.supported ? 'available' : 'unavailable'}. No permission read, request or delivery occurs on mount.</Text>
		<Button label="Read permission without prompting" clickAction={() => run('read')} />
		<Button label="Request notification permission" isDisabled={!notifications.supported} clickAction={() => run('request')} />
		<Button label="Request test notification if granted" isDisabled={!notifications.supported} clickAction={() => run('send')} />
		<Text>{result}</Text>
		<Text>Manual native qualification only. Verify first-launch reads do not prompt, explicit requests, declined/revoked access, relaunch, foreground/background presentation and bundle/signing behavior separately.</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('notification-permission-controls'))
	ctx.record('qualification', 'Controls mounted only; permission read/request and delivery have not been executed')
}
