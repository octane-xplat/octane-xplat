/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { Text, VStack } from '@octane-xplat/ui'
import { AppleSignInButton } from '../../packages/auth/src/index.macos'
import type { ProbeContext } from '../../scripts/probe/context'

export default function AppleAuthProbe() {
	const [status, setStatus] = useState('No Apple authentication requested')
	const alive = useRef(true)
	useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
	return <VStack id="apple-auth-controls" gap={2}>
		<AppleSignInButton id="apple-auth-button" onResult={(result) => { if (alive.current) setStatus(result.status) }} />
		<Text>{status}</Text>
		<Text>Manual native qualification only. A signed App ID, Sign in with Apple entitlement and matching profile are required. Cancel, switch app windows, close the initiating window and retry. Backend verification and real account/credential-state behavior remain separate.</Text>
		<Text>No sign-in on mount. Only status is displayed; credentials, user identity, tokens and native error text are not logged or rendered. Leaving this screen alone does not cancel the controller.</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('apple-auth-controls'))
	ctx.record('qualification', 'Controls mounted only; no Apple consent, callback, entitlement or credential exchange exercised')
}
