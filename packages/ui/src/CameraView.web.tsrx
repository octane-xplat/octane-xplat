import { useEffect, useRef } from 'octane';
import type { CameraViewProps } from './props';
import { applyEscapeProps } from './escape-props';
import { layoutChildProps } from './layout-child.web';

/** CameraView — live preview only: `getUserMedia` into a muted, autoplay,
 *  playsInline `<video>` (object-fit: cover matches the native plugins'
 *  fill-the-frame preview). The getUserMedia prompt IS the permission
 *  request — the leaf owns it on both platforms. `facing` maps to
 *  facingMode (`user`/`environment`); `active={false}` stops every track. */
export function CameraView(props: CameraViewProps) @{
	const el = useRef<HTMLVideoElement | null>(null);
	const facing = props.facing ?? 'back';
	const active = props.active !== false;
	const readyFired = useRef(false);

	useEffect(() => {
		const v = el.current;
		if (!v || !active) return;
		const md = navigator.mediaDevices;
		if (!md?.getUserMedia) {
			props.onError?.({ message: 'camera unsupported' });
			return;
		}

		let stream: MediaStream | null = null;
		let dead = false;
		readyFired.current = false;
		md.getUserMedia({
			video: { facingMode: facing === 'front' ? 'user' : 'environment' },
			audio: false,
		})
			.then((s) => {
				if (dead) {
					for (const t of s.getTracks()) t.stop();
					return;
				}

				stream = s;
				v.srcObject = s;
				v.play()?.catch(() => {});
			})
			.catch((e: any) => {
				props.onError?.({
					message: e?.name === 'NotAllowedError' ? 'camera permission denied' : String(e?.name ?? e),
				});
			});

		return () => {
			dead = true;
			v.srcObject = null;
			if (stream) for (const t of stream.getTracks()) t.stop();
		};
	}, [active, facing]);

	<div
		id={props.id}
		className={['vx-stack', 'vx-cameraview', props.className]}
		{...layoutChildProps(props, props.style)}
		role={props.accessibilityRole}
		aria-label={props.accessibilityLabel}
		aria-hidden={props.accessible === false ? true : undefined}
		aria-description={props.accessibilityHint}
		aria-valuetext={props.accessibilityValue}
		aria-disabled={props.accessibilityState?.disabled}
		aria-selected={props.accessibilityState?.selected}
		aria-checked={props.accessibilityState?.checked}
		aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
	>
		@if (active) {
			<video
				ref={(v: HTMLVideoElement | null) => {
					el.current = v;
					if (!v) return;
					applyEscapeProps(v, props);
					props.bind?.({ native: v });
				}}
				className="vx-cameraview-surface"
				muted={true}
				autoplay={true}
				playsInline={true}
				// Front previews are mirrored on the OS surfaces (SwiftyCam /
				// CameraX) — match that with a flip on web.
				style={facing === 'front' ? { transform: 'scaleX(-1)' } : undefined}
				onPlaying={() => {
					if (!readyFired.current) {
						readyFired.current = true;
						props.onReady?.();
					}
				}}
			/>
		}
	</div>
}
