/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Text, TextInput, VStack } from '@octane-xplat/ui'
import { webBrowser } from '@octane-xplat/web-browser'
import type { ProbeContext } from '../../../../scripts/probe/context'
export default function BrowserServiceProbe() {
	const [address, setAddress] = useState(''), [result, setResult] = useState('No browser requested')
	return <VStack id="browser-service-controls" gap={2}>
		<Text>Native in-app browser bridge: {webBrowser.supported ? 'available' : 'unavailable'}</Text>
		<TextInput label="HTTP(S) address" value={address} onChange={setAddress} />
		<Button label="Open in-app browser" isDisabled={!address || !webBrowser.supported} clickAction={async () => setResult((await webBrowser.openBrowser(address)).type)} />
		<Button label="Dismiss browser" clickAction={() => { webBrowser.dismissBrowser(); setResult('Dismiss requested') }} />
		<Text>{result}</Text>
		<Text>Manual native qualification only. No window/network opens until requested. Verify presentation, navigation/history, failed load/reload, redirects/new-window links, close/replacement, off-app isolation, VoiceOver and resource cleanup separately. Bridge availability and opened do not prove page load.</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('browser-service-controls'))
	ctx.record('qualification', 'Browser controls mounted; no browser or network requested')
}
