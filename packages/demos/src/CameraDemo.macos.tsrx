/** @jsxImportSource @octane-xplat/macos-renderer */
import { useEffect, useState } from 'octane'
import { Button, Heading, HStack, Text, View } from '@octane-xplat/ui'
import {
	CameraView,
	createCameraSession,
	type CameraSession,
	type MovieTake,
} from '@octane-xplat/camera'

/** AppKit camera demo — live preview plus a session-backed record/stop pass
 *  exercising the shared movie-capture contract on the AVFoundation adapter. */
export function CameraDemo() @{
	const [session] = useState<CameraSession>(() => createCameraSession())
	const [active, setActive] = useState(true)
	const [recording, setRecording] = useState(false)
	const [status, setStatus] = useState('starting…')
	const [take, setTake] = useState<MovieTake | undefined>()

	useEffect(() => () => void session.dispose(), [session])

	const start = async () => {
		try {
			const permission = await session.requestPermission('camera')
			if (permission !== 'granted') {
				setStatus(`camera permission ${permission}`)
				return
			}

			const next = session.startRecording()
			setTake(next)
			setRecording(true)
			setStatus('recording…')
			void next.completion.then((outcome) => {
				setRecording(false)
				setTake(undefined)
				if (outcome.kind === 'clip') {
					const clip = outcome.clip
					setStatus(
						`saved ${clip.durationMs}ms ${clip.width}x${clip.height} — ${clip.output.fileUrl ?? clip.output.resourceId}`,
					)
				} else {
					setStatus(`failed ${outcome.stage}: ${outcome.error.kind}`)
				}
			})
		} catch (error: any) {
			setStatus(`record failed ${error?.kind ?? error?.message ?? error}`)
		}
	}

	const stop = () => {
		setStatus('finalizing…')
		void take?.stop()
	}

	<View className="camera-demo gap-4">
		<Heading level={2}>Camera</Heading>
		<CameraView
			className="camera-demo-preview"
			session={session}
			active={active}
			style={{ width: 480, height: 360 }}
			onReady={() => {
				if (!recording) setStatus('preview live')
			}}
			onError={(e) => setStatus(`error ${e.message ?? ''}`)}
		/>
		<HStack className="gap-2 items-center">
			<Button className="btn btn-secondary" onPress={() => setActive(!active)}>
				<Text>{active ? 'Stop preview' : 'Start preview'}</Text>
			</Button>
			{recording ? (
				<Button className="btn btn-secondary" id="camera-stop" onPress={stop}>
					<Text>Stop recording</Text>
				</Button>
			) : (
				<Button className="btn btn-secondary" id="camera-record" onPress={start}>
					<Text>Record</Text>
				</Button>
			)}
		</HStack>
		<Text id="camera-status" className="text-sm text-muted">
			{status}
		</Text>
	</View>;
}
