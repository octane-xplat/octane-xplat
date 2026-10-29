/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import { Button, Text, TextInput, VStack } from '@octane-xplat/ui'
import { Video, type VideoFit, type VideoHandle } from '@octane-xplat/video'
import type { ProbeContext } from '../../scripts/probe/context'

export default function VideoProbe() {
	const player = useRef<VideoHandle | null>(null)
	const [draft, setDraft] = useState(''), [source, setSource] = useState(''), [shown, setShown] = useState(true)
	const [controls, setControls] = useState(true), [loop, setLoop] = useState(false), [fit, setFit] = useState<VideoFit>('contain')
	const [events, setEvents] = useState<string[]>([]), [playing, setPlaying] = useState<boolean | undefined>(undefined)
	const report = (event: string) => setEvents((previous) => [...previous.slice(-5), event])
	return <VStack gap={2}>
		<TextInput label="Public HTTP(S) URL, absolute file, file URL or ~/ bundle source" value={draft} onChange={setDraft} />
		<Button label="Load source" clickAction={() => { setEvents([]); setSource(draft) }} />
		{shown ? <Video id="appkit-video" ref={player} src={source} playing={playing} loop={loop} fit={fit} controls={controls}
			style={{ width: 320, height: 220 }} accessibilityLabel="Video preview"
			onReady={(event) => report(`ready: ${event.duration}ms`)} onEnded={() => report('ended')}
			onError={(event) => report(event.message ?? 'failed')}
			onPlayingChange={(next) => { report(`playing request: ${next}`); if (playing !== undefined) setPlaying(next) }}
			onMutedChange={(next) => report(`muted: ${next}`)} /> : null}
		<Button label="Play / retry" clickAction={() => player.current?.play()} />
		<Button label="Pause" clickAction={() => player.current?.pause()} />
		<Button label="Seek to one second" clickAction={() => player.current?.seekTo(1000)} />
		<Button label="Read current time" clickAction={() => report(`time: ${player.current?.currentTime() ?? 0}ms`)} />
		<Button label="Control playback externally" clickAction={() => setPlaying(true)} />
		<Button label="Release controlled playback" clickAction={() => setPlaying(undefined)} />
		<Button label="Toggle controls" clickAction={() => setControls((value) => !value)} />
		<Button label="Toggle loop" clickAction={() => setLoop((value) => !value)} />
		<Button label="Cycle fit" clickAction={() => setFit((value) => value === 'contain' ? 'cover' : value === 'cover' ? 'fill' : 'contain')} />
		<Button label="Remove / restore video" clickAction={() => setShown((value) => !value)} />
		<Text>{events.join('; ') || 'No playback requested'}</Text>
		<Text>Manual native qualification only. No source loads until entered. Check playback/audio, pause, seek, replacement, loop, detach cleanup and actual input separately; mounting is not playback proof.</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('appkit-video'))
	ctx.record('qualification', 'Idle video controls mounted; no media/OS playback qualified')
}
