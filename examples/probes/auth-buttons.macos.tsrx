/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import type { ProbeContext } from '../../scripts/probe/context'
import { Button, Text, VStack } from '@octane-xplat/ui'
import { AppleSignInButton, GoogleSignInButton } from '../../packages/auth/src/index.macos'
export default function AuthButtonsProbe() {
	const [mounted, setMounted] = useState(true), [disabled, setDisabled] = useState(false)
	const [white, setWhite] = useState(false), [status, setStatus] = useState('No button result')
	return <VStack id="auth-button-controls" gap={2}>
		<Button label="Mount/unmount provider buttons" clickAction={() => setMounted(!mounted)} />
		<Button label="Toggle disabled" clickAction={() => setDisabled(!disabled)} />
		<Button label="Change Apple theme" clickAction={() => setWhite(!white)} />
		{mounted ? <>
			<AppleSignInButton disabled={disabled} theme={white ? 'whiteOutline' : 'black'} onResult={(result) => setStatus('Apple: ' + result.status)} />
			<GoogleSignInButton disabled={disabled} onResult={(result) => setStatus('Google: ' + result.status)} />
		</> : <Text>Provider buttons unmounted</Text>}
		<Text>{status}</Text>
		<Text>Manual qualification only: Tab/keyboard, pointer, VoiceOver, pending repeats, current callbacks, disabled changes and unmount/remount. Google requires an app-configured hostedFlow; Apple requires signed entitlement/profile setup. No automatic sign-in or configuration on mount.</Text>
		<Text>Unmount suppresses button results; it does not dismiss a controller/browser already started. No credential, identity or native error is displayed.</Text>
	</VStack>
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('auth-button-controls'))
	ctx.record('qualification', 'Controls mounted only; provider action, OS keyboard/AX and async lifecycle not exercised')
}
