/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useEffect, useMemo, useRef } from 'octane'
import type { AnimatedImageProps } from './props'
import { createAppKitAnimatedImageOwner, type AppKitAnimatedImageNative } from './animated-image-owner.macos.ts'

declare const XplatAnimatedImageView: { create(): AppKitAnimatedImageNative }

/** Experimental NSImageView animation; native compilation/playback remain unqualified. */
export function AnimatedImage(props: AnimatedImageProps) @{
	if (typeof XplatAnimatedImageView === 'undefined') throw Error('AppKit AnimatedImage bridge is unavailable; rebuild with @octane-xplat/gif')
	const latest = useRef(props); latest.current = props
	const owner = useMemo(() => createAppKitAnimatedImageOwner(() => latest.current), [])
	const create = useCallback((event: { view?: unknown }) => { const view = XplatAnimatedImageView.create(); event.view = view; owner.attach(view) }, [])
	useEffect(() => owner.sync(), [props.src, props.stretch, props.alt])
	useEffect(() => () => owner.dispose(), [])

	const dimensions = { ...(props.width !== undefined ? { width: props.width } : {}), ...(props.height !== undefined ? { height: props.height } : {}) }

	<placeholder onCreatingView={create} id={props.id} className={props.className}
		style={typeof props.style === 'string' ? props.style : { ...(props.style ?? {}), ...dimensions }} accessible={Boolean(props.alt)} accessibilityRole="image" accessibilityLabel={props.alt} />
}
