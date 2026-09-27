import { useEffect, useRef, useState } from 'octane';
import { Text, Pressable, Row, View } from '@octane-xplat/ui';
import { playPreset, playCustomPattern, setRealtime, stopRealtime, playUiTone, stopUiTones, createAudioPlayer } from '@xplat/media-probe';

export function MediaProbe() @{
	const [status, setStatus] = useState('idle');
	const [seconds, setSeconds] = useState(0);
	const [duration, setDuration] = useState(0);
	const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
	playerRef.current ??= createAudioPlayer();
	const player = playerRef.current;

	useEffect(() => {
		const timer = setInterval(() => {
			setSeconds(player.currentTime || 0);
			setDuration(player.duration || 0);
		}, 500);

		return () => {
			clearInterval(timer);
			void player.dispose();
			stopRealtime();
			stopUiTones();
		};
	}, []);

	const play = async () => {
		setStatus('loading');
		try {
			await player.ready;
			await player.play();
			setStatus('playing');
		} catch (error) {
			setStatus('error: ' + String(error));
		}
	};

	<View className="sink-section gap-2">
		<Text className="section-label">Media integration probe</Text>
		<Row className="gap-2">
			<Pressable id="media-haptic-preset" onPress={() => playPreset()} className="chip"><Text>Preset</Text></Pressable>
			<Pressable id="media-haptic-pattern" onPress={() => playCustomPattern()} className="chip"><Text>Pattern</Text></Pressable>
			<Pressable id="media-haptic-live" onPressIn={() => setRealtime(0.8)} onPressOut={() => stopRealtime()} className="chip"><Text>Hold haptic</Text></Pressable>
		</Row>
		<Row className="gap-2">
			<Pressable id="media-sound-one" onPress={() => playUiTone()} className="chip"><Text>UI tone</Text></Pressable>
			<Pressable id="media-sound-overlap" onPress={() => { playUiTone(); setTimeout(playUiTone, 35); }} className="chip"><Text>Overlap ×2</Text></Pressable>
		</Row>
		<Row className="gap-2">
			<Pressable id="media-player-play" onPress={play} className="chip"><Text>Play</Text></Pressable>
			<Pressable id="media-player-pause" onPress={async () => { await player.pause(); setStatus('paused'); }} className="chip"><Text>Pause</Text></Pressable>
			<Pressable id="media-player-seek" onPress={async () => { await player.seek(10); }} className="chip"><Text>Seek 10s</Text></Pressable>
		</Row>
		<Text id="media-player-state">Player: {status} · {Math.floor(seconds)} / {Math.floor(duration)}s</Text>
	</View>
}
