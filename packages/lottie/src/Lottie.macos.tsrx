/** @jsxImportSource @octane-xplat/macos-renderer */
import { useEffect, useImperativeHandle, useMemo, useRef } from 'octane'
import { layoutChildProps } from './layout-child'
import type { LottieHandle, LottieProps } from './props'

type AppKitLottieAdapter = {
	nativeView: any
	durationMs: number
	progress: number
	isPlaying: boolean
	onLoaded: ((duration: number) => void) | null
	onEnded: (() => void) | null
	onError: ((message: string) => void) | null
	mountIn(host: any): void
	loadJSON(json: string): void
	loadFile(pathOrURL: string): void
	loadURL(address: string): void
	clear(): void
	play(): void
	pause(): void
	stop(): void
	seekTo(progress: number): void
	speed: number
	loop: boolean
	fit: string
	dispose(): void
}

function createHandle(adapter: AppKitLottieAdapter): LottieHandle {
	return {
		play: () => adapter.play(),
		pause: () => adapter.pause(),
		stop: () => adapter.stop(),
		seekTo: (progress) => adapter.seekTo(progress),
		setSpeed: (speed) => {
			adapter.speed = speed
		},
		progress: () => adapter.progress,
		duration: () => adapter.durationMs,
		isPlaying: () => adapter.isPlaying,
		native: adapter.nativeView,
	}
}

/** AppKit Lottie uses the vendored Airbnb engine through the macOS leaf build. */
export function Lottie(props: LottieProps) @{
	const adapter = useMemo(
		() => (globalThis as any).XplatLottieAdapter.new() as AppKitLottieAdapter,
		[],
	)
	const latest = useRef(props)
	latest.current = props

	useImperativeHandle<LottieHandle>(props.ref, () => createHandle(adapter), [adapter])

	useEffect(() => {
		adapter.onLoaded = (duration) => {
			const current = latest.current
			if (current.speed !== undefined) adapter.speed = current.speed
			if (current.progress !== undefined) adapter.seekTo(current.progress)
			current.onLoaded?.({ duration })
			if (current.playing ?? current.autoPlay ?? true) adapter.play()
		}
		adapter.onEnded = () => latest.current.onEnded?.()
		adapter.onError = (message) => latest.current.onError?.({ message })

		return () => adapter.dispose()
	}, [])

	useEffect(() => {
		if (props.data !== undefined) {
			try {
				adapter.loadJSON(JSON.stringify(props.data))
			} catch (error) {
				props.onError?.({ message: String(error) })
			}
			return
		}

		const src = props.src
		if (!src) {
			adapter.clear()
		} else if (src.trimStart().startsWith('{')) {
			adapter.loadJSON(src)
		} else if (/^https?:\/\//i.test(src)) {
			adapter.loadURL(src)
		} else {
			adapter.loadFile(src)
		}
	}, [props.src, props.data])

	useEffect(() => {
		adapter.fit = props.fit ?? 'contain'
	}, [props.fit])

	useEffect(() => {
		if (props.loop !== undefined) adapter.loop = props.loop
	}, [props.loop])

	useEffect(() => {
		if (props.speed !== undefined) adapter.speed = props.speed
	}, [props.speed])

	useEffect(() => {
		if (props.progress !== undefined && adapter.durationMs > 0) {
			adapter.seekTo(props.progress)
		}
	}, [props.progress])

	useEffect(() => {
		if (props.playing === undefined || adapter.durationMs === 0) return
		if (props.playing) adapter.play()
		else adapter.pause()
	}, [props.playing])

	<flexboxlayout
		ref={(host: any) => host && adapter.mountIn(host)}
		id={props.id}
		className={props.className}
		style={props.style}
		{...layoutChildProps(props)}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole ?? 'image'}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={props.accessibilityState}
	/>
}
