/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import { Button, ToggleButton, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

export default function ToggleSaveProbe() {
	const [status, setStatus] = useState('Idle')
	const pending = useRef<{ resolve(): void; reject(error: unknown): void } | null>(null)
	return <VStack gap={2}>
		<ToggleButton id="toggle-pin" label="Pin" testID="toggle.pin"
			pressedChangeAction={() => { setStatus('Saving'); return new Promise<void>((resolve, reject) => { pending.current = { resolve, reject } }) }}
			onActionError={() => setStatus('Failed; optimistic state retained')} />
		<Button id="toggle-save" label="Complete save" clickAction={() => {
			const task = pending.current; pending.current = null; task?.resolve(); setStatus('Saved')
		}} />
		<Button id="toggle-fail" label="Fail save" clickAction={() => {
			const task = pending.current; pending.current = null; task?.reject(new Error('Save failed'))
		}} />
		<label id="toggle-status" text={status} />
	</VStack>
}

// Direct action dispatch only; this does not prove OS mouse/keys, hit-testing or VoiceOver.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('toggle-pin'))
	await ctx.press('toggle-pin')
	await ctx.waitFor(() => ctx.find('toggle-status')?.stringValue === 'Saving')
	ctx.assert('native pressed value', Number(ctx.find('toggle-pin').accessibilityValue), 1)
	await ctx.press('toggle-save')
	await ctx.waitFor(() => ctx.find('toggle-status')?.stringValue === 'Saved')
	ctx.record('save path', 'direct handler and native value lookup only')
}
