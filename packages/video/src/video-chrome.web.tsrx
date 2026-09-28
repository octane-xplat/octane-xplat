import { useEffect, useState } from 'octane';
import { Icon, Image, Pressable, Row, Slider, Text, View } from '@octane-xplat/ui';

/** Self-drawn video transport — the chrome half of the surface-hosted
 *  `Video` component. Identical structure to the native twin (only the
 *  pragma differs): every layer composes xplat primitives,
 *  so the transport draws the same pixels on every target — the leaf only
 *  supplies the surface. The layers stack inside the leaf's `vx-stack`
 *  grid (later = on top), so this fragment's children are each a
 *  full-frame layer. Times are milliseconds (matches both plugin players;
 *  the web leaf converts from `HTMLMediaElement`'s seconds). */
export interface VideoChromeProps {
	/** Frame image shown until playback first starts. */
	poster?: string
	started: boolean
	playing: boolean
	/** Playback position in ms. */
	position: number
	/** Clip duration in ms (0 until known). */
	duration: number
	muted: boolean
	onTogglePlay: () => void
	onToggleMute: () => void
	onSeek: (ms: number) => void
}

function stamp(ms: number): string {
	const total = Math.max(0, Math.floor(ms / 1000));
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function VideoChrome(props: VideoChromeProps) @{
	const [visible, setVisible] = useState(true);

	// Chrome auto-hides while playing; pausing or tapping brings it back.
	useEffect(() => {
		if (!props.playing || !visible) return;
		const t = setTimeout(() => setVisible(false), 2500);
		return () => clearTimeout(t);
	}, [props.playing, visible]);

	<>
		@if (props.poster && !props.started) {
			// aspectFill matches the web leaf's object-fit: cover.
			<Image
				className="vx-video-poster"
				src={props.poster}
				ios={{ stretch: 'aspectFill' }}
				android={{ stretch: 'aspectFill' }}
			/>
		}
		<Pressable
			className="vx-video-tap"
			accessibilityRole="button"
			accessibilityLabel={visible ? 'Hide video controls' : 'Show video controls'}
			onPress={() => setVisible(props.playing ? !visible : true)}
		/>
		@if (visible) {
			<>
				@if (!props.playing) {
					// While paused, tap anywhere on the frame is tap-to-play; the
					// show/hide tap layer beneath is reachable once it starts.
					<Pressable
						className="vx-video-center"
						justifyContent="center"
						alignItems="center"
						accessibilityRole="button"
						accessibilityLabel="Play"
						onPress={props.onTogglePlay}
					>
						<View className="vx-video-centerbtn">
							<Icon name="xplat-play" size={28} color="#fff" />
						</View>
					</Pressable>
				}
				// Positioning wrappers cover the frame — the web-only CSS pass gives
				// them pointer-events:none so taps reach the surface/tap layer; NS
				// layout views never capture touches without handlers.
				<View className="vx-video-barwrap" justifyContent="end">
					<Row className="vx-video-bar" alignItems="center" gap={8}>
						<Pressable
							className="vx-video-btn"
							accessibilityRole="button"
							accessibilityLabel={props.playing ? 'Pause' : 'Play'}
							onPress={props.onTogglePlay}
						>
							<Icon name={props.playing ? 'xplat-pause' : 'xplat-play'} size={20} color="#fff" />
						</Pressable>
						<Text className="vx-video-time">{stamp(props.position)}</Text>
						<Slider
							className="vx-video-slider"
							style={{ flexGrow: 1 }}
							value={props.position}
							minValue={0}
							maxValue={props.duration > 0 ? props.duration : 1}
							onValueChange={props.onSeek}
						/>
						<Text className="vx-video-time">{stamp(props.duration)}</Text>
						<Pressable
							className="vx-video-btn"
							accessibilityRole="button"
							accessibilityLabel={props.muted ? 'Unmute' : 'Mute'}
							onPress={props.onToggleMute}
						>
							<Icon
								name={props.muted ? 'xplat-volume-off' : 'xplat-volume'}
								size={20}
								color="#fff"
							/>
						</Pressable>
					</Row>
				</View>
			</>
		}
	</>
}
