/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { Button, Text, VStack } from '@octane-xplat/ui'
import { authSession } from '@octane-xplat/platform'
import type { ProbeContext } from '../../scripts/probe/context'

// example.com is a cancellation/presenter fixture, not an OAuth provider.
// For success qualification, substitute an app-owned backend with a registered,
// single-use attempt and verify state/PKCE/nonce at that backend separately.
const startUrl = 'https://example.com'
const callbackScheme = 'xplat-auth-probe'
export default function AuthSessionProbe() {
	const [result, setResult] = useState('No auth session requested')
	const alive = useRef(true), generation = useRef(0)
	useEffect(() => { alive.current = true; return () => { alive.current = false; generation.current++ } }, [])
	const start = async () => {
		const own = ++generation.current
		try {
			const outcome = await authSession.open(startUrl, { callbackScheme, prefersEphemeralSession: true })
			// Never display/log an authentication callback URL or token.
			if (alive.current && own === generation.current) setResult(outcome.type)
		} catch { if (alive.current && own === generation.current) setResult('unavailable') }
	}
	return <VStack id="auth-session-controls" gap={2}>
		<Button label="Open cancellation fixture" isDisabled={!authSession.supported} clickAction={start} />
		<Text>{result}</Text>
		<Text>No session on mount. Manually cancel, switch app windows, close the initiating window and retry. example.com cannot complete sign-in; it tests cancellation/presentation only. Leaving this screen alone does not cancel native UI.</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('auth-session-controls'))
	ctx.record('qualification', 'Controls mounted only; no authentication browser, permission, callback or credentials exercised')
}
