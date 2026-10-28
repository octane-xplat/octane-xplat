/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Switch, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function SwitchProbe() {
	const [compact, setCompact] = useState(false)
	return <VStack gap={2}>
		<Switch id="alerts" label="Alerts" description="Daily summary" defaultValue width={280}
			size={compact ? 'sm' : 'md'} labelPosition={compact ? 'start' : 'end'} labelSpacing="spread"
			status={compact ? { type: 'error', message: 'Try saving again' } : undefined} />
		<Button id="switch-layout" label="Change switch metadata" clickAction={() => setCompact((value) => !value)} />
	</VStack>
}

// Initial metadata and direct handler dispatch only, not OS input/focus or pixels.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('alerts'))
	ctx.assert('switch name', String(ctx.find('alerts').accessibilityLabel), 'Alerts')
	await ctx.press('switch-layout')
	ctx.record('name after metadata update', String(ctx.find('alerts').accessibilityLabel))
}
