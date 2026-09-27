import { useRef, useState } from 'octane';
import { Button, Heading, Row, Text, Video, View } from '@octane-xplat/ui';
import type { VideoHandle } from '@octane-xplat/ui';

const SRC = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const POSTER = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.png';

/** Shared `Video` demo — the surface-hosted player: OS engine surface +
 *  the self-drawn transport (tap the frame to show/hide). Buttons exercise
 *  the controlled `playing` prop and the `bind` handle's seek. */
export function VideoDemo() @{
	const [playing, setPlaying] = useState(false);
	const [muted, setMuted] = useState(false);
	const [status, setStatus] = useState('idle');
	const handle = useRef<VideoHandle | null>(null);

	<View className="video-demo gap-4">
		<Heading level={2}>Video</Heading>
		<Video
			className="video-demo-player"
			src={SRC}
			poster={POSTER}
			playing={playing}
			muted={muted}
			onPlayingChange={setPlaying}
			onMutedChange={setMuted}
			onReady={(e) => setStatus(`ready ${(e.duration ?? 0) / 1000}s`)}
			onEnded={() => setStatus('ended')}
			onError={(e) => setStatus(`error ${e.message ?? ''}`)}
			bind={(h) => {
				handle.current = h;
			}}
		/>
		<Row className="gap-2">
			<Button className="btn btn-secondary" onPress={() => setPlaying(!playing)}>
				<Text>{playing ? 'Pause' : 'Play'}</Text>
			</Button>
			<Button
				className="btn btn-secondary"
				onPress={() => handle.current?.seekTo(15000)}
			>
				<Text>Seek 0:15</Text>
			</Button>
			<Button className="btn btn-secondary" onPress={() => setMuted(!muted)}>
				<Text>{muted ? 'Unmute' : 'Mute'}</Text>
			</Button>
		</Row>
		<Text className="text-sm text-muted">{status}</Text>
	</View>
}
