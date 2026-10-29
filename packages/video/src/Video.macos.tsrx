/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'octane'
import { Image } from '@octane-xplat/ui'
import type { VideoProps } from './props'
import { layoutChildProps } from './layout-child'
import { mergeStyle } from './style-merge'
import { VideoChrome } from './video-chrome.tsrx'
import { createAppKitVideoOwner, type AppKitVideoNative, type AppKitVideoState } from './video-owner.macos.ts'

declare const XplatVideoView: { create(): AppKitVideoNative }

/** AVPlayerLayer surface with shared self-drawn chrome. Native qualification pending. */
export function Video(props: VideoProps) @{
	if (typeof XplatVideoView === 'undefined') throw Error('AppKit Video bridge is unavailable; rebuild with @octane-xplat/video')
	const latest = useRef(props); latest.current = props
	const [state, setState] = useState<AppKitVideoState>({ playing: false, started: false, position: 0, duration: 0, muted: false })
	const owner = useMemo(() => createAppKitVideoOwner({ props: () => latest.current, publish: setState }), [])
	const create = useCallback((event: any) => { const native = XplatVideoView.create(); event.view = native; owner.attach(native) }, [])
	useImperativeHandle(props.ref, () => owner.handle, [props.ref])
	useEffect(() => { owner.sync() })
	useEffect(() => () => owner.dispose(), [])
	const style = mergeStyle({ display: 'grid', gridTemplateRows: '1fr', gridTemplateColumns: '1fr' }, props.style)

	<masonview id={props.id} className={['vx-layers', 'vx-video', props.className]}
		{...layoutChildProps(props, style)}
		accessible={props.accessible} accessibilityLabel={props.accessibilityLabel} accessibilityRole={props.accessibilityRole}
		accessibilityHint={props.accessibilityHint} accessibilityValue={props.accessibilityValue}
		accessibilityState={props.accessibilityState} accessibilityLiveRegion={props.accessibilityLiveRegion}>
		<placeholder onCreatingView={create} className="vx-video-surface" style={{ gridRow: '1', gridColumn: '1', width: '100%', height: '100%' }} />
		@if (props.controls !== false) {
			<VideoChrome poster={props.poster} started={state.started} playing={state.playing} position={state.position}
				duration={state.duration} muted={state.muted} onTogglePlay={owner.togglePlay} onToggleMute={owner.toggleMute} onSeek={owner.handle.seekTo} />
		} @else if (props.poster && !state.started) {
			<Image className="vx-video-poster" src={props.poster} contentFit="cover" />
		}
	</masonview>
}
