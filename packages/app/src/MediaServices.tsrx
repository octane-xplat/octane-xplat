import { useEffect, useRef, useState } from 'octane';
import { Text, Pressable, Row, View } from '@octane-xplat/ui';
import { createHaptics } from '@octane-xplat/haptics';
import { createSoundBank } from '@octane-xplat/sounds';
import { createAudioPlayer } from '@octane-xplat/audio';

const sample = 'https://www.w3schools.com/html/horse.mp3';

export function MediaServices() @{
	const [playerState, setPlayerState] = useState('idle');
	const [position, setPosition] = useState('0 / 0s');
	const hapticsRef = useRef<ReturnType<typeof createHaptics> | null>(null);
	const realtimeRef = useRef<ReturnType<ReturnType<typeof createHaptics>['startRealtime']> | null>(null);
	const soundsRef = useRef<ReturnType<typeof createSoundBank> | null>(null);
	const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
	hapticsRef.current ??= createHaptics();
	soundsRef.current ??= createSoundBank({ maxVoices: 4 });
	playerRef.current ??= createAudioPlayer();
	const haptics = hapticsRef.current;
	const sounds = soundsRef.current;
	const player = playerRef.current;

	useEffect(() => {
		void sounds.load('tap', sample).catch((error) => console.warn('[media] sound preload failed', error));
		void player.setQueue([
			{ id: 'sample-one', source: sample, title: 'Sample audio 1', artist: 'Octane xplat' },
			{ id: 'sample-two', source: sample, title: 'Sample audio 2', artist: 'Octane xplat' },
		]).catch((error) => setPlayerState('error: ' + String(error)));

		const unsubscribe = player.subscribe((snapshot) => {
			setPlayerState(snapshot.state + (snapshot.track ? ' · ' + snapshot.track.id : ''));
			setPosition(Math.floor(snapshot.currentTime) + ' / ' + Math.floor(snapshot.duration) + 's');
		});

		return () => {
			unsubscribe();
			haptics.dispose();
			sounds.dispose();
			player.dispose();
		};
	}, []);

	const caps = player.capabilities();

	<View className="sink-section gap-2">
		<Text className="section-label">Optional media services</Text>
		<Row className="gap-2">
			<Pressable id="media-haptic-preset" onPress={() => haptics.play('success')} className="chip"><Text>Haptic preset</Text></Pressable>
			<Pressable id="media-haptic-pattern" onPress={() => haptics.playPattern({ duration: 240, points: [{ at: 0, intensity: 0.8 }, { at: 100, intensity: 0.3, sharpness: 0.8 }] })} className="chip"><Text>Haptic pattern</Text></Pressable>
			<Pressable id="media-haptic-live" onPressIn={() => { realtimeRef.current ??= haptics.startRealtime(); realtimeRef.current.update(0.8, 0.5); }} onPressOut={() => { realtimeRef.current?.stop(); realtimeRef.current = null; }} className="chip"><Text>Hold haptic</Text></Pressable>
		</Row>
		<Row className="gap-2">
			<Pressable id="media-sound-one" onPress={() => { void sounds.play('tap', { volume: 0.5 }); }} className="chip"><Text>UI sound</Text></Pressable>
			<Pressable id="media-sound-overlap" onPress={() => { void sounds.play('tap'); setTimeout(() => void sounds.play('tap'), 35); }} className="chip"><Text>Overlap ×2</Text></Pressable>
		</Row>
		<Row className="gap-2">
			<Pressable id="media-player-play" onPress={() => { void player.play().catch((error) => setPlayerState('error: ' + String(error))); }} className="chip"><Text>Play</Text></Pressable>
			<Pressable id="media-player-pause" onPress={() => { void player.pause(); }} className="chip"><Text>Pause</Text></Pressable>
			<Pressable id="media-player-seek" onPress={() => { void player.seek(10); }} className="chip"><Text>Seek 10s</Text></Pressable>
		</Row>
		<Text id="media-player-state">Player: {playerState} · {position}</Text>
		<Text>Background playback: {caps.backgroundPlayback ? 'available' : 'not available in this backend'}</Text>
		<Text>System controls: {caps.systemControls ? 'available' : 'not available in this backend'}</Text>
	</View>
}
