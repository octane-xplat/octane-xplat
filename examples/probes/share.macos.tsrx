/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { Button, Text, VStack } from '@octane-xplat/ui'
import { share } from '../../packages/share/src/index.macos'
import { files } from '../../packages/files/src/index.macos'
import type { FileRef } from '../../packages/files/src/types'
import type { ProbeContext } from '../../scripts/probe/context'

export default function ShareProbe() {
	const [result, setResult] = useState('No sharing requested')
	const [ready, setReady] = useState(false)
	const [busy, setBusy] = useState(false)
	const alive = useRef(true), generation = useRef(0), working = useRef(false)
	const file = useRef<FileRef | null>(null)
	useEffect(() => {
		alive.current = true
		return () => {
			alive.current = false; generation.current++
			// A selected native service may still need the file. Keep it until
			// its promise completes, even after this screen leaves.
			if (!working.current && file.current) { files.release(file.current); file.current = null }
		}
	}, [])
	const run = async (action: 'prepare' | 'file' | 'text' | 'url') => {
		if (working.current) return
		working.current = true; setBusy(true)
		const own = ++generation.current
		try {
			if (action === 'prepare') {
				const next = await files.writeText('share-check.txt', 'AppKit local-file sharing fixture')
				if (file.current) files.release(file.current)
				file.current = next
				if (alive.current && own === generation.current) { setReady(true); setResult('File ready; choose Share prepared file separately') }
			} else {
				const outcome = await (action === 'text' ? share.text('AppKit sharing check', 'Subject check') : action === 'url' ? share.url('https://example.com', 'Example link') : file.current ? share.file(file.current.uri) : Promise.resolve('unavailable'))
				if (alive.current && own === generation.current) setResult(outcome)
			}
		} catch { if (alive.current && own === generation.current) setResult('Operation failed') }
		finally {
			working.current = false
			if (alive.current) setBusy(false)
			else if (file.current) { files.release(file.current); file.current = null }
		}
	}
	return <VStack id="share-controls" gap={2}>
		<Button label="Share text" isDisabled={busy} clickAction={() => run('text')} />
		<Button label="Share URL" isDisabled={busy} clickAction={() => run('url')} />
		<Button label="Prepare local file" isDisabled={busy} clickAction={() => run('prepare')} />
		<Button label="Share prepared file" isDisabled={busy || !ready} clickAction={() => run('file')} />
		<Text>{result}</Text>
		<Text>Manual qualification: cancel the picker and service, complete a service, close the presenting window, test subjects, file URLs, keyboard/VoiceOver and supported macOS. Shared is a service callback, not recipient delivery proof.</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('share-controls'))
	ctx.record('qualification', 'Controls mounted only; no file write, picker, service or delivery exercised')
}
