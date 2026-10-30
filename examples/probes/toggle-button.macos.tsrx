/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import { Button, ToggleButton, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
import { axAttr } from '../../scripts/probe/appkit-input'

export default function ToggleSaveProbe() {
	const [status, setStatus] = useState('Idle')
	const [controlled, setControlled] = useState(false), [pressed, setPressed] = useState(false)
	const [accept, setAccept] = useState(true)
	const pending = useRef<{ resolve(): void; reject(error: unknown): void } | null>(null)
	return <VStack gap={2}>
		<ToggleButton id="toggle-pin" label="Pin" testID="toggle.pin"
			isPressed={controlled ? pressed : undefined}
			onPressedChange={(next) => { if (controlled && accept) setPressed(next) }}
			pressedChangeAction={() => { setStatus('Saving'); return new Promise<void>((resolve, reject) => { pending.current = { resolve, reject } }) }}
			onActionError={() => setStatus('Failed; optimistic state retained')} />
		<Button id="toggle-save" label="Complete save" clickAction={() => {
			const task = pending.current; pending.current = null; task?.resolve(); setStatus('Saved')
		}} />
		<Button id="toggle-fail" label="Fail save" clickAction={() => {
			const task = pending.current; pending.current = null; task?.reject(new Error('Save failed'))
		}} />
		<Button label="Toggle controlled mode" clickAction={() => setControlled((value) => !value)} />
		<Button label="Toggle controlled parent value" clickAction={() => setPressed((value) => !value)} />
		<Button label="Toggle controlled request acceptance" clickAction={() => setAccept((value) => !value)} />
		<label text={`mode:${controlled ? 'controlled' : 'local'}; parent:${pressed}; accept:${accept}`} />
		<label id="toggle-status" text={status} />
	</VStack>
}

// Direct action dispatch only; this does not prove OS mouse/keys, hit-testing or VoiceOver.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('toggle-pin'))
	await ctx.press('toggle-pin')
	await ctx.waitFor(() => ctx.find('toggle-status')?.stringValue === 'Saving')
	ctx.assert('native pressed value', Number(axAttr(ctx.find('toggle-pin'), 'accessibilityValue')), 1)
	await ctx.press('toggle-save')
	await ctx.waitFor(() => ctx.find('toggle-status')?.stringValue === 'Saved')
	ctx.record('save path', 'direct handler and native value lookup only')
}
