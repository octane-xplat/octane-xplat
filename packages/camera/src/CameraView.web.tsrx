import { useImperativeHandle, useEffect, useRef } from 'octane'
import type { CameraViewProps } from './props'
import { applyEscapeProps, layoutChildProps } from './layout-child.web'

/** Live web preview backed by getUserMedia. */
export function CameraView(props: CameraViewProps) @{
	const hostRef = useRef<any>(null);
	const video = useRef<HTMLVideoElement | null>(null)
	const facing = props.facing ?? 'back'
	const active = props.active !== false
	const readyFired = useRef(false)

	useEffect(() => {
		const element = video.current
		if (!element || !active) return
		if (props.session) {
			// Session-backed previews arrive with the web capture adapter;
			// owning a second stream would break the shared-session model.
			props.onError?.({
				message:
					props.facing !== undefined
						? 'camera session conflicts with facing'
						: 'camera sessions are not supported on this platform yet',
			})

			return
		}

		const mediaDevices = navigator.mediaDevices
		if (!mediaDevices?.getUserMedia) {
			props.onError?.({ message: 'camera unsupported' })
			return
		}

		let stream: MediaStream | null = null
		let disposed = false
		readyFired.current = false
		mediaDevices
			.getUserMedia({
				video: { facingMode: facing === 'front' ? 'user' : 'environment' },
				audio: false,
			})
			.then((nextStream) => {
				if (disposed) {
					for (const track of nextStream.getTracks()) track.stop()
					return
				}

				stream = nextStream
				element.srcObject = nextStream
				element.play()?.catch(() => {})
			})
			.catch((error: any) => {
				props.onError?.({
					message:
						error?.name === 'NotAllowedError'
							? 'camera permission denied'
							: String(error?.name ?? error ?? 'camera error'),
				})
			})

		return () => {
			disposed = true
			element.srcObject = null
			if (stream) for (const track of stream.getTracks()) track.stop()
		}
	}, [active, facing, props.session])

	useImperativeHandle(props.ref, () => ({ native: hostRef.current }), undefined);

	<div
		id={props.id}
		className={['vx-layers', 'vx-cameraview', props.className]}
		{...layoutChildProps(props, {
			position: 'relative',
			overflow: 'hidden',
			backgroundColor: '#000',
			...props.style,
		})}
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
				ref={(element: HTMLVideoElement | null) => {
				hostRef.current = element;
					video.current = element
					if (!element) return
					applyEscapeProps(element, props)
				}}
				muted={true}
				autoplay={true}
				playsInline={true}
				style={{
					display: 'block',
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: facing === 'front' ? 'scaleX(-1)' : undefined,
				}}
				onPlaying={() => {
					if (readyFired.current) return
					readyFired.current = true
					props.onReady?.()
				}}
			/>
		}
	</div>
}
