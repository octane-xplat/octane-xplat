import { useRef, useState } from 'octane';
import { Button, Heading, Row, Text, View } from '@octane-xplat/ui';
import { Lottie } from '@octane-xplat/lottie';
import type { LottieHandle } from '@octane-xplat/lottie';
import animation from './pinjump-anim';

/** Shared `Lottie` demo — same animation data, same props, on lottie-web
 *  (web) and @nativescript-community/ui-lottie (native). Buttons drive the
 *  controlled `playing` prop and the `bind` handle; status surfaces the
 *  normalized events (duration is ms on both platforms). */
export function LottieDemo() @{
	const [playing, setPlaying] = useState(false);
	const [loop, setLoop] = useState(false);
	const [speed, setSpeed] = useState(1);
	const [status, setStatus] = useState('idle');
	const handle = useRef<LottieHandle | null>(null);

	<View className="lottie-demo gap-4">
		<Heading level={2}>Lottie</Heading>
		<Lottie
			className="lottie-demo-anim"
			data={animation}
			playing={playing}
			loop={loop}
			speed={speed}
			autoPlay={false}
			accessibilityLabel="pinjump animation"
			onLoaded={(e) => setStatus(`loaded ${e.duration}ms`)}
			onEnded={() => setStatus('ended')}
			onError={(e) => setStatus(`error ${e.message ?? ''}`)}
			bind={(h) => {
				handle.current = h;
			}}
		/>
		<Text className="lottie-demo-status">{status}</Text>
		<Row className="gap-2">
			<Button className="btn btn-secondary" onPress={() => setPlaying(!playing)}>
				<Text>{playing ? 'Pause' : 'Play'}</Text>
			</Button>
			<Button
				className="btn btn-secondary"
				onPress={() => {
					handle.current?.stop();
					setPlaying(false);
					setStatus('stopped');
				}}
			>
				<Text>Stop</Text>
			</Button>
			<Button className="btn btn-secondary" onPress={() => setLoop(!loop)}>
				<Text>Loop {loop ? 'on' : 'off'}</Text>
			</Button>
			<Button
				className="btn btn-secondary"
				onPress={() => {
					handle.current?.seekTo(0.5);
					setStatus('seek 0.5');
				}}
			>
				<Text>Seek 50%</Text>
			</Button>
			<Button
				className="btn btn-secondary"
				onPress={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 0.5 : 1)}
			>
				<Text>{speed}x</Text>
			</Button>
		</Row>
	</View>
}
